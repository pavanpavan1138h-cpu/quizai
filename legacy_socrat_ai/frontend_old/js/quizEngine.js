import { questionPool } from './questions.js';

export class QuizEngine {
    constructor() {
        this.totalQuestionsToSelect = 25;
        this.selectedQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.logs = []; // Behavioral tracking: { questionId, difficulty, timeTaken, correct }
        this.currentDifficulty = 'medium'; // Start difficulty
        this.startTime = null;
    }

    /**
     * Selects 25 questions ensuring balanced topics and difficulties.
     */
    initializeQuiz() {
        const pool = [...questionPool];
        const selected = [];
        const topics = [...new Set(pool.map(q => q.topic))];
        const difficulties = ['easy', 'medium', 'hard'];

        // 1. Ensure at least one from each topic-difficulty combo if available
        topics.forEach(topic => {
            difficulties.forEach(diff => {
                const matchIndex = pool.findIndex(q => q.topic === topic && q.difficulty === diff);
                if (matchIndex !== -1 && selected.length < this.totalQuestionsToSelect) {
                    selected.push(pool.splice(matchIndex, 1)[0]);
                }
            });
        });

        // 2. Fill the rest randomly
        while (selected.length < this.totalQuestionsToSelect && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            selected.push(pool.splice(randomIndex, 1)[0]);
        }

        // Shuffle the selected questions
        this.selectedQuestions = this.shuffle(selected);
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.logs = [];
        this.currentDifficulty = 'medium';
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    getCurrentQuestion() {
        // If we want it to be TRULY adaptive mid-quiz, we don't just pick from the pre-selected 25.
        // However, the prompt says "AI logic selects only 25 questions" initially, 
        // AND "next question becomes harder/easier".
        // 
        // Re-interpreting: Select 25 as the "pool" for THIS session, 
        // then pick the next one from THAT pool based on difficulty.

        const availableInSession = this.selectedQuestions.filter((q, index) => index >= this.currentQuestionIndex);

        // Find a question in remaining session pool that matches currentDifficulty
        let nextQ = availableInSession.find(q => q.difficulty === this.currentDifficulty);

        // Fallback if no question of that difficulty is left in the 25-pool
        if (!nextQ) {
            nextQ = availableInSession[0];
        }

        // Move the selected question to the current index position in selectedQuestions array
        const actualIndex = this.selectedQuestions.indexOf(nextQ);
        [this.selectedQuestions[this.currentQuestionIndex], this.selectedQuestions[actualIndex]] =
            [this.selectedQuestions[actualIndex], this.selectedQuestions[this.currentQuestionIndex]];

        this.startTime = Date.now();
        return nextQ;
    }

    submitAnswer(answer) {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        const endTime = Date.now();
        const timeTaken = (endTime - this.startTime) / 1000; // seconds
        const isCorrect = question.answer === answer;

        if (isCorrect) this.score++;

        // Behavior Tracking
        this.logs.push({
            questionId: question.id,
            topic: question.topic,
            difficulty: question.difficulty,
            timeTaken: timeTaken,
            correct: isCorrect,
            targetDifficulty: this.currentDifficulty
        });

        // Adaptive Logic
        this.updateDifficulty(isCorrect, timeTaken);

        this.currentQuestionIndex++;
        return {
            isCorrect,
            correctAnswer: question.answer,
            nextDifficulty: this.currentDifficulty,
            isFinished: this.currentQuestionIndex >= this.totalQuestionsToSelect
        };
    }

    updateDifficulty(isCorrect, timeTaken) {
        const levels = ['easy', 'medium', 'hard'];
        let currentIndex = levels.indexOf(this.currentDifficulty);

        if (isCorrect) {
            if (timeTaken < 10) {
                // Correct and fast -> Harder
                if (currentIndex < 2) currentIndex++;
            }
            // If correct but slow, stay at same level
        } else {
            // Wrong -> Easier
            if (currentIndex > 0) currentIndex--;
        }

        // Module 3: Long time taken -> reduce difficulty
        if (timeTaken > 30 && currentIndex > 0) {
            currentIndex--;
        }

        this.currentDifficulty = levels[currentIndex];
    }

    getAnalytics() {
        const topicPerformance = {};
        this.logs.forEach(log => {
            if (!topicPerformance[log.topic]) {
                topicPerformance[log.topic] = { correct: 0, total: 0 };
            }
            topicPerformance[log.topic].total++;
            if (log.correct) topicPerformance[log.topic].correct++;
        });

        const diffPerformance = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
        this.logs.forEach(log => {
            diffPerformance[log.difficulty].t++;
            if (log.correct) diffPerformance[log.difficulty].c++;
        });

        return {
            score: this.score,
            total: this.totalQuestionsToSelect,
            logs: this.logs,
            topicPerformance,
            diffPerformance,
            averageTime: this.logs.reduce((acc, l) => acc + l.timeTaken, 0) / this.logs.length
        };
    }
}
