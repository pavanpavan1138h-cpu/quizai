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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">SocratAI Generator</h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span className={step === 'input' ? 'text-indigo-600 font-bold' : ''}>1. Input</span>
                        <span>→</span>
                        <span className={step === 'config' || step === 'topics' ? 'text-indigo-600 font-bold' : ''}>2. Configure</span>
                        <span>→</span>
                        <span className={step === 'questions' ? 'text-indigo-600 font-bold' : ''}>3. Results</span>
                    </div>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* --- STEP 1: INPUT --- */}
                {step === 'input' && (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md shadow-gray-100 border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Upload Learning Material</h2>

                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setInputType('text')}
                                    className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${inputType === 'text'
                                        ? 'bg-indigo-600 text-white shadow-indigo-200'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-xl">✍️</span> Paste Text
                                </button>
                                <button
                                    onClick={() => setInputType('file')}
                                    className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${inputType === 'file'
                                        ? 'bg-indigo-600 text-white shadow-indigo-200'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
                                    className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none text-gray-700 leading-relaxed font-mono text-sm bg-gray-50/50"
                                />
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl h-64 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform text-indigo-500">
                                        {file ? '✅' : '📤'}
                                    </div>
                                    <p className="font-medium text-gray-900 text-lg">
                                        {file ? file.name : 'Click to Upload'}
                                    </p>
                                    <p className="text-gray-500 mt-1">PDF, JPG, PNG supported</p>
                                </div>
                            )}

                            <button
                                onClick={handleProcessInput}
                                disabled={loading || (!text.trim() && !file)}
                                className="w-full mt-8 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? 'Processing...' : 'Next Step →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: CONFIGURATION --- */}
                {step === 'config' && (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md shadow-gray-100 border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Configure Quiz</h2>

                        {/* Bloom's Taxonomy Question */}
                        <div className="mb-8">
                            <label className="block text-lg font-semibold text-gray-900 mb-4">
                                1. Do you want to apply Bloom's Taxonomy?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <button
                                    onClick={() => setBloomChoice('none')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${bloomChoice === 'none'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    No <span className="text-xs font-normal block text-gray-500 mt-1">Standard questions</span>
                                </button>
                                <button
                                    onClick={() => setBloomChoice('mixed')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${bloomChoice === 'mixed'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    Mixed (AI) <span className="text-xs font-normal block text-gray-500 mt-1">Balanced mix</span>
                                </button>
                                <button
                                    onClick={() => setBloomChoice('specific')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${bloomChoice === 'specific'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    Specific Level <span className="text-xs font-normal block text-gray-500 mt-1">Choose below</span>
                                </button>
                            </div>

                            {/* Specific Bloom Level Selector (Conditional) */}
                            {bloomChoice === 'specific' && (
                                <div className="bg-indigo-50/50 p-4 rounded-xl animate-fade-in border border-indigo-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Select Bloom's Level:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSpecificBloom(level)}
                                                className={`px-4 py-2 rounded-lg text-sm transition-colors ${specificBloom === level
                                                    ? 'bg-indigo-600 text-white font-medium shadow-md'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr className="border-gray-100 my-8" />

                        {/* Topic Scope Question */}
                        <div className="mb-8">
                            <label className="block text-lg font-semibold text-gray-900 mb-2">
                                2. Topic Scope
                            </label>
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {selectedTopics.length === allTopics.length
                                            ? `All ${allTopics.length} topics included`
                                            : `${selectedTopics.length} of ${allTopics.length} topics selected`}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedTopics.length === allTopics.length ? 'Covering entire content context' : 'Focused on specific areas'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep('topics')}
                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all"
                                >
                                    Select Manual Topics →
                                </button>
                            </div>
                        </div>

                        <hr className="border-gray-100 my-8" />

                        {/* Question Count */}
                        <div className="mb-8">
                            <label className="block text-lg font-semibold text-gray-900 mb-4">
                                3. Number of Questions: <span className="text-indigo-600 font-bold">{numQuestions}</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                step="5"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
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
                                className="px-6 py-4 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={loading}
                                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Quiz Ready!</h2>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all"
                            >
                                <span>📥</span> Download PDF
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, i) => (
                                <div key={i} className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <span className="font-mono text-gray-300 font-bold text-lg select-none">{String(i + 1).padStart(2, '0')}</span>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6">{q.question}</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {q.options.map((opt, j) => (
                                                    <div
                                                        key={j}
                                                        className={`p-4 rounded-lg flex items-start gap-3 ${j === q.correct_answer
                                                            ? 'bg-emerald-50 border border-emerald-100'
                                                            : 'bg-gray-50 border border-transparent'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${j === q.correct_answer ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'
                                                            }`}>
                                                            {String.fromCharCode(65 + j)}
                                                        </div>
                                                        <span className={j === q.correct_answer ? 'text-emerald-900 font-medium' : 'text-gray-600'}>
                                                            {opt}
                                                        </span>
                                                        {j === q.correct_answer && <span className="ml-auto text-emerald-600 font-bold">✓</span>}
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
                                className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
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
                                className="px-6 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-medium shadow-lg"
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
