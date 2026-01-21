import google.generativeai as genai
import os
import json
import re
from typing import List, Dict, Optional
import traceback
import time
from google.api_core import exceptions
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
import random
import requests
import html

class QuizGenerator:
    def __init__(self):
        print("Initializing Quiz Generator with Gemini API...")
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.models_to_try = []

        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found in environment variables.")
        else:
            try:
                genai.configure(api_key=self.api_key)
                
                # 1. List available models
                available_models = []
                try:
                    for m in genai.list_models():
                        if 'generateContent' in m.supported_generation_methods:
                            available_models.append(m.name)
                    print(f"Available models: {available_models}")
                except Exception as e:
                    print(f"Could not list models: {e}")
                    # Fallback list if listing fails
                    available_models = ["models/gemini-1.5-flash", "models/gemini-pro"]

                # 2. Build prioritized list of usable models
                # Priority: Flash (fast/cheap) -> Pro (better) -> Legacy
                # We prioritize newer flash models as they are usually most generous with free tier
                candidates = [
                    "gemini-1.5-flash", 
                    "gemini-flash",
                    "gemini-2.0-flash", 
                    "gemini-1.5-pro",
                    "gemini-pro"
                ]
                
                self.models_to_try = []
                
                # Add matched candidates first
                for candidate in candidates:
                    for m in available_models:
                        if candidate in m and m not in self.models_to_try:
                            self.models_to_try.append(m)
                
                # Add any remaining available models that weren't in our candidate list
                # This ensures we don't miss any obscure working model associated with the key
                for m in available_models:
                    if m not in self.models_to_try:
                        self.models_to_try.append(m)
                
                # If list is empty (listing failed + no fallback matches), force some defaults
                if not self.models_to_try:
                    self.models_to_try = ["models/gemini-1.5-flash", "models/gemini-pro"]
                    
                print(f"Model priority list: {self.models_to_try}")
                
            except Exception as e:
                print(f"Error configuring Gemini API: {e}")
                self.models_to_try = []

        # Local AI State
        self.local_tokenizer = None
        self.local_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Local AI will use device: {self.device}")

    def _init_local_model(self):
        """Lazy initialization of local AI model"""
        if self.local_model is None:
            try:
                print("Loading local AI model (google/flan-t5-small)...")
                model_name = "google/flan-t5-small"
                self.local_tokenizer = T5Tokenizer.from_pretrained(model_name)
                self.local_model = T5ForConditionalGeneration.from_pretrained(model_name).to(self.device)
                print("Local AI model loaded successfully")
            except Exception as e:
                print(f"Error loading local model: {e}")
                return False
        return True

    def generate_quiz(self, topics: List[str], context: str = "", num_questions: int = 10, difficulty: str = "medium", bloom_level: str = "Mixed") -> Dict:
        """Generate quiz questions using Gemini API, Local AI, or External APIs"""
        print(f"Generating {num_questions} questions ({bloom_level}) for topics: {topics[:3]}...")
        
        # 1. Try External API for general topics if Gemini is missing or as a mix-in
        if bloom_level == "None" and random.random() < 0.3: # 30% chance to use external trivia for standard quizzes
             external = self._fetch_external_trivia(num_questions)
             if external: return external

        # 2. Try Gemini if available
        if self.models_to_try:
            prompt = self._create_prompt(topics, context, num_questions, difficulty, bloom_level)
            
            for model_name in self.models_to_try:
                print(f"Attempting generation with model: {model_name}")
                for attempt in range(2): 
                    try:
                        model = genai.GenerativeModel(model_name)
                        response = model.generate_content(prompt)
                        return self._parse_gemini_response(response.text, topics, difficulty)
                    except exceptions.ResourceExhausted:
                        print(f"Rate limit hit for {model_name}.")
                        break 
                    except Exception as e:
                        print(f"Error with {model_name}: {e}")
                        if attempt == 0: time.sleep(1)

        # 2. Try Local AI if Gemini failed or unavailable
        if self._init_local_model():
            print("Using local AI for question generation...")
            return self._generate_local_quiz(topics, context, num_questions, difficulty, bloom_level)
            
        # 3. Last resort fallback
        print("All AI attempts failed. Using rule-based fallback.")
        return self._generate_fallback_quiz(topics, num_questions, difficulty)

    def _create_prompt(self, topics: List[str], context: str, num_questions: int, difficulty: str, bloom_level: str) -> str:
        topics_str = ", ".join(topics)
        context_preview = context[:4000] # Cap context for token limits
        
        bloom_instructions = {
            "None": "Standard generation. Create clear, factual, and conceptual questions across the topic.",
            "Remember": "Focus on recall of facts and basic concepts. Use terms like 'Define', 'List', 'State'.",
            "Understand": "Explain ideas or concepts. Use terms like 'Classify', 'Describe', 'Discuss'.",
            "Apply": "Use information in new situations. Use terms like 'Calculate', 'Solve', 'Illustrate'.",
            "Analyze": "Draw connections among ideas. Use terms like 'Differentiate', 'Organize', 'Contrast'.",
            "Evaluate": "CRITICAL THINKING: Requires assessment. Ask the user to judge, critique, or justify a stand. Use terms like 'Evaluate the impact', 'Critique the strategy', 'Assess the effectiveness'. Options should be complex rationales.",
            "Mixed": "Vary the depth across the questions from basic recall to complex analysis."
        }.get(bloom_level, "Vary the depth of questions.")

        return f"""
        You are an expert quiz generator. Create {num_questions} MCQs based on the provided context.
        
        Context:
        {context_preview}
        
        Focus Topics: {topics_str}
        Bloom's Level: {bloom_level}
        Depth Instruction: {bloom_instructions}
        
        JSON constraints:
        - ONLY return raw JSON array.
        - Fields: "question", "options" (4 strings), "correct_answer" (index).
        - No markdown, no HTML tags (remove artifacts like <a>), no math symbols ($).
        - For 'Evaluate' level, ensure the question requires JUDGMENT based on the text.
        """

    def _extract_complex_terms(self, text: str) -> List[str]:
        """Ported from SocratAI: extract meaningful technical anchors"""
        terms = re.findall(r'\b[A-Z][a-z]{5,}\b|\b\w{11,}\b', text)
        stop_words = {'However', 'Because', 'Therefore', 'Although', 'Unlike', 'Finally', 'Moreover', 'Quantum'}
        return list(set([t for t in terms if t not in stop_words]))

    def _generate_local_quiz(self, topics: List[str], context: str, num_questions: int, difficulty: str, bloom_level: str) -> Dict:
        """Enhanced Local Model generation using Entity Anchors and Smarter Distractors"""
        segments = [s.strip() for s in context.split('.') if len(s.strip()) > 60]
        if not segments: segments = topics 
        random.shuffle(segments)
        
        questions = []
        used_anchors = set()
        all_terms = self._extract_complex_terms(context)

        for i in range(min(num_questions, len(segments))):
            seg = segments[i]
            
            # 1. Select Anchor
            candidates = self._extract_complex_terms(seg)
            anchor = next((c for c in candidates if c not in used_anchors), None)
            if not anchor:
                anchor = random.choice(candidates) if candidates else (topics[i % len(topics)] if topics else "concept")
            used_anchors.add(anchor)

            # 2. Generate Question using Local AI
            # Adjust prompt based on Bloom's
            bloom_verb = {
                "None": "Explain",
                "Remember": "Recall", "Understand": "Describe", 
                "Apply": "Apply", "Analyze": "Analyze", "Evaluate": "Assess"
            }.get(bloom_level, "Explain")
            
            q_prompt = f"Context: {seg}. Task: As a professor, {bloom_verb} the importance of {anchor}:"
            
            inputs = self.local_tokenizer(q_prompt, return_tensors="pt", max_length=256, truncation=True).to(self.device)
            with torch.no_grad():
                outputs = self.local_model.generate(**inputs, max_length=64, do_sample=True, temperature=0.7)
            question_text = self.local_tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Fallback for short AI output
            if len(question_text) < 15:
                question_text = f"Based on the analysis of {anchor}, how would you describe its primary function?"

            # 3. Smart Distractors (SocratAI logic)
            # Find peers (terms from context that aren't the anchor)
            peers = [p for p in all_terms if p.lower() != anchor.lower()]
            options = [anchor]
            
            # Select 3 distractors from peers
            if len(peers) >= 3:
                options.extend(random.sample(peers, 3))
            else:
                # Add generic academic-sounding fillers if context is thin
                fillers = ["Systematic Variant", "Procedural Method", "Framework Component"]
                options.extend(peers)
                options.extend(fillers[:(4-len(options))])
            
            random.shuffle(options)
            
            questions.append({
                "question": question_text if "?" in question_text else question_text + "?",
                "options": options[:4],
                "correct_answer": options[:4].index(anchor)
            })

        return {
            "questions": questions,
            "difficulty": difficulty,
            "bloom_level": bloom_level,
            "topic_count": len(topics)
        }

    def _parse_gemini_response(self, response_text: str, topics: List[str], difficulty: str) -> Dict:
        try:
            # Clean up potential markdown code blocks
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            
            questions = json.loads(clean_text)
            
            # Basic validation
            valid_questions = []
            for q in questions:
                if "question" in q and "options" in q and "correct_answer" in q:
                    if isinstance(q["options"], list) and len(q["options"]) == 4:
                        valid_questions.append(q)
            
            return {
                "questions": valid_questions,
                "difficulty": difficulty,
                "topic_count": len(topics)
            }
        except json.JSONDecodeError:
            print(f"Failed to decode JSON from Gemini: {response_text[:100]}...")
            return self._generate_fallback_quiz(topics, 1, difficulty)

    def _fetch_external_trivia(self, num_questions: int) -> Optional[Dict]:
        """Fetch general trivia from Open Trivia DB as a fallback/alternative"""
        try:
            print("Fetching questions from Open Trivia DB...")
            url = f"https://opentdb.com/api.php?amount={num_questions}&type=multiple"
            response = requests.get(url, timeout=5)
            data = response.json()
            
            if data.get("response_code") == 0:
                questions = []
                for q in data["results"]:
                    opts = [html.unescape(o) for o in q["incorrect_answers"]]
                    correct = html.unescape(q["correct_answer"])
                    opts.append(correct)
                    random.shuffle(opts)
                    
                    questions.append({
                        "question": html.unescape(q["question"]),
                        "options": opts,
                        "correct_answer": opts.index(correct),
                        "source": "OpenTriviaDB"
                    })
                return {
                    "questions": questions,
                    "difficulty": "mixed",
                    "bloom_level": "None",
                    "topic_count": 0
                }
        except Exception as e:
            print(f"External API error: {e}")
        return None

    def _generate_fallback_quiz(self, topics: List[str], num_questions: int, difficulty: str) -> Dict:
        """Simple rule-based fallback if API fails"""
        questions = []
        topic_count = len(topics)
        
        for i in range(num_questions):
            topic = topics[i % topic_count] if topics else "General Knowledge"
            questions.append({
                "question": f"What is a key aspect of {topic}?",
                "options": [
                    f"It is fundamental to the subject.",
                    "It is unrelated.",
                    "It is deprecated.",
                    "None of the above."
                ],
                "correct_answer": 0
            })
            
        return {
            "questions": questions,
            "difficulty": difficulty,
            "topic_count": len(topics)
        }
