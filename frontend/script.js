const API_URL = "http://127.0.0.1:8000";

// State Management
let sessionData = {
    sessionId: null,
    currentQuestions: [],
    questionIndex: 0,
    moduleResults: [],
    startTime: null,
    timerInterval: null,
    totalQuestionsAnswered: 0
};

// UI Elements
const sections = {
    upload: document.getElementById('upload-section'),
    quiz: document.getElementById('quiz-section'),
    analytics: document.getElementById('analytics-section')
};

// --- Initialization ---
document.getElementById('drop-zone').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', handleFileUpload);
document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('next-btn').addEventListener('click', handleNextQuestion);
document.getElementById('skip-btn').addEventListener('click', () => handleNextQuestion(true));

// --- File Handling ---
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-loader').classList.remove('hidden');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        document.getElementById('file-preview').classList.remove('hidden');
        document.getElementById('file-name').innerText = file.name;
        document.getElementById('extracted-preview').value = data.text;
    } catch (err) {
        alert("Extraction failed. Check backend connection.");
    } finally {
        document.getElementById('upload-loader').classList.add('hidden');
    }
}

// --- Quiz Logic ---
async function startQuiz() {
    const content = document.getElementById('extracted-preview').value;
    if (!content) return alert("Please upload content first.");

    const formData = new FormData();
    formData.append('content', content);

    try {
        const response = await fetch(`${API_URL}/quiz/start`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        sessionData.sessionId = data.session_id;
        sessionData.currentQuestions = data.questions;
        sessionData.questionIndex = 0;
        sessionData.moduleResults = [];

        showSection('quiz');
        renderQuestion();
    } catch (err) {
        alert("Failed to start quiz.");
    }
}

function renderQuestion() {
    const q = sessionData.currentQuestions[sessionData.questionIndex];
    if (!q) return;

    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    if (q.type === 'MCQ') {
        document.getElementById('fill-input-container').classList.add('hidden');
        container.classList.remove('hidden');
        q.options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => selectOption(btn, opt);
            container.appendChild(btn);
        });
    } else {
        container.classList.add('hidden');
        document.getElementById('fill-input-container').classList.remove('hidden');
        document.getElementById('answer-input').value = '';
    }

    // Reset behavioral tracking for this question
    sessionData.startTime = Date.now();
    startTimer();
    updateProgress();
}

function selectOption(btn, value) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    sessionData.selectedAnswer = value;
}

async function handleNextQuestion(skipped = false) {
    const q = sessionData.currentQuestions[sessionData.questionIndex];
    let userAnswer = skipped ? null : (q.type === 'MCQ' ? sessionData.selectedAnswer : document.getElementById('answer-input').value);

    const timeTaken = Math.floor((Date.now() - sessionData.startTime) / 1000);
    const isCorrect = !skipped && (userAnswer === q.answer); // Basic check, backend could refine

    sessionData.moduleResults.push({
        question_id: sessionData.questionIndex,
        correct: isCorrect,
        time_taken: timeTaken,
        skipped: skipped
    });

    sessionData.questionIndex++;
    sessionData.totalQuestionsAnswered++;

    if (sessionData.questionIndex >= sessionData.currentQuestions.length) {
        // End of module
        await submitModule();
    } else {
        renderQuestion();
    }
}

async function submitModule() {
    const response = await fetch(`${API_URL}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionData.sessionId,
            results: sessionData.moduleResults
        })
    });
    const data = await response.json();

    if (data.status === 'finished') {
        showAnalytics();
    } else {
        sessionData.currentQuestions = data.questions;
        sessionData.questionIndex = 0;
        sessionData.moduleResults = [];
        document.getElementById('module-tag').innerText = data.module_info.name;
        renderQuestion();
    }
}

// --- Analytics ---
async function showAnalytics() {
    const response = await fetch(`${API_URL}/quiz/analytics/${sessionData.sessionId}`);
    const data = await response.json();

    document.getElementById('final-accuracy').innerText = `${Math.round(data.accuracy)}%`;
    document.getElementById('avg-time').innerText = `${Math.round(data.average_time)}s`;
    document.getElementById('total-q').innerText = data.history.length;

    showSection('analytics');
}

// --- Utilities ---
function showSection(name) {
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    sections[name].classList.remove('hidden');
}

function startTimer() {
    clearInterval(sessionData.timerInterval);
    let seconds = 0;
    sessionData.timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        document.getElementById('timer').innerText = `${mins}:${secs}`;
    }, 1000);
}

function updateProgress() {
    const p = ((sessionData.questionIndex + 1) / sessionData.currentQuestions.length) * 100;
    document.getElementById('progress-bar').style.width = `${p}%`;
}
