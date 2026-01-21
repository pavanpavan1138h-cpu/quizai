'use client'

import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="py-12 px-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">About SocratAI</h1>
                    <p className="text-xl text-gray-600">
                        An AI-powered adaptive quiz generation platform
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* What is SocratAI */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">What is SocratAI?</h2>
                        <p className="text-gray-600 leading-relaxed">
                            SocratAI is an intelligent quiz generation platform that transforms any learning material
                            into high-quality, adaptive quizzes. Using Google's Gemini AI, we analyze your syllabus,
                            textbooks, or notes to create meaningful questions that test true understanding.
                        </p>
                    </div>

                    {/* How It Works */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <div className="space-y-4 text-gray-600">
                            <div className="flex items-start gap-3">
                                <span className="text-indigo-500 font-bold">1.</span>
                                <p><strong>Upload Material:</strong> Submit your syllabus as PDF, image, or paste text directly.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-indigo-500 font-bold">2.</span>
                                <p><strong>AI Analysis:</strong> Our AI extracts key topics and concepts from your content.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-indigo-500 font-bold">3.</span>
                                <p><strong>Smart Generation:</strong> Gemini AI creates questions with plausible distractors.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-indigo-500 font-bold">4.</span>
                                <p><strong>Adaptive Learning:</strong> Difficulty adjusts based on your performance.</p>
                            </div>
                        </div>
                    </div>

                    {/* Technology Stack */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology Stack</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { name: 'Gemini AI', desc: 'Google\'s latest AI model for question generation' },
                                { name: 'Next.js 16', desc: 'React framework for the frontend' },
                                { name: 'FastAPI', desc: 'Python backend for API services' },
                                { name: 'EasyOCR', desc: 'Text extraction from images' },
                                { name: 'PyPDF2', desc: 'PDF text extraction' },
                                { name: 'Tailwind CSS', desc: 'Utility-first CSS framework' },
                            ].map((tech, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    <div>
                                        <span className="font-medium text-gray-900">{tech.name}</span>
                                        <span className="text-gray-500 text-sm ml-2">– {tech.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bloom's Taxonomy */}
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Bloom's Taxonomy Support</h2>
                        <p className="text-gray-600 mb-4">
                            Generate questions targeting specific cognitive levels:
                        </p>
                        <div className="grid md:grid-cols-3 gap-3">
                            {[
                                { level: 'Remember', color: 'bg-blue-100 text-blue-700' },
                                { level: 'Understand', color: 'bg-green-100 text-green-700' },
                                { level: 'Apply', color: 'bg-yellow-100 text-yellow-700' },
                                { level: 'Analyze', color: 'bg-orange-100 text-orange-700' },
                                { level: 'Evaluate', color: 'bg-red-100 text-red-700' },
                                { level: 'Mixed', color: 'bg-purple-100 text-purple-700' },
                            ].map((item, i) => (
                                <div key={i} className={`px-4 py-2 rounded-lg text-center font-medium ${item.color}`}>
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
