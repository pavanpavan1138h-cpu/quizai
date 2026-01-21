import { useState } from 'react'

interface TopicsListProps {
  sessionId: string
  topics: string[]
  onStartQuiz: (type: 'initial' | 'adaptive', bloomLevel: string) => void
  onViewStats: () => void
}

export default function TopicsList({ sessionId, topics, onStartQuiz, onViewStats }: TopicsListProps) {
  const [bloomLevel, setBloomLevel] = useState('None')

  const bloomLevels = [
    { value: 'None', label: 'None (Standard Quiz)', color: 'bg-gray-100 text-gray-700' },
    { value: 'Mixed', label: 'Mixed (AI Choice)', color: 'bg-blue-50 text-blue-700' },
    { value: 'Remember', label: 'Remember (Recall facts)', color: 'bg-green-50 text-green-700' },
    { value: 'Understand', label: 'Understand (Explain ideas)', color: 'bg-yellow-50 text-yellow-700' },
    { value: 'Apply', label: 'Apply (Use info in situations)', color: 'bg-orange-50 text-orange-700' },
    { value: 'Analyze', label: 'Analyze (Draw connections)', color: 'bg-purple-50 text-purple-700' },
    { value: 'Evaluate', label: 'Evaluate (Critical assessment)', color: 'bg-red-50 text-red-700' }
  ]
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Extracted Topics
        </h2>
        <button
          onClick={onViewStats}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          View Stats
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-4">
          Found {topics.length} topics in your syllabus:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((topic, index) => (
            <li
              key={index}
              className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
            >
              <span className="text-primary-600 font-medium mr-2">
                {index + 1}.
              </span>
              <span className="text-gray-800">{topic}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Start Quiz
        </h3>
        <p className="text-gray-600 mb-6">
          Take a test to assess your knowledge. Select a learning depth (Bloom's Taxonomy)
          level if you want to focus on specific cognitive domains.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Learning Depth (Bloom's Taxonomy)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {bloomLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setBloomLevel(level.value)}
                className={`text-xs p-3 rounded-lg border-2 transition-all text-left flex flex-col justify-between ${bloomLevel === level.value
                  ? 'border-primary-600 ring-2 ring-primary-100 ring-opacity-50'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <span className="font-bold">{level.value}</span>
                <span className="text-[10px] opacity-75">{level.label.split('(')[1].replace(')', '')}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onStartQuiz('initial', bloomLevel)}
          className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          Generate Quiz at {bloomLevel} Level
        </button>
      </div>
    </div>
  )
}
