import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
import json
import re
import random

class QuestionGenerator:
    def __init__(self, model_name="google/flan-t5-small"):
        self.device = "cpu"
        self.tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
        self.model = T5ForConditionalGeneration.from_pretrained(model_name).to(self.device)

    async def _generate(self, prompt, max_len=100, temp=0.7):
        inputs = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).to(self.device)
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs, 
                max_length=max_len, 
                do_sample=True, 
                temperature=temp, 
                top_p=0.9,
                repetition_penalty=1.5
            )
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

    def _extract_complex_terms(self, text):
        terms = re.findall(r'\b[A-Z][a-z]{5,}\b|\b\w{11,}\b', text)
        stop_words = {'However', 'Because', 'Therefore', 'Although', 'Unlike', 'Finally', 'Moreover', 'Quantum'}
        return list(set([t for t in terms if t not in stop_words]))

    async def generate_questions(self, text, num_questions, q_type, bloom_mode, focus=None):
        segments = [s.strip() for s in text.split('.') if len(s.strip()) > 60]
        random.shuffle(segments)
        
        bloom_levels = ["Apply", "Analyze", "Evaluate"] if bloom_mode in ["Mixed", "All"] else [bloom_mode]
        questions = []
        used_anchors = set()

        for i in range(min(num_questions, len(segments))):
            seg = segments[i]
            level = random.choice(bloom_levels)
            
            # STEP 1: Entity Anchor
            candidates = self._extract_complex_terms(seg)
            anchor = next((c for c in candidates if c not in used_anchors), None)
            if not anchor:
                anchor = random.choice(candidates) if candidates else "the core conceptual mechanism"
            used_anchors.add(anchor)

            # STEP 2: Synthesis
            synthesis_prompt = f"Summarize this technical concept into a professional academic statement: {seg}"
            scholarly_summary = await self._generate(synthesis_prompt, max_len=50)

            # STEP 3: Question Generation (Persona Based)
            q_prompt = f"Context: {scholarly_summary}. Task: You are a Professor. Write a {level} level question that evaluates {anchor}."
            final_q = await self._generate(q_prompt, max_len=80)
            
            # FALLBACK: If AI output is too short or weird, use a structured fallback
            if len(final_q) < 15 or final_q.lower() in ["what is?", "question?", "evaluate."]:
                final_q = f"In the context of {scholarly_summary}, how would you critically assess the role of {anchor}?"

            if not final_q.endswith("?"): final_q += "?"

            # STEP 4: Distractor Generation (Reasoning Step)
            if q_type == "MCQ":
                d_prompt = f"Generate 3 scientific terms related to {anchor} but conceptually different."
                d_text = await self._generate(d_prompt, max_len=60)
                
                # Cleanup distractors (Remove instructions the model might repeat)
                clean_d = re.sub(r'|'.join(['terms', 'related', 'different', 'concepts', 'commas', ':']), '', d_text, flags=re.IGNORECASE)
                options = [o.strip() for o in clean_d.split(',') if len(o.strip()) > 2]
                
                # Dynamic programmatic fallback for options
                all_candidates = self._extract_complex_terms(text)
                peers = [p for p in all_candidates if p.lower() != anchor.lower() and p not in options]
                
                while len(options) < 3 and peers:
                    p = random.choice(peers)
                    if p not in options: options.append(p)
                
                final_options = list(set([anchor] + options[:3]))
                while len(final_options) < 4:
                    final_options.append(f"Conceptual {random.choice(['Mechanism', 'Variant', 'Framework'])}")
                random.shuffle(final_options)
            else:
                final_options = None

            questions.append({
                "question_id": i + 1,
                "type": q_type,
                "bloom_level": level,
                "question": final_q,
                "options": final_options,
                "answer": anchor
            })

        return questions
