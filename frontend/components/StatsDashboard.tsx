'use client'

import { useState, useEffect } from 'react'
import { getStats } from '@/lib/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StatsDashboardProps {
  sessionId: string
  onBack: () => void
  onStartAdaptiveQuiz: () => void
}

export default function StatsDashboard({ sessionId, onBack, onStartAdaptiveQuiz }: StatsDashboardProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [sessionId])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getStats(sessionId)
      setStats(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-blue-200">Loading statistics...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded mb-4">
          {error || 'No statistics available'}
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

  const quizHistoryData = stats.quiz_history.map((quiz: any) => ({
    name: `Quiz ${quiz.quiz_number}`,
    score: quiz.score,
  }))

  const topicData = Object.entries(stats.topic_performance).map(([topic, score]) => ({
    topic: topic.length > 30 ? topic.substring(0, 30) + '...' : topic,
    score: score as number,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-blue-400">Score: {payload[0].value}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Performance Statistics
        </h2>
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-sm text-blue-300 font-medium mb-1 uppercase tracking-wide">
            Total Quizzes
          </div>
          <div className="text-3xl font-bold text-blue-50">
            {stats.total_quizzes}
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-sm text-emerald-300 font-medium mb-1 uppercase tracking-wide">
            Average Score
          </div>
          <div className="text-3xl font-bold text-emerald-50">
            {stats.average_score.toFixed(1)}%
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-sm text-purple-300 font-medium mb-1 uppercase tracking-wide">
            Topics Covered
          </div>
          <div className="text-3xl font-bold text-purple-50">
            {Object.keys(stats.topic_performance).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">
            Quiz Performance Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quizHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 8 }}
                name="Score (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">
            Topic Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={onStartAdaptiveQuiz}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          Start Adaptive Quiz
        </button>
        <button
          onClick={onBack}
          className="px-8 py-4 border border-white/10 rounded-xl text-blue-200 hover:bg-white/5 font-medium transition-colors"
        >
          Back to Topics
        </button>
      </div>
    </div>
  )
}
