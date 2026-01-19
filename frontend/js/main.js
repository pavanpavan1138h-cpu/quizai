// SocratAI Main Application Logic

const state = {
    currentScreen: 'screen-landing',
    extractedText: '',
    quiz: [],
    currentQuestionIndex: 0,
    timer: 0,
    timerInterval: null,
    startTime: null,
    file: null,

    // Adaptive Module State
    moduleIndex: 1, // 1 to 5
    sessionHistory: [],
    moduleLevel: 'Mixed', // Remember, Understand, Apply, Analyze, Mixed, All
    diagnosticDone: false
};

// Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        state.currentScreen = screenId;
    } else {
        console.error(`Screen ${screenId} not found`);
    }
}

// Event Listeners Initialization
function init() {
    // Landing navigation
    document.getElementById('btn-to-upload').addEventListener('click', () => showScreen('screen-upload'));
    document.getElementById('btn-to-train').addEventListener('click', () => showScreen('screen-training'));
    document.getElementById('btn-run-training').addEventListener('click', runTraining);

    // Upload logic
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const btnToConfig = document.getElementById('btn-to-config');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            state.file = e.target.files[0];
            document.getElementById('file-name').textContent = state.file.name;
            document.getElementById('file-status').classList.remove('hidden');
            btnToConfig.disabled = false;
        }
    });

    document.getElementById('btn-back-to-landing').addEventListener('click', () => showScreen('screen-landing'));
    btnToConfig.addEventListener('click', () => showScreen('screen-config'));

    // Config logic
    document.getElementById('btn-back-to-upload').addEventListener('click', () => showScreen('screen-upload'));
    document.getElementById('btn-generate-quiz').addEventListener('click', startAdaptiveSession);

    // Transition logic
    document.getElementById('btn-start-next-module').addEventListener('click', startNextModule);

    // Quiz logic
    document.getElementById('btn-restart').addEventListener('click', () => showScreen('screen-landing'));
}

function toggleBloomLevel() {
    const mode = document.getElementById('config-bloom-mode').value;
    const container = document.getElementById('config-bloom-level-container');
    container.style.display = (mode === 'Single') ? 'block' : 'none';
}

async function startAdaptiveSession() {
    state.moduleIndex = 1;
    state.sessionHistory = [];
    state.moduleLevel = 'Mixed'; // Diagnostic starts with Mixed
    await runGenerationModule();
}

async function runGenerationModule() {
    showScreen('screen-loading');
    const loadingSub = document.getElementById('loading-step');

    // 1. Ensure text is extracted if not already
    if (!state.extractedText && state.file) {
        loadingSub.textContent = "Extracting knowledge from document...";
        const formData = new FormData();
        formData.append('file', state.file);
        try {
            const uploadRes = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            state.extractedText = uploadData.extracted_text;
        } catch (err) {
            console.error(err);
            alert("Upload failed. Check backend.");
            showScreen('screen-upload');
            return;
        }
    }

    // 2. Generate current module questions
    loadingSub.textContent = `Synthesizing Module ${state.moduleIndex} questions...`;

    const numQuestions = (state.moduleIndex === 1) ? 5 : 3; // 5 for diagnostic, 3 for adaptive
    const configData = new FormData();
    configData.append('text', state.extractedText);
    configData.append('num_questions', numQuestions);
    configData.append('question_type', document.getElementById('config-type').value);

    // Determine level for this module
    let bloomModeParam = state.moduleLevel;
    if (state.moduleIndex === 1) {
        const modeSelect = document.getElementById('config-bloom-mode').value;
        const levelSelect = document.getElementById('config-bloom-level').value;
        bloomModeParam = (modeSelect === 'Single') ? levelSelect : modeSelect;
    }

    configData.append('bloom_mode', bloomModeParam);

    try {
        const genRes = await fetch('http://127.0.0.1:8000/generate', { method: 'POST', body: configData });
        const { quiz } = await genRes.json();
        state.quiz = quiz;
        state.currentQuestionIndex = 0;
        startModuleUI();
    } catch (err) {
        console.error(err);
        alert("Generation failed. Check backend.");
        showScreen('screen-config');
    }
}

