'use client'

import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="py-12 px-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black mb-4">About SocratAI</h1>
                    <p className="text-xl text-slate-500 dark:text-blue-200">
                        An AI-powered adaptive quiz generation platform
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* What is SocratAI */}
                    <div className="glass-panel p-8 rounded-3xl animate-fade-in shadow-xl">
                        <h2 className="text-2xl font-black mb-4">What is SocratAI?</h2>
                        <p className="text-slate-600 dark:text-blue-100 leading-relaxed text-lg">
                            SocratAI is an intelligent quiz generation platform that transforms any learning material
                            into high-quality, adaptive quizzes. Using advanced AI, we analyze your syllabus,
                            textbooks, or notes to create meaningful questions that test true understanding.
                        </p>
                    </div>

                    {/* How It Works */}
                    <div className="glass-panel p-8 rounded-3xl animate-fade-in shadow-xl animation-delay-500">
                        <h2 className="text-2xl font-black mb-6">How It Works</h2>
                        <div className="space-y-6 text-slate-600 dark:text-blue-100">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black flex-shrink-0">1</div>
                                <p className="text-lg"><strong>Upload Material:</strong> Submit your syllabus as PDF, image, or paste text directly.</p>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black flex-shrink-0">2</div>
                                <p className="text-lg"><strong>AI Analysis:</strong> Our AI extracts key topics and concepts from your content.</p>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black flex-shrink-0">3</div>
                                <p className="text-lg"><strong>Smart Generation:</strong> Our AI creates questions with plausible distractors.</p>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black flex-shrink-0">4</div>
                                <p className="text-lg"><strong>Adaptive Learning:</strong> Difficulty adjusts based on your performance.</p>
                            </div>
                        </div>
                    </div>

                    {/* Technology Stack */}
                    <div className="glass-panel p-8 rounded-3xl animate-fade-in shadow-xl animation-delay-1000">
                        <h2 className="text-2xl font-black mb-6">Technology Stack</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { name: 'AI Models', desc: 'Latest AI models for question generation' },
                                { name: 'Next.js 16', desc: 'React framework for the frontend' },
                                { name: 'FastAPI', desc: 'Python backend for API services' },
                                { name: 'OCR', desc: 'Text extraction from images' },
                                { name: 'PyPDF2', desc: 'PDF text extraction' },
                                { name: 'Tailwind CSS', desc: 'Utility-first CSS framework' },
                            ].map((tech, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl hover:border-primary/30 transition-all hover-glow">
                                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                    <div>
                                        <p className="font-bold text-foreground leading-tight">{tech.name}</p>
                                        <p className="text-slate-500 dark:text-blue-200/60 text-sm mt-1">{tech.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bloom's Taxonomy */}
                    <div className="glass-panel p-8 rounded-3xl animate-fade-in shadow-xl animation-delay-1500">
                        <h2 className="text-2xl font-black mb-6">Bloom's Taxonomy Support</h2>
                        <p className="text-slate-600 dark:text-blue-100 mb-6 text-lg">
                            SocratAI helps you master material by generating questions targeting specific cognitive levels:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { level: 'Remember', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-200 border-blue-500/20' },
                                { level: 'Understand', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 border-emerald-500/20' },
                                { level: 'Apply', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-200 border-cyan-500/20' },
                                { level: 'Analyze', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-200 border-amber-500/20' },
                                { level: 'Evaluate', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-200 border-rose-500/20' },
                                { level: 'Mixed', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-200 border-slate-500/20' },
                            ].map((item, i) => (
                                <div key={i} className={`px-4 py-3 rounded-2xl text-center font-black border transition-all hover:scale-105 active:scale-95 cursor-default ${item.color}`}>
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
