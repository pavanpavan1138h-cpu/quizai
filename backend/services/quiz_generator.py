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
        print("Initializing Enhanced Quiz Generator with Gemini API...")
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.models_to_try = []

        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found in environment variables.")
        else:
            try:
                genai.configure(api_key=self.api_key)
                
                # List available models
                available_models = []
                try:
                    for m in genai.list_models():
                        if 'generateContent' in m.supported_generation_methods:
                            available_models.append(m.name)
                    print(f"Available models: {available_models}")
                except Exception as e:
                    print(f"Could not list models: {e}")
                    available_models = ["models/gemini-1.5-flash", "models/gemini-pro"]

                # Build prioritized list - prefer lite/flash models for speed
                candidates = [
                    "gemini-2.0-flash-lite",  # Fastest
                    "gemini-2.0-flash",
                    "gemini-1.5-flash", 
                    "gemini-flash",
                    "gemini-1.5-pro",
                    "gemini-pro"
                ]
                
                self.models_to_try = []
                for candidate in candidates:
                    for m in available_models:
                        if candidate in m and m not in self.models_to_try:
                            self.models_to_try.append(m)
                
                for m in available_models:
                    if m not in self.models_to_try:
                        self.models_to_try.append(m)
                
                if not self.models_to_try:
                    self.models_to_try = ["models/gemini-1.5-flash", "models/gemini-pro"]
                    
                print(f"Model priority list: {self.models_to_try}")
                
            except Exception as e:
                print(f"Error configuring Gemini API: {e}")
                self.models_to_try = []

        # Local AI State (fallback)
        self.local_tokenizer = None
        self.local_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Local AI will use device: {self.device}")

    def _init_local_model(self):
        """Lazy initialization of local AI model"""
        if self.local_model is None:
            try:
                print("Loading local AI model (google/flan-t5-base)...")
                model_name = "google/flan-t5-base"  # Upgraded from small
                self.local_tokenizer = T5Tokenizer.from_pretrained(model_name)
                self.local_model = T5ForConditionalGeneration.from_pretrained(model_name).to(self.device)
                print("Local AI model loaded successfully")
            except Exception as e:
                print(f"Error loading local model: {e}")
                return False
        return True

    def generate_quiz(self, topics: List[str], context: str = "", num_questions: int = 10, difficulty: str = "medium", bloom_level: str = "Mixed") -> Dict:
        """Generate high-quality quiz questions using AI"""
        print(f"Generating {num_questions} questions ({bloom_level}) for topics: {topics[:3]}...")
        
        # Try Gemini first (primary - best quality)
        if self.models_to_try:
            result = self._generate_with_gemini(topics, context, num_questions, difficulty, bloom_level)
            if result and len(result.get("questions", [])) >= num_questions // 2:
                return result
        
        # Try external trivia for general knowledge (secondary)
        if not context or len(context.strip()) < 100:
            external = self._fetch_external_trivia(num_questions)
            if external:
                return external
        
        # Local AI fallback (tertiary)
        if self._init_local_model():
            print("Using local AI for question generation...")
            return self._generate_local_quiz(topics, context, num_questions, difficulty, bloom_level)
            
        # Last resort fallback
        print("All AI attempts failed. Using enhanced rule-based fallback.")
        return self._generate_fallback_quiz(topics, num_questions, difficulty)

    def _generate_with_gemini(self, topics: List[str], context: str, num_questions: int, difficulty: str, bloom_level: str) -> Optional[Dict]:
        """Generate questions using Gemini with enhanced Chain-of-Thought prompting"""
        
        prompt = self._create_enhanced_prompt(topics, context, num_questions, difficulty, bloom_level)
        
        for model_name in self.models_to_try:
            print(f"Attempting generation with model: {model_name}")
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.7,
                            top_p=0.9,
                            max_output_tokens=4096
                        )
                    )
                    result = self._parse_gemini_response(response.text, topics, difficulty, bloom_level)
                    if result and result.get("questions"):
                        print(f"Successfully generated {len(result['questions'])} questions with {model_name}")
                        return result
                except exceptions.ResourceExhausted:
                    print(f"Rate limit hit for {model_name}.")
                    break
                except Exception as e:
                    print(f"Error with {model_name}: {e}")
                    if attempt == 0:
                        time.sleep(1)
        return None

    def _create_enhanced_prompt(self, topics: List[str], context: str, num_questions: int, difficulty: str, bloom_level: str) -> str:
        """Create an enhanced Chain-of-Thought prompt for high-quality question generation"""
        
        topics_str = ", ".join(topics[:10])
        context_preview = context[:6000] if context else ""
        
        difficulty_guide = {
            "easy": "Test basic recall and fundamental understanding. Use straightforward language.",
            "medium": "Test application and analysis. Require connecting multiple concepts.",
            "hard": "Test evaluation and synthesis. Require deep understanding and critical thinking."
        }.get(difficulty, "Mix of difficulty levels.")
        
        bloom_guide = {
            "Remember": "Focus on factual recall: Define, List, State, Identify.",
            "Understand": "Test comprehension: Explain, Describe, Summarize, Interpret.",
            "Apply": "Use knowledge in new situations: Calculate, Solve, Demonstrate, Apply.",
            "Analyze": "Break down concepts: Compare, Contrast, Differentiate, Organize.",
            "Evaluate": "Make judgments: Assess, Critique, Justify, Evaluate effectiveness.",
            "Mixed": "Vary across Bloom's levels for comprehensive assessment."
        }.get(bloom_level, "Mix of cognitive levels.")

        return f'''You are an expert academic question writer. Your task is to create {num_questions} high-quality multiple choice questions.

=== SOURCE MATERIAL ===
Topics: {topics_str}

Context:
{context_preview if context_preview else "No specific context provided. Generate questions based on general knowledge of the topics."}

=== GENERATION REQUIREMENTS ===

DIFFICULTY: {difficulty.upper()}
{difficulty_guide}

BLOOM'S LEVEL: {bloom_level}
{bloom_guide}

=== CRITICAL QUALITY RULES ===

1. **SPECIFIC QUESTIONS**: Each question must test a specific fact, concept, or relationship from the material.
   - BAD: "Why is Machine Learning important?"
   - GOOD: "What is the primary purpose of the activation function in a neural network?"

2. **PLAUSIBLE DISTRACTORS**: All 4 options must be:
   - From the SAME domain/category (all are algorithms, all are numbers, all are processes)
   - Grammatically consistent with the question stem
   - Similar in length and complexity
   - Actually wrong but believably so
   
   - BAD OPTIONS: "It tastes good", "It causes global warming", "None of the above"
   - GOOD OPTIONS: For a question about neural network activation functions:
     * "To introduce non-linearity into the network" (CORRECT)
     * "To normalize the input values between layers"
     * "To reduce the number of parameters in the model"
     * "To calculate the loss function gradient"

3. **UNAMBIGUOUS ANSWERS**: Only one option should be definitively correct.

4. **NO TRICKS**: Avoid "All of the above", "None of the above", or trick questions.

5. **CONTEXT-GROUNDED**: If context is provided, questions MUST be answerable from that context.

=== THINK STEP BY STEP ===

For each question:
1. Identify a specific testable fact or concept from the material
2. Formulate a clear, unambiguous question
3. Write the correct answer
4. Generate 3 plausible but incorrect alternatives from the same domain
5. Verify only one answer is correct
6. Shuffle options randomly

=== OUTPUT FORMAT ===

Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.

[
  {{
    "question": "Clear, specific question text ending with a question mark?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0
  }}
]

Where correct_answer is the 0-indexed position (0, 1, 2, or 3) of the correct option.

Generate exactly {num_questions} questions now:'''

    def extract_topics(self, context: str) -> List[str]:
        """Intelligently extract granular topics from syllabus/text using AI"""
        print(f"Extracting topics from context (length: {len(context)})...")
        context_preview = context[:8000]
        
        if self.models_to_try:
            prompt = f'''Analyze this academic text and extract specific, testable topics.

TEXT:
{context_preview}

EXTRACTION RULES:
1. Extract SPECIFIC concepts, not generic categories
   - BAD: "Mathematics", "Chapter 1", "Introduction"
   - GOOD: "Gaussian Elimination", "Matrix Inverse", "Eigenvalue Decomposition"

2. Focus on TESTABLE items that could become quiz questions
3. Include technical terms, theorems, algorithms, definitions
4. Extract 10-25 specific topics
5. Ignore: dates, page numbers, instructor names, logistics

Return ONLY a JSON array of strings. No explanation.
Example: ["Backpropagation", "Gradient Descent", "Learning Rate", "Overfitting"]'''
            
            for model_name in self.models_to_try:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    
                    match = re.search(r'\[.*\]', response.text, re.DOTALL)
                    if match:
                        topics = json.loads(match.group())
                        if topics and isinstance(topics, list):
                            # Clean up topics
                            cleaned = []
                            for t in topics:
                                if isinstance(t, str):
                                    t = re.sub(r'^(Topic|Unit|Chapter|Module|Section)\s*\d*[:\.-]?\s*', '', t, flags=re.IGNORECASE)
                                    t = re.sub(r'^\d+[\)\.]\s*', '', t)
                                    t = t.strip()
                                    if len(t) > 3 and t not in cleaned:
                                        cleaned.append(t)
                            
                            print(f"Extracted {len(cleaned)} topics: {cleaned[:5]}...")
                            return cleaned[:25]
                except Exception as e:
                    print(f"Topic extraction error with {model_name}: {e}")
                    continue

        # Fallback: Extract key terms using NLP patterns
        return self._extract_topics_regex(context_preview)

    def _extract_topics_regex(self, text: str) -> List[str]:
        """Fallback topic extraction using regex patterns"""
        # Find capitalized terms, technical terms, etc.
        patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b',  # Title Case phrases
            r'\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b',  # Acronyms
            r'\b\w+(?:tion|ment|ity|ism|ology)\b',  # Common noun suffixes
        ]
        
        topics = set()
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for m in matches:
                if len(m) > 5 and len(m) < 50:
                    topics.add(m.strip())
        
        return list(topics)[:20]

    def _parse_gemini_response(self, response_text: str, topics: List[str], difficulty: str, bloom_level: str) -> Dict:
        """Parse and validate Gemini response"""
        try:
            # Clean up response
            clean_text = response_text.strip()
            clean_text = re.sub(r'^```(?:json)?\s*', '', clean_text)
            clean_text = re.sub(r'\s*```$', '', clean_text)
            clean_text = clean_text.strip()
            
            # Find JSON array
            match = re.search(r'\[[\s\S]*\]', clean_text)
            if not match:
                print(f"No JSON array found in response")
                return None
                
            questions = json.loads(match.group())
            
            # Validate each question
            valid_questions = []
            for q in questions:
                if self._validate_question(q):
                    valid_questions.append(q)
                else:
                    print(f"Filtered out invalid question: {q.get('question', 'N/A')[:50]}...")
            
            print(f"Validated {len(valid_questions)}/{len(questions)} questions")
            
            return {
                "questions": valid_questions,
                "difficulty": difficulty,
                "bloom_level": bloom_level,
                "topic_count": len(topics)
            }
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Response preview: {response_text[:200]}...")
            return None
        except Exception as e:
            print(f"Parse error: {e}")
            return None

    def _validate_question(self, q: Dict) -> bool:
        """Validate a single question for quality"""
        # Required fields
        if not all(k in q for k in ["question", "options", "correct_answer"]):
            return False
        
        # Must have exactly 4 options
        if not isinstance(q["options"], list) or len(q["options"]) != 4:
            return False
        
        # Correct answer must be valid index
        if not isinstance(q["correct_answer"], int) or q["correct_answer"] not in [0, 1, 2, 3]:
            return False
        
        # Question must end with question mark or be substantial
        question = q["question"]
        if len(question) < 15:
            return False
        
        # Filter out nonsensical options
        bad_phrases = [
            "tastes good", "causes global warming", "holiday destination",
            "musical instrument", "type of food", "color", "edible",
            "fictional character", "biological organism", "none of the above",
            "all of the above", "not important", "unrelated"
        ]
        
        for opt in q["options"]:
            opt_lower = opt.lower()
            for bad in bad_phrases:
                if bad in opt_lower:
                    print(f"Filtered: nonsensical option '{opt}'")
                    return False
        
        # All options must be non-empty and reasonable length
        for opt in q["options"]:
            if not isinstance(opt, str) or len(opt.strip()) < 2 or len(opt) > 500:
                return False
        
        return True

    def _generate_local_quiz(self, topics: List[str], context: str, num_questions: int, difficulty: str, bloom_level: str) -> Dict:
        """Generate questions using local T5 model with improved prompts"""
        segments = [s.strip() for s in context.split('.') if len(s.strip()) > 60]
        if not segments:
            segments = [f"The concept of {t} is important in this field." for t in topics]
        random.shuffle(segments)
        
        questions = []
        all_terms = self._extract_complex_terms(context)
        
        for i in range(min(num_questions, len(segments))):
            seg = segments[i]
            
            # Extract key term from segment
            seg_terms = self._extract_complex_terms(seg)
            anchor = seg_terms[0] if seg_terms else (topics[i % len(topics)] if topics else "concept")
            
            # Generate question using T5
            q_prompt = f"Generate a quiz question about: {seg[:200]}"
            
            try:
                inputs = self.local_tokenizer(q_prompt, return_tensors="pt", max_length=256, truncation=True).to(self.device)
                with torch.no_grad():
                    outputs = self.local_model.generate(**inputs, max_length=64, do_sample=True, temperature=0.8)
                question_text = self.local_tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                if len(question_text) < 20:
                    question_text = f"What is the significance of {anchor} in the context of this material?"
                
                if not question_text.endswith("?"):
                    question_text += "?"
                
            except Exception as e:
                print(f"Local model error: {e}")
                question_text = f"What is the key characteristic of {anchor}?"
            
            # Generate plausible distractors from related terms
            correct_answer = anchor
            peers = [p for p in all_terms if p.lower() != anchor.lower()]
            
            if len(peers) >= 3:
                distractors = random.sample(peers, 3)
            else:
                # Generate conceptual distractors
                distractors = [
                    f"A variant of {anchor}",
                    f"The inverse of {anchor}",
                    f"An alternative to {anchor}"
                ][:3-len(peers)] + peers
            
            options = [correct_answer] + distractors[:3]
            random.shuffle(options)
            
            questions.append({
                "question": question_text,
                "options": options[:4],
                "correct_answer": options.index(correct_answer)
            })

        return {
            "questions": questions,
            "difficulty": difficulty,
            "bloom_level": bloom_level,
            "topic_count": len(topics)
        }

    def _extract_complex_terms(self, text: str) -> List[str]:
        """Extract meaningful technical terms from text"""
        # Find capitalized terms and technical words
        terms = re.findall(r'\b[A-Z][a-z]{4,}\b|\b\w{10,}\b', text)
        stop_words = {'However', 'Because', 'Therefore', 'Although', 'Unlike', 
                      'Finally', 'Moreover', 'Furthermore', 'Nevertheless'}
        return list(set([t for t in terms if t not in stop_words]))

    def _fetch_external_trivia(self, num_questions: int) -> Optional[Dict]:
        """Fetch general trivia from Open Trivia DB"""
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
                    "bloom_level": "Mixed",
                    "topic_count": 0
                }
        except Exception as e:
            print(f"External API error: {e}")
        return None

    def _generate_fallback_quiz(self, topics: List[str], num_questions: int, difficulty: str) -> Dict:
        """Enhanced rule-based fallback with better question templates"""
        questions = []
        topic_count = len(topics) if topics else 1
        
        # Better question templates
        templates = [
            ("What is the primary purpose of {topic}?",
             ["To solve specific problems in the domain", "To provide a framework for analysis", 
              "To establish foundational principles", "To enable practical applications"]),
            ("Which characteristic best describes {topic}?",
             ["It follows systematic methodologies", "It requires iterative refinement",
              "It builds on established theories", "It enables measurable outcomes"]),
            ("How does {topic} contribute to the field?",
             ["By providing analytical frameworks", "By enabling practical solutions",
              "By establishing theoretical foundations", "By facilitating understanding"]),
        ]
        
        for i in range(num_questions):
            topic = topics[i % topic_count] if topics else "the subject matter"
            template = templates[i % len(templates)]
            
            question_text = template[0].format(topic=topic)
            options = template[1].copy()
            random.shuffle(options)
            
            questions.append({
                "question": question_text,
                "options": options,
                "correct_answer": 0  # First option after shuffle
            })
            
        return {
            "questions": questions,
            "difficulty": difficulty,
            "topic_count": len(topics) if topics else 0
        }

    def parse_questions_from_text(self, text: str) -> Dict:
        """Parse existing questions from unstructured text using AI"""
        print(f"Parsing questions from text (length: {len(text)})...")
        
        prompt = '''You are an expert quiz parser. extract multiple choice questions from the following text.
        
        TEXT:
        ''' + text[:15000] + '''
        
        RULES:
        1. Identify questions, options, and correct answers.
        2. If correct answer is not explicitly marked, infer it or default to the first option (and shuffle later).
        3. If no options are provided, GENERATE 3 plausible distractors.
        4. Fix any typos or formatting issues.
        
        OUTPUT FORMAT:
        Return ONLY a JSON array:
        [
          {
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": 0
          }
        ]
        '''
        
        # Try Gemini first
        if self.models_to_try:
            for model_name in self.models_to_try:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    result = self._parse_gemini_response(response.text, ["parsed_content"], "mixed", "Mixed")
                    if result and result.get("questions"):
                        return result
                except Exception as e:
                    print(f"Parse error with {model_name}: {e}")
                    
        # Fallback for parsing (simple regex if AI fails currently not implemented fully for unstructured, 
        # but could rely on structured format)
        print("AI parsing failed")
        return {"questions": []}
