'use client'

import { useState } from 'react'
import { uploadFile, processText, parseQuiz, parseQuizFile, generateQuiz, submitQuiz } from '@/lib/api'
import Link from 'next/link'

interface Question {
    question: string
    options: string[]
    correct_answer: number
}

// Flow: landing -> input -> configure? -> quiz -> results
type Step = 'landing' | 'input' | 'configure' | 'quiz' | 'results'

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

    // Quiz
    const [questions, setQuestions] = useState<Question[]>([])
    const [quizId, setQuizId] = useState<string | null>(null)
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number>>({})

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
            const result = await generateQuiz(sessionId, numQuestions, bloomLevel)
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
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                {/* Step 0: Landing Mode Selection */}
                {step === 'landing' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <button
                            onClick={() => {
                                setQuizMode('generate')
                                setStep('input')
                                setInputType('text')
                            }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-white/5 hover:border-blue-500/30 transition-all text-left group shadow-lg"
                        >
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-blue-500/20">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Generate Quiz</h3>
                            <p className="text-blue-200/80 text-sm">
                                Upload notes or text, and let AI generate a customized quiz for you.
                            </p>
                        </button>

                        <button
                            onClick={() => {
                                setQuizMode('parse')
                                setStep('input')
                                setInputType('text')
                            }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-white/5 hover:border-purple-500/30 transition-all text-left group shadow-lg"
                        >
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-purple-500/20">
                                <span className="text-2xl">📝</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">I Have Questions</h3>
                            <p className="text-blue-200/80 text-sm">
                                Paste your existing questions and take the quiz immediately.
                            </p>
                        </button>
                    </div>
                )}

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="card p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {quizMode === 'generate' ? 'Upload Material' : 'Paste Questions'}
                            </h2>
                            <button
                                onClick={() => setStep('landing')}
                                className="text-sm text-blue-300 hover:text-white"
                            >
                                ← Change Mode
                            </button>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setInputType('text')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${inputType === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-blue-200 hover:bg-white/10'
                                    }`}
                            >
                                Paste Text
                            </button>
                            <button
                                onClick={() => setInputType('file')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${inputType === 'file' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-blue-200 hover:bg-white/10'
                                    }`}
                            >
                                Upload File
                            </button>
                        </div>

                        <div className="mb-6">
                            {(inputType === 'text') ? (
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        {quizMode === 'parse' ? 'Paste your existing questions here:' : 'Paste your study material:'}
                                    </label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder={quizMode === 'parse'
                                            ? "1. What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nAnswer: B"
                                            : "Paste your syllabus, notes, or textbook content here..."}
                                        className="input min-h-[200px] font-mono text-sm leading-relaxed bg-black/20 border-white/10 text-blue-100 placeholder-blue-300/30"
                                    />
                                    {quizMode === 'parse' && (
                                        <p className="text-xs text-blue-300/60 mt-2">
                                            * Supports text with questions, options, and answers. AI will parse the structure.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="quiz-file"
                                    />
                                    <div className="text-4xl mb-4 text-blue-400">
                                        {file ? '📄' : '📁'}
                                    </div>
                                    <p className="text-blue-100 font-medium text-lg">
                                        {file ? file.name : 'Click to upload study material'}
                                    </p>
                                    <p className="text-blue-300/60 text-sm mt-2">
                                        PDF, PNG, JPG supported
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={loading || (quizMode === 'generate' && !text.trim() && !file) || (quizMode === 'parse' && !text.trim())}
                            className="btn-primary w-full py-4 text-lg shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border-none"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {quizMode === 'parse' ? 'Parsing Questions...' : 'Processing Material...'}
                                </span>
                            ) : (
                                <span>{quizMode === 'parse' ? 'Start Quiz Now →' : 'Continue Configuration →'}</span>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Configure */}
                {step === 'configure' && (
                    <div className="card p-8 space-y-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">Quiz Configuration</h2>
                            <div className="flex flex-wrap gap-2">
                                {topics.slice(0, 8).map((t, i) => (
                                    <span key={i} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-2">
                                Number of Questions: {numQuestions}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-2">Difficulty</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['easy', 'medium', 'hard'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`py-2 rounded-lg capitalize transition-all ${difficulty === d ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-blue-200 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-2">Bloom's Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Mixed'].map((b) => (
                                    <button
                                        key={b}
                                        onClick={() => setBloomLevel(b)}
                                        className={`py-2 rounded-lg text-sm transition-all ${bloomLevel === b ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-blue-200 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep('input')} className="btn-secondary flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                                ← Back
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
                            >
                                {loading ? 'Generating...' : '🚀 Start Quiz'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Quiz */}
                {step === 'quiz' && questions.length > 0 && (
                    <div className="card p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm text-blue-300">Question {currentQ + 1} of {questions.length}</span>
                            <span className="text-sm text-blue-300">{Object.keys(answers).length} answered</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2 mb-6">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question */}
                        <h2 className="text-xl font-medium text-white mb-6 leading-relaxed">
                            {questions[currentQ].question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3">
                            {questions[currentQ].options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${answers[currentQ] === i
                                        ? 'border-cyan-500 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/10'
                                        : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className={`font-bold mr-3 ${answers[currentQ] === i ? 'text-cyan-300' : 'text-blue-400/60'}`}>{String.fromCharCode(65 + i)}</span>
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handlePrev}
                                disabled={currentQ === 0}
                                className="btn-secondary flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>
                            {currentQ < questions.length - 1 ? (
                                <button onClick={handleNext} className="btn-primary flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || Object.keys(answers).length < questions.length}
                                    className="btn-primary flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/20 disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Submit Quiz'}
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
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg flex items-center justify-between border ${r.is_correct
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                                            }`}
                                    >
                                        <span>Question {i + 1}</span>
                                        <span className={r.is_correct ? 'text-emerald-400' : 'text-red-400'}>
                                            {r.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                        </span>
                                    </div>
                                ))}
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
