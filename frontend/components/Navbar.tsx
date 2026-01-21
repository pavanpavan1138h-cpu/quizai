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
        <nav className="glass-panel border-b border-primary/10 sticky top-0 z-50 bg-opacity-70 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            <span className="text-white font-black text-xs">SA</span>
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-foreground">SocratAI</span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive(link.href)
                                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                                    : 'text-slate-500 dark:text-blue-200/70 hover:bg-primary/5 hover:text-primary'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Login Button */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-bold text-slate-500 dark:text-blue-200/80 hover:text-primary px-4 py-2 transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/generator"
                            className="btn-primary px-6 py-2.5 text-sm"
                        >
                            Get Started
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center justify-center border border-primary/10"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-3 rounded-xl bg-primary/5 text-primary border border-primary/10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden py-6 border-t border-primary/10 animate-fade-in glass-panel absolute top-20 left-0 w-full px-6 shadow-2xl flex flex-col gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-5 py-3 rounded-xl text-md font-bold transition-all ${isActive(link.href)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-500 dark:text-blue-200 hover:bg-primary/5 hover:text-primary'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-6 pt-6 border-t border-primary/10 flex flex-wrap gap-3">
                            <Link href="/login" className="btn-secondary flex-1 py-3 text-center text-sm">
                                Log in
                            </Link>
                            <Link href="/generator" className="btn-primary flex-2 py-3 text-center text-sm">
                                Get Started
                            </Link>
                            <button
                                onClick={toggleTheme}
                                className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10"
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
