import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SocratAI - AI-Powered Quiz Generator',
  description: 'Transform your syllabus into adaptive learning quizzes with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <footer className="bg-slate-900/50 backdrop-blur-md border-t border-white/5 py-8">
            <div className="max-w-6xl mx-auto px-4 text-center text-blue-400/60 text-sm">
              <p>© 2026 SocratAI. Built with ❤️ using Next.js</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
