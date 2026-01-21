'use client'

import { useState, useMemo } from 'react'
import { uploadFile, processText, parseQuiz, parseQuizFile, generateQuiz, submitQuiz } from '@/lib/api'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

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
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Take a Quiz</h1>
                    <p className="text-slate-600 dark:text-blue-200 text-lg">Test your knowledge with AI-powered questions</p>
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
                            className="card p-8 group transition-all text-left shadow-xl hover-tilt border-blue-500/10 hover:border-blue-500/30"
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
                            className="card p-8 group transition-all text-left shadow-xl hover-tilt border-purple-500/10 hover:border-purple-500/30"
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
                    <div className="card p-8 shadow-2xl animate-fade-in border-blue-500/10">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                                {quizMode === 'generate' ? 'Upload Material' : 'Paste Questions'}
                            </h1>
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
                                        <p className="text-xs text-slate-500 dark:text-blue-300 mt-4 font-medium italic">
                                            * Supports text with questions, options, and answers. AI will parse the structure automatically.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-primary/30 rounded-2xl p-16 text-center bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.txt"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="quiz-file"
                                    />
                                    <div className="text-6xl mb-6 text-primary group-hover:scale-110 transition-transform">
                                        {file ? '📄' : '📤'}
                                    </div>
                                    <p className="font-black text-2xl text-slate-900 dark:text-white">
                                        {file ? file.name : 'Click to upload material'}
                                    </p>
                                    <p className="text-slate-600 dark:text-blue-300 text-sm mt-4 font-bold">
                                        PDF, PNG, JPG, TXT
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={loading || (quizMode === 'generate' && !text.trim() && !file) || (quizMode === 'parse' && !text.trim() && !file)}
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
                    <div className="card p-8 space-y-10 shadow-2xl animate-fade-in border-primary/10">
                        <div>
                            <h1 className="text-3xl font-black mb-6 text-slate-900 dark:text-white">Quiz Settings</h1>
                            <div className="flex flex-wrap gap-2">
                                {topics.slice(0, 8).map((t, i) => (
                                    <span key={i} className="px-5 py-2 bg-primary dark:bg-primary/10 text-white dark:text-primary border border-primary/20 rounded-full text-xs font-black uppercase tracking-wider animate-float" style={{ animationDelay: `${i * 100}ms` }}>
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xl font-bold text-slate-800 dark:text-blue-100">
                                Number of Questions: <span className="text-primary font-black ml-1">{numQuestions}</span>
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
                    <div className="card p-10 shadow-2xl animate-fade-in relative overflow-hidden border-primary/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-black/20">
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
                                <span className="text-slate-600 dark:text-blue-300 font-black uppercase tracking-widest text-[10px]">Question {currentQ + 1} / {questions.length}</span>
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
                                            : 'border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-black/10 hover:border-primary/30'
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
                {/* Step 4: Results */}
                {step === 'results' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Score Card */}
                            <div className="md:col-span-1 card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors -z-10" />
                                <div className="text-sm font-black text-primary uppercase tracking-widest mb-2">Final Score</div>
                                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent">
                                    {score.toFixed(0)}%
                                </div>
                                <div className="mt-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                                    {score >= 80 ? 'Mastery Level' : score >= 50 ? 'Intermediate' : 'Keep Practicing'}
                                </div>
                            </div>

                            {/* Breakdown Chart */}
                            <div className="md:col-span-2 card p-6 min-h-[300px]">
                                <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                                    Performance Analytics
                                </h3>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Correct', value: results.filter(r => r.is_correct).length },
                                                    { name: 'Incorrect', value: results.filter(r => !r.is_correct).length }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#ef4444" />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--card-bg)',
                                                    borderColor: 'var(--border-color)',
                                                    borderRadius: '12px',
                                                    color: 'var(--foreground)'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-8 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                        <span className="text-sm font-black text-slate-700 dark:text-blue-200/60">Correct</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-sm font-black text-slate-700 dark:text-blue-200/60">Incorrect</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Summary */}
                        <div className="card p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl">
                            <h3 className="text-xl font-black text-foreground mb-8">Question Review</h3>
                            <div className="space-y-4">
                                {results.map((r, i) => {
                                    const q = questions[i]
                                    const correctAnswerText = q.question_type === 'mcq' && q.options
                                        ? String.fromCharCode(65 + Number(q.correct_answer)) + ') ' + q.options[Number(q.correct_answer)]
                                        : q.correct_answer

                                    return (
                                        <div
                                            key={i}
                                            className={`p-6 rounded-2xl space-y-3 border transition-all hover:scale-[1.01] ${r.is_correct
                                                ? 'bg-emerald-500/5 border-emerald-500/10'
                                                : 'bg-red-500/5 border-red-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${r.is_correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-bold text-foreground">Question {i + 1}</span>
                                                </div>
                                                <span className={`font-black uppercase tracking-tighter px-4 py-1.5 rounded-xl text-[10px] ${r.is_correct ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                                    {r.is_correct ? 'Mastered' : 'Needs Review'}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 dark:text-blue-100/70 font-medium leading-relaxed">{q.question}</p>
                                            {!r.is_correct && (
                                                <div className="pt-4 border-t border-red-500/10 mt-2">
                                                    <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-widest">Correct Solution</div>
                                                    <div className="text-emerald-600 dark:text-emerald-500 font-bold">{correctAnswerText}</div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={resetQuiz}
                                className="btn-secondary py-5 text-lg flex-1 border-primary/20 hover:bg-primary/5"
                            >
                                New Quiz
                            </button>
                            <button
                                onClick={() => setStep('configure')}
                                className="btn-primary py-5 text-lg flex-1 bg-gradient-to-r from-primary to-accent group"
                            >
                                <span className="group-hover:translate-x-1 transition-transform inline-block">Study Again →</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
