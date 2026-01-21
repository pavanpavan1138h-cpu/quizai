'use client'

import { useState } from 'react'
import { uploadFile, processText, generateQuiz } from '@/lib/api'

interface Question {
    question: string
    options: string[]
    correct_answer: number
}

// Flow: input -> config -> (optional: topics) -> questions
type Step = 'input' | 'config' | 'topics' | 'questions'

export default function GeneratorPage() {
    const [step, setStep] = useState<Step>('input')
    const [inputType, setInputType] = useState<'file' | 'text'>('text')
    const [text, setText] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Data
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [allTopics, setAllTopics] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [questions, setQuestions] = useState<Question[]>([])

    // Configuration
    const [numQuestions, setNumQuestions] = useState(10)
    const [bloomChoice, setBloomChoice] = useState<'none' | 'mixed' | 'specific'>('mixed') // none, mixed, specific
    const [specificBloom, setSpecificBloom] = useState('Remember')

    // --- Handlers ---

    const handleProcessInput = async () => {
        setLoading(true)
        setError(null)
        try {
            let result
            if (inputType === 'file' && file) {
                result = await uploadFile(file)
            } else if (text.trim()) {
                result = await processText(text)
            } else {
                throw new Error('Please provide text or upload a file')
            }

            setSessionId(result.session_id)
            setAllTopics(result.topics || [])
            setSelectedTopics(result.topics || []) // Select all by default
            setStep('config')
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to process content')
        } finally {
            setLoading(false)
        }
    }

    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic))
        } else {
            setSelectedTopics([...selectedTopics, topic])
        }
    }

    const toggleAllTopics = () => {
        if (selectedTopics.length === allTopics.length) {
            setSelectedTopics([])
        } else {
            setSelectedTopics([...allTopics])
        }
    }

    const handleGenerateQuestions = async () => {
        if (!sessionId) return
        setLoading(true)
        setError(null)
        try {
            // Determine final Bloom's level string
            let finalBloom = 'Mixed'
            if (bloomChoice === 'none') finalBloom = 'None' // Backend might treat as default
            if (bloomChoice === 'specific') finalBloom = specificBloom

            const result = await generateQuiz(sessionId, numQuestions, finalBloom)
            setQuestions(result.questions)
            setStep('questions')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate questions')
        } finally {
            setLoading(false)
        }
    }

    const downloadPDF = () => {
        let content = 'QUIZ QUESTIONS\n'
        content += '='.repeat(50) + '\n\n'
        content += `Bloom's Taxonomy: ${bloomChoice === 'specific' ? specificBloom : (bloomChoice === 'mixed' ? 'Mixed (AI)' : 'None')}\n`
        content += `Scope: ${selectedTopics.length === allTopics.length ? 'Full Context' : `${selectedTopics.length} selected topics`}\n`
        content += '='.repeat(50) + '\n\n'

        questions.forEach((q, i) => {
            content += `Q${i + 1}. ${q.question}\n\n`
            q.options.forEach((opt, j) => {
                const letter = String.fromCharCode(65 + j)
                const isCorrect = j === q.correct_answer ? ' ✓' : ''
                content += `   ${letter}) ${opt}${isCorrect}\n`
            })
            content += '\n' + '-'.repeat(40) + '\n\n'
        })

        content += '\nANSWER KEY\n'
        content += '='.repeat(50) + '\n'
        questions.forEach((q, i) => {
            const letter = String.fromCharCode(65 + q.correct_answer)
            content += `Q${i + 1}: ${letter}\n`
        })

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'quiz_questions.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (

        <div className="min-h-screen py-12 px-4 animate-fade-in pb-24">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">SocratAI Generator</h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-200/60">
                        <span className={step === 'input' ? 'text-cyan-400 font-bold' : ''}>1. Input</span>
                        <span>→</span>
                        <span className={step === 'config' || step === 'topics' ? 'text-cyan-400 font-bold' : ''}>2. Configure</span>
                        <span>→</span>
                        <span className={step === 'questions' ? 'text-cyan-400 font-bold' : ''}>3. Results</span>
                    </div>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3 backdrop-blur-sm">
                        <span className="text-xl">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* --- STEP 1: INPUT --- */}
                {step === 'input' && (
                    <div className="max-w-3xl mx-auto bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 overflow-hidden">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Upload Learning Material</h2>

                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setInputType('text')}
                                    className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${inputType === 'text'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span className="text-xl">✍️</span> Paste Text
                                </button>
                                <button
                                    onClick={() => setInputType('file')}
                                    className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${inputType === 'file'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span className="text-xl">📄</span> Upload File
                                </button>
                            </div>

                            {inputType === 'text' ? (
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Paste your content here..."
                                    className="w-full h-64 p-4 rounded-xl border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none resize-none text-blue-100 leading-relaxed font-mono text-sm bg-black/20 backdrop-blur-sm placeholder-blue-300/30"
                                />
                            ) : (
                                <div className="border-2 border-dashed border-white/10 rounded-xl h-64 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 hover:border-cyan-400/50 transition-all cursor-pointer group relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 bg-blue-500/20 rounded-full shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform text-cyan-400">
                                        {file ? '✅' : '📤'}
                                    </div>
                                    <p className="font-medium text-white text-lg">
                                        {file ? file.name : 'Click to Upload'}
                                    </p>
                                    <p className="text-blue-300/60 mt-1">PDF, JPG, PNG supported</p>
                                </div>
                            )}

                            <button
                                onClick={handleProcessInput}
                                disabled={loading || (!text.trim() && !file)}
                                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : 'Next Step →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: CONFIGURATION --- */}
                {step === 'config' && (
                    <div className="max-w-3xl mx-auto bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-8">
                        <h2 className="text-2xl font-bold text-white mb-8">Configure Quiz</h2>

                        {/* Bloom's Taxonomy Question */}
                        <div className="mb-8">
                            <label className="block text-lg font-semibold text-blue-100 mb-4">
                                1. Do you want to apply Bloom's Taxonomy?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <button
                                    onClick={() => setBloomChoice('none')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${bloomChoice === 'none'
                                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold shadow-lg shadow-cyan-500/10'
                                        : 'border-white/10 bg-white/5 text-blue-200 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    No <span className="text-xs font-normal block text-blue-400/60 mt-1">Standard questions</span>
                                </button>
                                <button
                                    onClick={() => setBloomChoice('mixed')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${bloomChoice === 'mixed'
                                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold shadow-lg shadow-cyan-500/10'
                                        : 'border-white/10 bg-white/5 text-blue-200 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    Mixed (AI) <span className="text-xs font-normal block text-blue-400/60 mt-1">Balanced mix</span>
                                </button>
                                <button
                                    onClick={() => setBloomChoice('specific')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${bloomChoice === 'specific'
                                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold shadow-lg shadow-cyan-500/10'
                                        : 'border-white/10 bg-white/5 text-blue-200 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    Specific Level <span className="text-xs font-normal block text-blue-400/60 mt-1">Choose below</span>
                                </button>
                            </div>

                            {/* Specific Bloom Level Selector (Conditional) */}
                            {bloomChoice === 'specific' && (
                                <div className="bg-blue-500/10 p-4 rounded-xl animate-fade-in border border-blue-500/20">
                                    <p className="text-sm font-medium text-blue-200 mb-2">Select Bloom's Level:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSpecificBloom(level)}
                                                className={`px-4 py-2 rounded-lg text-sm transition-all ${specificBloom === level
                                                    ? 'bg-cyan-500 text-white font-medium shadow-md'
                                                    : 'bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr className="border-white/10 my-8" />

                        {/* Topic Scope Question */}
                        <div className="mb-8">
                            <label className="block text-lg font-semibold text-blue-100 mb-2">
                                2. Topic Scope
                            </label>
                            <div className="bg-black/20 rounded-xl p-5 border border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">
                                        {selectedTopics.length === allTopics.length
                                            ? `All ${allTopics.length} topics included`
                                            : `${selectedTopics.length} of ${allTopics.length} topics selected`}
                                    </p>
                                    <p className="text-sm text-blue-300/60 mt-1">
                                        {selectedTopics.length === allTopics.length ? 'Covering entire content context' : 'Focused on specific areas'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep('topics')}
                                    className="bg-white/10 border border-white/20 text-blue-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 shadow-sm transition-all"
                                >
                                    Select Manual Topics →
                                </button>
                            </div>
                        </div>

                        <hr className="border-white/10 my-8" />

                        {/* Question Count */}
                        <div className="mb-8">
                            <label className="block text-lg font-semibold text-blue-100 mb-4">
                                3. Number of Questions: <span className="text-cyan-400 font-bold">{numQuestions}</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                step="5"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                            <div className="flex justify-between text-xs text-blue-400/50 mt-2 px-1">
                                <span>5</span>
                                <span>10</span>
                                <span>15</span>
                                <span>20</span>
                                <span>25</span>
                                <span>30</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep('input')}
                                className="px-6 py-4 rounded-xl border border-white/10 text-blue-200 font-medium hover:bg-white/5 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
                            >
                                {loading ? 'Generating...' : '✨ Generate Questions'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 3: TOPIC SELECTION (Manual Page) --- */}
                {step === 'topics' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Select Manual Topics</h2>
                                <p className="text-gray-500">Choose exactly what you want to focus on.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={toggleAllTopics}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    {selectedTopics.length === allTopics.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {allTopics.map((topic, i) => {
                                const isSelected = selectedTopics.includes(topic)
                                return (
                                    <div
                                        key={i}
                                        onClick={() => toggleTopic(topic)}
                                        className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                                            ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded border flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'
                                            }`}>
                                            {isSelected && <span className="text-xs">✓</span>}
                                        </div>
                                        <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{topic}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setStep('config')}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                        >
                            Save Selection & Return →
                        </button>
                    </div>
                )}

                {/* --- STEP 4: RESULTS --- */}
                {step === 'questions' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Quiz Ready!</h2>
                                <div className="flex items-center gap-3 text-sm text-blue-200/80 mt-1">
                                    <span className="bg-blue-500/20 px-2 py-1 rounded text-blue-100 font-medium border border-blue-500/30">
                                        {questions.length} Questions
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {bloomChoice === 'specific' ? specificBloom : (bloomChoice === 'mixed' ? 'Mixed Types' : 'Standard')}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={downloadPDF}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all border border-blue-500/50"
                            >
                                <span>📥</span> Download PDF
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, i) => (
                                <div key={i} className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-8 border border-white/10 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <span className="font-mono text-blue-500 font-bold text-lg select-none opacity-60">{String(i + 1).padStart(2, '0')}</span>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-6 leading-relaxed">{q.question}</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {q.options.map((opt, j) => (
                                                    <div
                                                        key={j}
                                                        className={`p-4 rounded-xl flex items-start gap-3 transition-all ${j === q.correct_answer
                                                            ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                                                            : 'bg-white/5 border border-white/5'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${j === q.correct_answer ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white/10 text-blue-200'
                                                            }`}>
                                                            {String.fromCharCode(65 + j)}
                                                        </div>
                                                        <span className={j === q.correct_answer ? 'text-emerald-100 font-medium' : 'text-blue-100/80'}>
                                                            {opt}
                                                        </span>
                                                        {j === q.correct_answer && <span className="ml-auto text-emerald-400 font-bold drop-shadow-sm">✓</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center mt-12 gap-4">
                            <button
                                onClick={() => setStep('config')}
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10 font-medium transition-colors"
                            >
                                Adjust Settings
                            </button>
                            <button
                                onClick={() => {
                                    setStep('input')
                                    setSessionId(null)
                                    setAllTopics([])
                                    setQuestions([])
                                }}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 font-medium shadow-lg shadow-blue-500/20 border border-blue-400/20"
                            >
                                Start New
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
