'use client'

import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="py-12 px-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">About SocratAI</h1>
                    <p className="text-xl text-blue-200">
                        An AI-powered adaptive quiz generation platform
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* What is SocratAI */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">What is SocratAI?</h2>
                        <p className="text-blue-100 leading-relaxed">
                            SocratAI is an intelligent quiz generation platform that transforms any learning material
                            into high-quality, adaptive quizzes. Using advanced AI, we analyze your syllabus,
                            textbooks, or notes to create meaningful questions that test true understanding.
                        </p>
                    </div>

                    {/* How It Works */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
                        <div className="space-y-4 text-blue-100">
                            <div className="flex items-start gap-3">
                                <span className="text-cyan-400 font-bold">1.</span>
                                <p><strong>Upload Material:</strong> Submit your syllabus as PDF, image, or paste text directly.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-cyan-400 font-bold">2.</span>
                                <p><strong>AI Analysis:</strong> Our AI extracts key topics and concepts from your content.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-cyan-400 font-bold">3.</span>
                                <p><strong>Smart Generation:</strong> Our AI creates questions with plausible distractors.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-cyan-400 font-bold">4.</span>
                                <p><strong>Adaptive Learning:</strong> Difficulty adjusts based on your performance.</p>
                            </div>
                        </div>
                    </div>

                    {/* Technology Stack */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Technology Stack</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { name: 'AI Models', desc: 'Latest AI models for question generation' },
                                { name: 'Next.js 16', desc: 'React framework for the frontend' },
                                { name: 'FastAPI', desc: 'Python backend for API services' },
                                { name: 'OCR', desc: 'Text extraction from images' },
                                { name: 'PyPDF2', desc: 'PDF text extraction' },
                                { name: 'Tailwind CSS', desc: 'Utility-first CSS framework' },
                            ].map((tech, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                                    <div>
                                        <span className="font-medium text-white">{tech.name}</span>
                                        <span className="text-blue-200 text-sm ml-2">– {tech.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bloom's Taxonomy */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Bloom's Taxonomy Support</h2>
                        <p className="text-blue-100 mb-4">
                            Generate questions targeting specific cognitive levels:
                        </p>
                        <div className="grid md:grid-cols-3 gap-3">
                            {[
                                { level: 'Remember', color: 'bg-blue-900/40 text-blue-200 border border-blue-500/30' },
                                { level: 'Understand', color: 'bg-blue-800/40 text-blue-100 border border-blue-400/30' },
                                { level: 'Apply', color: 'bg-cyan-900/40 text-cyan-200 border border-cyan-500/30' },
                                { level: 'Analyze', color: 'bg-sky-900/40 text-sky-200 border border-sky-500/30' },
                                { level: 'Evaluate', color: 'bg-indigo-900/40 text-indigo-200 border border-indigo-500/30' },
                                { level: 'Mixed', color: 'bg-slate-800/60 text-slate-200 border border-slate-500/30' },
                            ].map((item, i) => (
                                <div key={i} className={`px-4 py-2 rounded-lg text-center font-medium backdrop-blur-sm ${item.color}`}>
                                    {item.level}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center pt-8">
                        <Link href="/generator" className="btn-primary text-lg px-8 py-3">
                            Try It Now →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
