'use client'

import Link from 'next/link'

export default function Home() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'Advanced AI creates intelligent, context-aware questions from your material'
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
    <div className="animate-fade-in relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm shadow-lg shadow-blue-500/10">
            <span className="animate-pulse-slow">✨</span>
            Powered by Advanced AI
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-sm">
            Transform Your Syllabus Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse-slow"> Smart Quizzes</span>
          </h1>

          <p className="text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload any PDF, paste text, or provide topics. Our AI generates high-quality,
            adaptive quiz questions in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/generator" className="btn-primary text-lg px-8 py-3 ring-2 ring-blue-500/20">
              Generate Quiz →
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Choose SocratAI?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card card-hover p-6 text-center backdrop-blur-xl bg-white/5 border-white/10"
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-blue-200/70 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
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
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-blue-200/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-2xl p-12 text-white border border-white/10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px]"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-8">Create your first AI-powered quiz in under a minute</p>
            <Link href="/generator" className="inline-block bg-white text-blue-900 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-all shadow-lg shadow-white/10">
              Start Generating →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
