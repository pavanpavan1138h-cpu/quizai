from pydantic import BaseModel
from typing import List, Optional
import time

class QuizState(BaseModel):
    user_id: str
    current_module: int = 1
    total_score: int = 0
    accuracy: float = 0.0
    average_time: float = 0.0
    history: List[dict] = []
    current_difficulty: str = "Medium" # Simple scale: Easy, Medium, Hard
    bloom_focus: str = "Mixed"

class AdaptiveEngine:
    def __init__(self):
        self.modules_count = 5

    def evaluate_performance(self, state: QuizState, last_module_results: List[dict]) -> QuizState:
        """
        Adjusts the next module's difficulty and focus based on performance.
        """
        if not last_module_results:
            return state

        correct_count = sum(1 for res in last_module_results if res.get('correct', False))
        total_q = len(last_module_results)
        accuracy = (correct_count / total_q) * 100 if total_q > 0 else 0
        
        avg_time = sum(res.get('time_taken', 0) for res in last_module_results) / total_q if total_q > 0 else 0
        skips = sum(1 for res in last_module_results if res.get('skipped', False))

        # Adaptation Rules
        # 1. Accuracy based
        if accuracy > 80:
            state.current_difficulty = "Hard"
            state.bloom_focus = "Analyze"
        elif accuracy < 40:
            state.current_difficulty = "Easy"
            state.bloom_focus = "Remember"
        else:
            state.current_difficulty = "Medium"
            state.bloom_focus = "Mixed"

        # 2. Behavioral based (Time & Skips)
        if avg_time < 10 and accuracy > 70: # Very fast and correct
            state.current_difficulty = "Hard" # Even more aggressive push
        
        if skips > 2: # Frustration signal
            state.current_difficulty = "Easy" # Back off to rebuild confidence

        # Update State
        state.accuracy = accuracy
        state.average_time = avg_time
        state.current_module += 1
        
        return state

    def get_module_config(self, state: QuizState) -> dict:
        """
        Returns parameters for question generation for the current module.
        """
        if state.current_module == 1:
            return {
                "name": "Diagnostic Module",
                "num_questions": 5,
                "bloom_mode": "All",
                "difficulty": "Medium"
            }
        else:
            return {
                "name": f"Adaptive Module {state.current_module}",
                "num_questions": 5,
                "bloom_mode": state.bloom_focus,
                "difficulty": state.current_difficulty
            }
