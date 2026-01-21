'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const { theme, toggleTheme } = useTheme()

    const links = [
        { href: '/', label: 'Home' },
        { href: '/generator', label: 'Generate Quiz' },
        { href: '/quiz', label: 'Take Quiz' },
        { href: '/about', label: 'About' },
    ]

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <nav className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-sm">QI</span>
                        </div>
                        <span className="font-bold text-xl text-white tracking-wide">SocratAI</span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                                    ? 'bg-blue-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/20'
                                    : 'text-blue-200/80 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Login Button */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-blue-200/80 hover:text-white px-4 py-2"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/generator"
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
                        >
                            Get Started
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden py-4 border-t border-white/10 animate-fade-in bg-slate-900/95 backdrop-blur-xl absolute top-16 left-0 w-full px-4 shadow-xl">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium mb-1 ${isActive(link.href)
                                    ? 'bg-white/10 text-white'
                                    : 'text-blue-200/80 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                            <Link href="/login" className="btn-secondary flex-1 text-center text-sm">
                                Log in
                            </Link>
                            <Link href="/generator" className="btn-primary flex-1 text-center text-sm">
                                Get Started
                            </Link>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-white/5 text-blue-200"
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
