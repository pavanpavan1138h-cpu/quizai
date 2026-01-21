'use client'

import { useState } from 'react'
import { uploadFile, processText, generateQuiz, submitQuiz } from '@/lib/api'

interface Question {
    question: string
    options: string[]
    correct_answer: number
}

type Step = 'input' | 'configure' | 'quiz' | 'results'

export default function QuizPage() {
    const [step, setStep] = useState<Step>('input')
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
            if (inputType === 'file' && file) {
                result = await uploadFile(file)
            } else if (text.trim()) {
                result = await processText(text)
            } else {
                throw new Error('Please provide content')
            }
            setSessionId(result.session_id)
            setTopics(result.topics)
            setStep('configure')
        } catch (err: any) {
            setError(err.message || 'Failed to process')
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
        setStep('input')
        setQuestions([])
        setAnswers({})
        setCurrentQ(0)
        setTopics([])
        setText('')
        setFile(null)
    }

    return (
        <div className="py-12 px-4 animate-fade-in">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Take a Quiz</h1>
                    <p className="text-gray-600">Test your knowledge with AI-generated questions</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="card p-8">
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setInputType('text')}
                                className={`flex-1 py-2 rounded-lg font-medium ${inputType === 'text' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                📝 Paste Text
                            </button>
                            <button
                                onClick={() => setInputType('file')}
                                className={`flex-1 py-2 rounded-lg font-medium ${inputType === 'file' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                📄 Upload File
                            </button>
                        </div>

                        {inputType === 'text' ? (
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste your study material here..."
                                className="input min-h-[150px]"
                            />
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="quiz-file"
                                />
                                <label htmlFor="quiz-file" className="cursor-pointer">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-gray-600">{file ? file.name : 'Click to upload'}</p>
                                </label>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={loading || (!text.trim() && !file)}
                            className="btn-primary w-full mt-6 py-3 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Continue →'}
                        </button>
                    </div>
                )}

                {/* Step 2: Configure */}
                {step === 'configure' && (
                    <div className="card p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Configuration</h2>
                            <div className="flex flex-wrap gap-2">
                                {topics.slice(0, 8).map((t, i) => (
                                    <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Questions: {numQuestions}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['easy', 'medium', 'hard'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`py-2 rounded-lg capitalize ${difficulty === d ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bloom's Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Mixed'].map((b) => (
                                    <button
                                        key={b}
                                        onClick={() => setBloomLevel(b)}
                                        className={`py-2 rounded-lg text-sm ${bloomLevel === b ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep('input')} className="btn-secondary flex-1">
                                ← Back
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                disabled={loading}
                                className="btn-accent flex-1"
                            >
                                {loading ? 'Generating...' : '🚀 Start Quiz'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Quiz */}
                {step === 'quiz' && questions.length > 0 && (
                    <div className="card p-8">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm text-gray-500">Question {currentQ + 1} of {questions.length}</span>
                            <span className="text-sm text-gray-500">{Object.keys(answers).length} answered</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all"
                                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question */}
                        <h2 className="text-xl font-medium text-gray-900 mb-6">
                            {questions[currentQ].question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3">
                            {questions[currentQ].options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQ] === i
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)})</span>
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handlePrev}
                                disabled={currentQ === 0}
                                className="btn-secondary flex-1 disabled:opacity-50"
                            >
                                ← Previous
                            </button>
                            {currentQ < questions.length - 1 ? (
                                <button onClick={handleNext} className="btn-primary flex-1">
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || Object.keys(answers).length < questions.length}
                                    className="btn-accent flex-1 disabled:opacity-50"
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
                        <div className="card p-8 text-center">
                            <div className="text-6xl font-bold text-indigo-600 mb-2">{score.toFixed(0)}%</div>
                            <p className="text-xl text-gray-600">
                                You got {results.filter(r => r.is_correct).length} out of {results.length} correct
                            </p>
                        </div>

                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Question Summary</h3>
                            <div className="space-y-2">
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg flex items-center justify-between ${r.is_correct ? 'bg-emerald-50' : 'bg-red-50'
                                            }`}
                                    >
                                        <span>Question {i + 1}</span>
                                        <span className={r.is_correct ? 'text-emerald-600' : 'text-red-600'}>
                                            {r.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={resetQuiz} className="btn-secondary flex-1">
                                Take Another Quiz
                            </button>
                            <button onClick={() => setStep('configure')} className="btn-primary flex-1">
                                Retry Same Topics
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
