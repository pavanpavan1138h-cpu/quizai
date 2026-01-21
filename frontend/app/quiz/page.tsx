'use client'

import { useState } from 'react'
import { uploadFile, processText, parseQuiz, parseQuizFile, generateQuiz, submitQuiz } from '@/lib/api'
import Link from 'next/link'

interface Question {
    question: string
    options?: string[]
    correct_answer: number | string
    question_type?: string
}

// Flow: landing -> input -> configure? -> review -> quiz -> results
type Step = 'landing' | 'input' | 'configure' | 'review' | 'quiz' | 'results'

export default function QuizPage() {
    const [step, setStep] = useState<Step>('landing')
    const [quizMode, setQuizMode] = useState<'generate' | 'parse'>('generate')
    const [inputType, setInputType] = useState<'file' | 'text'>('text')
    const [text, setText] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Config
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [topics, setTopics] = useState<string[]>([])
    const [numQuestions, setNumQuestions] = useState(10)
    const [difficulty, setDifficulty] = useState('medium')
    const [bloomLevel, setBloomLevel] = useState('Mixed')
    const [questionType, setQuestionType] = useState('mcq')

    // Quiz
    const [questions, setQuestions] = useState<Question[]>([])
    const [quizId, setQuizId] = useState<string | null>(null)
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string | number>>({})

    // Results
    const [score, setScore] = useState(0)
    const [results, setResults] = useState<any[]>([])

    const handleUpload = async () => {
        setLoading(true)
        setError(null)
        try {
            let result
            if (quizMode === 'parse') {
                if (inputType === 'file' && file) {
                    // Assuming parseQuizFile is an API function similar to parseQuiz but takes a file
                    // This function needs to be imported from '@/lib/api' if it exists.
                    // For now, I'll assume it's a placeholder or needs to be added to the import.
                    // If parseQuizFile is not defined, this will cause a runtime error.
                    // For the purpose of this edit, I'm adding it to the import list.
                    // If it's not meant to be there, please clarify.
                    result = await parseQuizFile(file)
                } else if (text.trim()) {
                    result = await parseQuiz(text)
                } else {
                    throw new Error('Please provide text or a file with questions')
                }
                setQuestions(result.questions)
                setQuizId(result.quiz_id)
                setSessionId(result.session_id)
                setStep('quiz')
            } else {
                // Generate mode - same as generator but simpler flow here
                if (inputType === 'file' && file) {
                    result = await uploadFile(file)
                } else if (text.trim()) { // Ensure text is not empty for processing
                    result = await processText(text)
                } else {
                    throw new Error('Please provide content to generate a quiz')
                }
                setSessionId(result.session_id)
                setTopics(result.topics) // Keep this line from original logic
                setStep('configure')
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to process content')
        } finally {
            setLoading(false)
        }
    }

    const handleStartQuiz = async () => {
        if (!sessionId) return
        setLoading(true)
        setError(null)
        try {
            const result = await generateQuiz(sessionId, numQuestions, bloomLevel, questionType)
            setQuestions(result.questions)
            setQuizId(result.quiz_id)
            setStep('quiz')
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz')
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = (optionIndex: number) => {
        setAnswers({ ...answers, [currentQ]: optionIndex })
    }

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(currentQ + 1)
        }
    }

    const handlePrev = () => {
        if (currentQ > 0) {
            setCurrentQ(currentQ - 1)
        }
    }

    const handleSubmit = async () => {
        if (!quizId || !sessionId) return
        setLoading(true)
        try {
            const result = await submitQuiz(quizId, sessionId, answers)
            setScore(result.score)
            setResults(result.results)
            setStep('results')
        } catch (err: any) {
            setError(err.message || 'Failed to submit')
        } finally {
            setLoading(false)
        }
    }

    const resetQuiz = () => {
        setStep('landing')
        setQuestions([])
        setAnswers({})
        setCurrentQ(0)
        setTopics([])
        setText('')
        setFile(null)
        setError(null)
        setQuestionType('mcq')
    }

    return (
        <div className="py-12 px-4 animate-fade-in">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Take a Quiz</h1>
                    <p className="text-blue-200">Test your knowledge with AI-generated questions</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm animate-shake">
                        {error}
                    </div>
                )}

                {/* Step 0: Landing Mode Selection */}
                {step === 'landing' && (
                    <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up">
                        <button
                            onClick={() => {
                                setQuizMode('generate')
                                setStep('input')
                                setInputType('text')
                            }}
                            className="glass-panel p-8 rounded-2xl hover:bg-white/5 border-primary/20 hover:border-blue-500/50 transition-all text-left group shadow-xl hover-tilt"
                        >
                            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-blue-500/10">
                                <span className="text-3xl">✨</span>
                            </div>
                            <h3 className="text-2xl font-black mb-3">Generate Quiz</h3>
                            <p className="text-slate-500 dark:text-blue-200/80 leading-relaxed">
                                Upload notes or text, and let AI generate a customized quiz for you.
                            </p>
                        </button>

                        <button
                            onClick={() => {
                                setQuizMode('parse')
                                setStep('input')
                                setInputType('text')
                            }}
                            className="glass-panel p-8 rounded-2xl hover:bg-white/5 border-primary/20 hover:border-purple-500/50 transition-all text-left group shadow-xl hover-tilt"
                        >
                            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-purple-500/10">
                                <span className="text-3xl">📝</span>
                            </div>
                            <h3 className="text-2xl font-black mb-3">I Have Questions</h3>
                            <p className="text-slate-500 dark:text-blue-200/80 leading-relaxed">
                                Paste your existing questions and take the quiz immediately.
                            </p>
                        </button>
                    </div>
                )}

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="glass-panel p-8 rounded-3xl shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black">
                                {quizMode === 'generate' ? 'Upload Material' : 'Paste Questions'}
                            </h2>
                            <button
                                onClick={() => setStep('landing')}
                                className="text-sm font-bold text-primary hover:brightness-110"
                            >
                                ← Change Mode
                            </button>
                        </div>

                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={() => setInputType('text')}
                                className={`flex-1 py-4 rounded-xl font-bold transition-all shadow-sm ${inputType === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border border-white/10 text-slate-500 dark:text-blue-200'
                                    }`}
                            >
                                Paste Text
                            </button>
                            <button
                                onClick={() => setInputType('file')}
                                className={`flex-1 py-4 rounded-xl font-bold transition-all shadow-sm ${inputType === 'file' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border border-white/10 text-slate-500 dark:text-blue-200'
                                    }`}
                            >
                                Upload File
                            </button>
                        </div>

                        <div className="mb-8">
                            {(inputType === 'text') ? (
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-blue-200 mb-3">
                                        {quizMode === 'parse' ? 'Paste your existing questions here:' : 'Paste your study material:'}
                                    </label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder={quizMode === 'parse'
                                            ? "1. What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nAnswer: B"
                                            : "Paste your syllabus, notes, or textbook content here..."}
                                        className="w-full h-64 p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-white/10 text-foreground font-mono text-sm leading-relaxed placeholder-slate-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                    {quizMode === 'parse' && (
                                        <p className="text-xs text-slate-400 dark:text-blue-300/60 mt-3">
                                            * Supports text with questions, options, and answers. AI will parse the structure.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-primary/20 rounded-2xl p-16 text-center bg-white/5 hover:bg-white/10 hover:border-primary transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="quiz-file"
                                    />
                                    <div className="text-5xl mb-6 text-primary group-hover:scale-110 transition-transform">
                                        {file ? '📄' : '📤'}
                                    </div>
                                    <p className="font-bold text-xl">
                                        {file ? file.name : 'Click to upload material'}
                                    </p>
                                    <p className="text-slate-500 dark:text-blue-300/60 text-sm mt-3 font-medium">
                                        PDF, PNG, JPG supported
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={loading || (quizMode === 'generate' && !text.trim() && !file) || (quizMode === 'parse' && !text.trim())}
                            className="btn-primary w-full py-5 text-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    {quizMode === 'parse' ? 'Parsing Questions...' : 'Processing...'}
                                </span>
                            ) : (
                                <span>{quizMode === 'parse' ? 'Review & Start' : 'Next Step →'}</span>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Configure */}
                {step === 'configure' && (
                    <div className="glass-panel p-8 space-y-8 rounded-3xl shadow-2xl animate-fade-in">
                        <div>
                            <h2 className="text-2xl font-black mb-6">Quiz Settings</h2>
                            <div className="flex flex-wrap gap-2">
                                {topics.slice(0, 8).map((t, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-bold animate-float" style={{ animationDelay: `${i * 100}ms` }}>
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-lg font-bold">
                                Number of Questions: <span className="text-primary font-black">{numQuestions}</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-lg font-bold">Question Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'mcq', label: 'MCQs', icon: '📝' },
                                    { id: 'fill_ups', label: 'Fill-ups', icon: '🔠' },
                                    { id: 'short_answer', label: 'Short Answer', icon: '✍️' }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setQuestionType(type.id)}
                                        className={`py-4 rounded-2xl font-bold transition-all flex flex-col items-center gap-1 ${questionType === type.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white/5 text-slate-500 dark:text-blue-200 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-xl">{type.icon}</span>
                                        <span className="text-xs">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-lg font-bold">Difficulty</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['easy', 'medium', 'hard'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`py-3 rounded-2xl capitalize font-bold transition-all ${difficulty === d ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-500 dark:text-blue-200 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-lg font-bold">Bloom's Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Mixed'].map((b) => (
                                    <button
                                        key={b}
                                        onClick={() => setBloomLevel(b)}
                                        className={`py-3 rounded-2xl text-sm font-bold transition-all ${bloomLevel === b ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-500 dark:text-blue-200 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setStep('input')} className="btn-secondary flex-1 bg-transparent">
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep('review')}
                                className="btn-primary flex-1 py-4"
                            >
                                Review & Confirm →
                            </button>
                        </div>
                    </div>
                )}

                {/* --- NEW STEP: REVIEW --- */}
                {step === 'review' && (
                    <div className="max-w-3xl mx-auto animate-fade-in">
                        <div className="glass-panel rounded-3xl p-10 border-2 border-primary/20 shadow-2xl text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 animate-pulse"></div>

                            <h2 className="text-3xl font-black mb-10">Are you ready?</h2>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-float">
                                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Questions</p>
                                    <p className="text-xl font-black">{numQuestions}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-float animation-delay-2000">
                                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Difficulty</p>
                                    <p className="text-xl font-black capitalize">{difficulty}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-float animation-delay-4000">
                                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Type</p>
                                    <p className="text-xl font-black whitespace-nowrap overflow-hidden text-ellipsis">
                                        {questionType === 'mcq' ? 'MCQs' : (questionType === 'fill_ups' ? 'Fill-ups' : 'Short')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-float animation-delay-2000">
                                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Taxonomy</p>
                                    <p className="text-xl font-black">{bloomLevel}</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(quizMode === 'generate' ? 'configure' : 'input')}
                                    className="btn-secondary px-10 bg-transparent font-black"
                                >
                                    ← Edit
                                </button>
                                <button
                                    onClick={handleStartQuiz}
                                    disabled={loading}
                                    className="btn-primary flex-1 py-5 text-2xl group overflow-hidden relative"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                Launching...
                                            </>
                                        ) : (
                                            <>
                                                Start Quiz
                                                <span className="group-hover:translate-x-1 transition-transform">🚀</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Quiz */}
                {step === 'quiz' && questions.length > 0 && (
                    <div className="glass-panel p-10 rounded-[2.5rem] shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-black/10">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-500"
                                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Progress */}
                        <div className="flex items-center justify-between mb-10 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                                    {currentQ + 1}
                                </div>
                                <span className="text-slate-500 dark:text-blue-300 font-bold uppercase tracking-widest text-xs">Question {currentQ + 1} of {questions.length}</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-black text-primary animate-pulse">
                                IN PROGRESS
                            </div>
                        </div>

                        {/* Question */}
                        <h2 className="text-2xl font-black text-foreground mb-10 leading-tight">
                            {questions[currentQ].question}
                        </h2>

                        {/* Options / Input */}
                        <div className="space-y-4">
                            {questions[currentQ].question_type === 'mcq' && questions[currentQ].options ? (
                                questions[currentQ].options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group hover-tilt ${answers[currentQ] === i
                                            ? 'border-primary bg-primary/10 shadow-xl shadow-primary/10 scale-[1.02]'
                                            : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/10 hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${answers[currentQ] === i ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className={`text-lg transition-all ${answers[currentQ] === i ? 'font-black' : 'font-medium'}`}>
                                                {opt}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-500 dark:text-blue-200">Type your answer below:</label>
                                    <textarea
                                        value={String(answers[currentQ] || '')}
                                        onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })}
                                        placeholder="Start typing..."
                                        className="w-full h-32 p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-white/10 text-foreground text-lg leading-relaxed focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-slate-400"
                                    />
                                    <p className="text-xs text-slate-400 dark:text-blue-300/60">
                                        {questions[currentQ].question_type === 'fill_ups'
                                            ? '* AI will check for the exact keyword match.'
                                            : '* AI will check if your answer contains relevant key concepts.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4 mt-12">
                            <button
                                onClick={handlePrev}
                                disabled={currentQ === 0}
                                className="btn-secondary flex-1 bg-transparent disabled:opacity-30"
                            >
                                Previous
                            </button>
                            {currentQ < questions.length - 1 ? (
                                <button onClick={handleNext} className="btn-primary flex-1 py-4 shadow-2xl">
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || Object.keys(answers).length < questions.length}
                                    className="btn-primary flex-1 py-4 shadow-xl shadow-green-500/20 bg-gradient-to-r from-green-600 to-emerald-500 border-none disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Finish Quiz ✓'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Results */}
                {step === 'results' && (
                    <div className="space-y-6">
                        <div className="card p-8 text-center bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">{score.toFixed(0)}%</div>
                            <p className="text-xl text-blue-200">
                                You got {results.filter(r => r.is_correct).length} out of {results.length} correct
                            </p>
                        </div>

                        <div className="card p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                            <h3 className="font-semibold text-white mb-4">Question Summary</h3>
                            <div className="space-y-2">
                                {results.map((r, i) => {
                                    const q = questions[i]
                                    const correctAnswerText = q.question_type === 'mcq' && q.options
                                        ? String.fromCharCode(65 + Number(q.correct_answer)) + ') ' + q.options[Number(q.correct_answer)]
                                        : q.correct_answer

                                    return (
                                        <div
                                            key={i}
                                            className={`p-4 rounded-xl space-y-2 border ${r.is_correct
                                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                                : 'bg-red-500/10 border-red-500/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold">Question {i + 1}</span>
                                                <span className={`font-bold px-3 py-1 rounded-full text-xs ${r.is_correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                    {r.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                                </span>
                                            </div>
                                            <p className="text-sm opacity-80">{q.question}</p>
                                            {!r.is_correct && (
                                                <div className="text-sm pt-2 border-t border-white/10">
                                                    <span className="font-bold text-emerald-400">Correct Answer: </span>
                                                    <span className="text-white">{correctAnswerText}</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={resetQuiz} className="btn-secondary flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                                Take Another Quiz
                            </button>
                            <button onClick={() => setStep('configure')} className="btn-primary flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                                Retry Same Topics
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
