'use client'

import { useState, useEffect } from 'react'
import { generateQuiz, generateAdaptiveQuiz, submitQuiz } from '@/lib/api'

interface QuizModuleProps {
  sessionId: string
  quizType: 'initial' | 'adaptive'
  bloomLevel?: string
  onComplete: (score: number) => void
  onBack: () => void
}

interface Question {
  question: string
  options: string[]
  correct_answer: number
}

export default function QuizModule({ sessionId, quizType, bloomLevel = 'Mixed', onComplete, onBack }: QuizModuleProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    loadQuiz()
  }, [sessionId, quizType, bloomLevel])

  const loadQuiz = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = quizType === 'initial'
        ? await generateQuiz(sessionId, 18, bloomLevel)
        : await generateAdaptiveQuiz(sessionId, 18, bloomLevel)

      setQuestions(result.questions)
      setQuizId(result.quiz_id)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers({
      ...answers,
      [questionIndex]: answerIndex,
    })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    if (!quizId) return

    setSubmitting(true)
    try {
      const result = await submitQuiz(quizId, sessionId, answers)
      setResults(result)
      setTimeout(() => {
        onComplete(result.score)
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-blue-200">Generating quiz questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (results) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="mb-6">
          <div className="text-6xl font-bold text-white mb-2 filter drop-shadow-lg">
            {results.score.toFixed(1)}%
          </div>
          <p className="text-xl text-blue-100">
            You scored {results.correct} out of {results.total}
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 text-left shadow-lg">
          <h3 className="font-bold text-white mb-4">Results Summary</h3>
          <div className="space-y-2">
            {results.results.map((result: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between ${result.is_correct
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
                  }`}
              >
                <span className="text-sm text-blue-100">Question {idx + 1}</span>
                <span className={`font-medium ${result.is_correct ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                  {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 mb-4">
          Next quiz difficulty: <span className="font-bold capitalize text-white">{results.next_difficulty}</span>
        </p>

        <p className="text-sm text-blue-400/60 animate-pulse">Redirecting to stats...</p>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-blue-300 hover:text-white font-medium transition-colors"
        >
          ← Back
        </button>
        <div className="text-sm text-blue-300/60 font-mono">
          Question <span className="text-white">{currentQuestion + 1}</span> / {questions.length}
        </div>
      </div>

      <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-white/5">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-8 leading-relaxed">
          {question.question}
        </h3>

        <div className="space-y-4">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${answers[currentQuestion] === index
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={index}
                checked={answers[currentQuestion] === index}
                onChange={() => handleAnswerSelect(currentQuestion, index)}
                className="mr-4 w-5 h-5 text-blue-500 accent-blue-500"
              />
              <span className={`text-lg ${answers[currentQuestion] === index ? 'text-white' : 'text-blue-100/80'}`}>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border border-white/10 rounded-xl text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
        >
          Previous
        </button>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            Next Question →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>

      <div className="text-center text-sm text-blue-300/40">
        {answeredCount} of {questions.length} questions answered
      </div>
    </div>
  )
}
