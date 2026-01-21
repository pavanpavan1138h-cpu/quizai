'use client'

import Link from 'next/link'

export default function Home() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'Gemini AI creates intelligent, context-aware questions from your material'
    },
    {
      icon: '📊',
      title: 'Adaptive Learning',
      description: 'Questions adapt to your performance level for optimal learning'
    },
    {
      icon: '📥',
      title: 'PDF Export',
      description: 'Download generated questions as PDF for offline study'
    },
    {
      icon: '🎯',
      title: "Bloom's Taxonomy",
      description: "Target specific cognitive levels from Remember to Evaluate"
    }
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="animate-pulse-slow">✨</span>
            Powered by Gemini AI
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Syllabus Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"> Smart Quizzes</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload any PDF, paste text, or provide topics. Our AI generates high-quality,
            adaptive quiz questions in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/generator" className="btn-primary text-lg px-8 py-3">
              Generate Quiz →
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose SocratAI?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card card-hover p-6 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            {[
              { step: '1', title: 'Upload Your Material', desc: 'PDF, image, or paste text directly' },
              { step: '2', title: 'AI Extracts Topics', desc: 'Smart topic detection from your content' },
              { step: '3', title: 'Configure Your Quiz', desc: 'Choose questions, difficulty, and format' },
              { step: '4', title: 'Learn & Download', desc: 'Take the quiz or export as PDF' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-indigo-100 mb-8">Create your first AI-powered quiz in under a minute</p>
          <Link href="/generator" className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-all">
            Start Generating →
          </Link>
        </div>
      </section>
    </div>
  )
}
