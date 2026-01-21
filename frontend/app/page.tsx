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
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm animate-float">
            <span className="animate-pulse-slow">✨</span>
            Powered by Advanced AI
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight text-foreground">
            Transform Your Syllabus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300">
              Into Smart Quizzes
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-blue-100/80 mb-10 max-w-3xl mx-auto leading-relaxed">
            Upload any PDF, paste text, or provide topics. Our AI generates high-quality,
            adaptive quiz questions in seconds for <span className="text-blue-600 dark:text-blue-400 font-bold">personalized learning</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/generator" className="btn-primary text-xl px-10 py-5 shadow-2xl shadow-blue-500/30 hover:-translate-y-1 transition-transform">
              Generate Quiz →
            </Link>
            <Link href="/about" className="btn-secondary text-xl px-10 py-5 hover:-translate-y-1 transition-transform">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 text-foreground">
            Why Choose SocratAI?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`glass-panel card-hover p-8 text-center animate-float hover-tilt ${index % 2 === 0 ? 'animation-delay-2000' : ''}`}
                style={{ animationDelay: `${index * 500}ms` }}
              >
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-slate-500 dark:text-blue-200/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 text-foreground">
            How It Works
          </h2>

          <div className="grid gap-10">
            {[
              { step: '1', title: 'Upload Your Material', desc: 'PDF, image, or paste text directly' },
              { step: '2', title: 'AI Extracts Topics', desc: 'Smart topic detection from your content' },
              { step: '3', title: 'Configure Your Quiz', desc: 'Choose questions, difficulty, and format' },
              { step: '4', title: 'Learn & Download', desc: 'Take the quiz or export as PDF' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-lg text-slate-500 dark:text-blue-200/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center glass-panel rounded-[2rem] p-16 relative overflow-hidden border-2 border-primary/20">
          <div className="absolute inset-0 bg-blue-600/10 blur-[120px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-6 text-foreground">Ready to Get Started?</h2>
            <p className="text-2xl text-slate-600 dark:text-blue-100 mb-10 max-w-2xl mx-auto">Create your first AI-powered quiz in under a minute and revolutionize your study routine.</p>
            <Link href="/generator" className="btn-primary text-2xl px-12 py-6">
              Start Generating →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
