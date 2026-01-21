'use client'

import { useState } from 'react'
import { uploadFile, processText, generateQuiz } from '@/lib/api'

interface Question {
    question: string
    options: string[]
    correct_answer: number
}

// Extended step flow
type Step = 'input' | 'topics' | 'config' | 'questions'

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
    const [bloomLevel, setBloomLevel] = useState('Mixed')

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
            setStep('topics')
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
            const result = await generateQuiz(sessionId, numQuestions, bloomLevel)
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
        content += `Bloom's Level: ${bloomLevel}\n`
        content += `Selected Topics: ${selectedTopics.length} topics\n`
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

    // Helper for step progress
    const renderProgressBar = () => {
        const steps = [
            { id: 'input', label: 'Input' },
            { id: 'topics', label: 'Select Topics' },
            { id: 'config', label: 'Configure' },
            { id: 'questions', label: 'Questions' }
        ]
        const currentIdx = steps.findIndex(s => s.id === step)

        return (
            <div className="flex items-center justify-center w-full mb-10 overflow-x-auto">
                <div className="flex items-center min-w-max gap-0">
                    {steps.map((s, i) => {
                        const isActive = i <= currentIdx
                        const isLast = i === steps.length - 1
                        return (
                            <div key={s.id} className="flex items-center">
                                <div className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isActive
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-400'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <span className={`text-xs font-semibold uppercase tracking-wider absolute -bottom-6 w-32 text-center ${isActive ? 'text-indigo-600' : 'text-gray-400'
                                        }`}>
                                        {s.label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className={`w-20 md:w-32 h-0.5 mx-2 mb-2 transition-all ${i < currentIdx ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 animate-fade-in pb-24">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Generator</h1>
                    <p className="text-lg text-gray-600">Transform your content into learning material</p>
                </div>

                {renderProgressBar()}

                {/* Error Banner */}
                {error && (
                    <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* --- STEP 1: INPUT --- */}
                {step === 'input' && (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800">Upload Source Material</h2>
                        </div>
                        <div className="p-8">
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setInputType('text')}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${inputType === 'text'
                                            ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                                            : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-xl">✍️</span> Paste Text
                                </button>
                                <button
                                    onClick={() => setInputType('file')}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${inputType === 'file'
                                            ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                                            : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-xl">📄</span> Upload File
                                </button>
                            </div>

                            {inputType === 'text' ? (
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Paste your syllabus, notes, or chapter text here..."
                                    className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none text-gray-700 leading-relaxed font-mono text-sm"
                                />
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl h-64 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer group relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                        {file ? '✅' : '📤'}
                                    </div>
                                    <p className="font-medium text-gray-900 text-lg">
                                        {file ? file.name : 'Drop your file here'}
                                    </p>
                                    <p className="text-gray-500 mt-1">Supports PDF, JPG, PNG</p>
                                </div>
                            )}

                            <button
                                onClick={handleProcessInput}
                                disabled={loading || (!text.trim() && !file)}
                                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span> Processing...
                                    </>
                                ) : (
                                    <>Next: Select Topics →</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: TOPIC SELECTION --- */}
                {step === 'topics' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Select Topics</h2>
                                <p className="text-gray-500">Choose the concepts you want to be tested on.</p>
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
                                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all group ${isSelected
                                                ? 'bg-white border-indigo-500 shadow-md shadow-indigo-100'
                                                : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-gray-50'
                                            }`}>
                                            {isSelected && <span className="text-white text-xs">✓</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold text-gray-400 font-mono">#{String(i + 1).padStart(2, '0')}</span>
                                                <h3 className={`font-medium transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{topic}</h3>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('input')}
                                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep('config')}
                                disabled={selectedTopics.length === 0}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                Next: Configure Quiz →
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 3: CONFIGURATION --- */}
                {step === 'config' && (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Customize Your Quiz</h2>

                        {/* Bloom's Taxonomy Section */}
                        <div className="mb-10">
                            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                                Bloom's Taxonomy Level
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'Mixed', label: 'Mixed Levels', desc: 'Balanced mix of all types', icon: '🎨' },
                                    { id: 'Remember', label: 'Remember', desc: 'Recall facts & definitions', icon: '🧠' },
                                    { id: 'Understand', label: 'Understand', desc: 'Explain ideas & concepts', icon: '💡' },
                                    { id: 'Apply', label: 'Apply', desc: 'Use info in new situations', icon: '🛠️' },
                                    { id: 'Analyze', label: 'Analyze', desc: 'Draw connections', icon: '🔍' },
                                    { id: 'Evaluate', label: 'Evaluate', desc: 'Justify a stand or decision', icon: '⚖️' },
                                ].map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => setBloomLevel(level.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${bloomLevel === level.id
                                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                                : 'border-gray-100 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{level.icon}</div>
                                        <div className="font-bold text-gray-900 text-sm mb-1">{level.label}</div>
                                        <div className="text-xs text-gray-500 leading-tight">{level.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Count */}
                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                    Number of Questions
                                </label>
                                <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg">
                                    {numQuestions}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                step="1"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>5 Questions</span>
                                <span>30 Questions</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('topics')}
                                className="px-6 py-4 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                {loading ? '🔮 Generating Magic...' : '✨ Generate Questions'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 4: RESULTS --- */}
                {step === 'questions' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Questions Ready!</h2>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">📊 {questions.length} Questions</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="flex items-center gap-1">🏷️ {bloomLevel} Level</span>
                                </div>
                            </div>
                            <button
                                onClick={downloadPDF}
                                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-gray-200 transition-all"
                            >
                                <span>📥</span> Download PDF
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, i) => (
                                <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-indigo-100 text-indigo-700 font-bold rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">{q.question}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, j) => (
                                                    <div
                                                        key={j}
                                                        className={`p-3 rounded-lg text-sm border ${j === q.correct_answer
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                                                                : 'bg-white border-gray-200 text-gray-600'
                                                            }`}
                                                    >
                                                        <span className="mr-2 opacity-60">{String.fromCharCode(65 + j)}.</span>
                                                        {opt}
                                                        {j === q.correct_answer && <span className="float-right">✅</span>}
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
                                Regenerate
                            </button>
                            <button
                                onClick={() => {
                                    setStep('input')
                                    setSessionId(null)
                                    setAllTopics([])
                                    setQuestions([])
                                }}
                                className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-md shadow-indigo-200"
                            >
                                Start New Quiz
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