function startModuleUI() {
    showScreen('screen-quiz');
    const moduleLabel = document.getElementById('module-label');
    moduleLabel.textContent = (state.moduleIndex === 1) ?
        `Module ${state.moduleIndex}: Diagnostic Assessment` :
        `Module ${state.moduleIndex}: Adaptive Optimization`;

    renderQuestion();
}

function renderQuestion() {
    const q = state.quiz[state.currentQuestionIndex];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('question-info').textContent = `Question ${state.currentQuestionIndex + 1} / ${state.quiz.length}`;
    document.getElementById('difficulty-info').textContent = `Bloom: ${q.bloom_level}`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary option-btn';
        btn.textContent = opt;
        btn.onclick = () => submitAnswer(opt);
        optionsContainer.appendChild(btn);
    });

    state.startTime = Date.now();
    startQuizTimer();
}

function startQuizTimer() {
    clearInterval(state.timerInterval);
    state.timer = 0;
    state.timerInterval = setInterval(() => {
        state.timer++;
        const mins = Math.floor(state.timer / 60).toString().padStart(2, '0');
        const secs = (state.timer % 60).toString().padStart(2, '0');
        document.getElementById('quiz-timer').textContent = `${mins}:${secs}`;
    }, 1000);
}

function submitAnswer(selected) {
    const q = state.quiz[state.currentQuestionIndex];
    const timeTaken = (Date.now() - state.startTime) / 1000;
    const isCorrect = (selected === q.answer);

    // Behavioral Tracking
    state.sessionHistory.push({
        module: state.moduleIndex,
        question: q,
        selected: selected,
        isCorrect: isCorrect,
        timeTaken: timeTaken
    });

    const feedback = document.getElementById('behavioral-feedback');
    if (timeTaken < 10 && isCorrect) feedback.textContent = "Fast & Accurate! Difficulty scaling up...";
    else if (timeTaken > 30) feedback.textContent = "Deliberate pace. Reinforcing concepts...";
    else feedback.textContent = "";

    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < state.quiz.length) {
        setTimeout(renderQuestion, 500);
    } else {
        setTimeout(finishModule, 800);
    }
}

function finishModule() {
    clearInterval(state.timerInterval);
    const moduleHistory = state.sessionHistory.filter(h => h.module === state.moduleIndex);
    const correctCount = moduleHistory.filter(h => h.isCorrect).length;
    const accuracy = (correctCount / moduleHistory.length) * 100;
    const avgTime = moduleHistory.reduce((acc, curr) => acc + curr.timeTaken, 0) / moduleHistory.length;

    document.getElementById('transition-title').textContent = `Module ${state.moduleIndex} Complete`;
    document.getElementById('trans-accuracy').textContent = `${accuracy.toFixed(0)}%`;
    document.getElementById('trans-time').textContent = `${avgTime.toFixed(1)}s`;

    // Adaptive Logic (Phase 3)
    if (accuracy >= 80) {
        state.moduleLevel = "Analyze"; // Performance up -> Higher Bloom
    } else if (accuracy >= 50) {
        state.moduleLevel = "Apply";
    } else {
        state.moduleLevel = "Understand"; // Performance down -> Lower Bloom
    }

    if (state.moduleIndex < 5) {
        showScreen('screen-transition');
    } else {
        displayFinalDashboard();
    }
}

function startNextModule() {
    state.moduleIndex++;
    runGenerationModule();
}

