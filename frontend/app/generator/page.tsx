'use client'

import { useState } from 'react'
import { uploadFile, processText, generateQuiz } from '@/lib/api'

interface Question {
    question: string
    options: string[]
    correct_answer: number
}

export default function GeneratorPage() {
    const [inputType, setInputType] = useState<'file' | 'text'>('text')
    const [text, setText] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'input' | 'topics' | 'questions'>('input')
    const [topics, setTopics] = useState<string[]>([])
    const [questions, setQuestions] = useState<Question[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [numQuestions, setNumQuestions] = useState(10)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
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
            setTopics(result.topics)
            setStep('topics')
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to process content')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateQuestions = async () => {
        if (!sessionId) return
        setLoading(true)
        setError(null)
        try {
            const result = await generateQuiz(sessionId, numQuestions, 'Mixed')
            setQuestions(result.questions)
            setStep('questions')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate questions')
        } finally {
            setLoading(false)
        }
    }

    const downloadPDF = () => {
        // Create PDF content
        let content = 'QUIZ QUESTIONS\n'
        content += '='.repeat(50) + '\n\n'
        content += `Generated from: ${topics.slice(0, 5).join(', ')}\n`
        content += `Total Questions: ${questions.length}\n\n`
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

        // Download as text file (PDF requires library)
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'quiz_questions.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="py-12 px-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Generator</h1>
                    <p className="text-gray-600">Generate quiz questions and download as PDF</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {['Input', 'Topics', 'Questions'].map((label, i) => {
                        const stepNames = ['input', 'topics', 'questions']
                        const isActive = stepNames.indexOf(step) >= i
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {i + 1}
                                </div>
                                <span className={`text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                                {i < 2 && <div className={`w-12 h-0.5 ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>}
                            </div>
                        )
                    })}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="card p-8">
                        {/* Input Type Toggle */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setInputType('text')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-all ${inputType === 'text'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                📝 Paste Text
                            </button>
                            <button
                                onClick={() => setInputType('file')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-all ${inputType === 'file'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                📄 Upload File
                            </button>
                        </div>

                        {inputType === 'text' ? (
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste your syllabus, notes, or any text content here..."
                                className="input min-h-[200px] resize-y"
                            />
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-gray-600">
                                        {file ? file.name : 'Click to upload PDF or image'}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">Supports PDF, PNG, JPG</p>
                                </label>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || (!text.trim() && !file)}
                            className="btn-primary w-full mt-6 py-3 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Extract Topics →'}
                        </button>
                    </div>
                )}

                {/* Step 2: Topics */}
                {step === 'topics' && (
                    <div className="card p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Topics</h2>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {topics.map((topic, i) => (
                                <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                                    {topic}
                                </span>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 pt-6">
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
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>5 (Quick)</span>
                                <span>20 (Comprehensive)</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setStep('input')} className="btn-secondary flex-1">
                                ← Back
                            </button>
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Generating...' : `Generate ${numQuestions} Questions →`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Questions */}
                {step === 'questions' && (
                    <div className="space-y-6">
                        {/* Download Button */}
                        <div className="card p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Generated Questions</h2>
                                <p className="text-gray-600 text-sm">{questions.length} questions ready</p>
                            </div>
                            <button onClick={downloadPDF} className="btn-accent flex items-center gap-2">
                                📥 Download PDF
                            </button>
                        </div>

                        {/* Questions List */}
                        {questions.map((q, i) => (
                            <div key={i} className="card p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <p className="text-gray-900 font-medium">{q.question}</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 ml-11">
                                    {q.options.map((opt, j) => (
                                        <div
                                            key={j}
                                            className={`p-3 rounded-lg border ${j === q.correct_answer
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                                }`}
                                        >
                                            <span className="font-medium mr-2">{String.fromCharCode(65 + j)})</span>
                                            {opt}
                                            {j === q.correct_answer && <span className="ml-2">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={() => setStep('topics')} className="btn-secondary flex-1">
                                ← Generate More
                            </button>
                            <button onClick={() => { setStep('input'); setQuestions([]); setTopics([]) }} className="btn-secondary flex-1">
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