function displayFinalDashboard() {
    showScreen('screen-analytics');
    const list = document.getElementById('generated-questions-list');
    const totalCorrect = state.sessionHistory.filter(h => h.isCorrect).length;
    const totalAccuracy = (totalCorrect / state.sessionHistory.length) * 100;

    // 1. Calculate Bloom Stats
    const bloomStats = {};
    state.sessionHistory.forEach(h => {
        const level = h.question.bloom_level;
        if (!bloomStats[level]) bloomStats[level] = { correct: 0, total: 0 };
        bloomStats[level].total++;
        if (h.isCorrect) bloomStats[level].correct++;
    });

    // 2. Calculate Topic Insights (based on question focus points)
    const topicStats = {};
    state.sessionHistory.forEach(h => {
        const topic = h.question.answer; // Using answer as a proxy for topic
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
        topicStats[topic].total++;
        if (h.isCorrect) topicStats[topic].correct++;
    });

    const strongTopics = Object.entries(topicStats).filter(([_, s]) => (s.correct / s.total) >= 0.8).map(e => e[0]);
    const weakTopics = Object.entries(topicStats).filter(([_, s]) => (s.correct / s.total) < 0.6).map(e => e[0]);

    const msg = document.getElementById('performance-msg');
    if (msg) msg.innerHTML = `
        <div class="card glass" style="margin-bottom: 2rem;">
            <div class="score-display">${totalAccuracy.toFixed(0)}<small>%</small></div>
            <p>Overall Session accuracy</p>
            <div style="display: flex; justify-content: space-around; margin-top: 2rem;">
                <div>
                    <strong>Bloom Proficiency:</strong>
                    <ul style="text-align: left; font-size: 0.9rem; margin-top: 0.5rem; list-style: none;">
                        ${Object.entries(bloomStats).map(([lvl, s]) => `
                            <li>${lvl}: ${((s.correct / s.total) * 100).toFixed(0)}%</li>
                        `).join("")}
                    </ul>
                </div>
                <div style="text-align: left;">
                    <div style="margin-bottom: 0.5rem;"><strong style="color: var(--accent);">Strong Topics:</strong> ${strongTopics.join(", ") || "Analyzing..."}</div>
                    <div><strong style="color: var(--danger);">Review Needed:</strong> ${weakTopics.join(", ") || "None identified"}</div>
                </div>
            </div>
        </div>
    `;

    list.innerHTML = `<h3>Individual Performance History</h3>` + state.sessionHistory.map((h, idx) => `
        <div class="card glass" style="margin-bottom: 1rem; padding: 1rem; border-left: 4px solid ${h.isCorrect ? '#10b981' : '#ef4444'}">
            <small>MOD ${h.module} | ${h.question.bloom_level} | ${h.timeTaken.toFixed(1)}s</small>
            <p style="margin: 0.5rem 0;">${h.question.question}</p>
            <div style="font-size: 0.8rem; opacity: 0.8;">
                Your Answer: <span style="color: ${h.isCorrect ? '#10b981' : '#ef4444'}">${h.selected}</span> | 
                Correct: <span style="color: #10b981">${h.question.answer}</span>
            </div>
        </div>
    `).join("");
}

async function runTraining() {
    const status = document.getElementById('training-status');
    const dataset = document.getElementById('training-dataset');
    const btn = document.getElementById('btn-run-training');

    if (!state.file) {
        status.textContent = "Error: Please upload a document first (use 'Generate AI Quiz' screen).";
        status.style.color = "red";
        return;
    }

    btn.disabled = true;
    status.textContent = "Initialising Training Environment... (1/3)";
    dataset.style.display = "none";

    try {
        const formData = new FormData();
        formData.append('file', state.file);
        const uploadRes = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: formData });
        const { extracted_text } = await uploadRes.json();

        status.textContent = "Synthesizing Dataset (2/3) - Rephrasing & Analyzing Context...";

        const genData = new FormData();
        genData.append('text', extracted_text);
        genData.append('num_questions', 20);
        genData.append('question_type', 'MCQ');
        genData.append('bloom_mode', 'Mixed');
        const genRes = await fetch('http://127.0.0.1:8000/generate', { method: 'POST', body: genData });
        const { quiz } = await genRes.json();

        status.textContent = "Training Complete! (3/3) - Synthetic KB Generated.";
        status.style.color = "var(--accent)";

        dataset.style.display = "block";
        dataset.innerHTML = quiz.map((q, idx) => `
            <div style="margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                <strong>${idx + 1}. ${q.question}</strong><br>
                Options: ${q.options.join(", ")}<br>
                <span style="color: var(--accent)">Key: ${q.answer}</span>
            </div>
        `).join("");

    } catch (err) {
        status.textContent = "Training Failure: Connection or Model error.";
        console.error(err);
    } finally {
        btn.disabled = false;
    }
}

// Start the app
init();
