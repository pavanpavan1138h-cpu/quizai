import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuizAI - AI-Powered Quiz Generator',
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
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-100 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>© 2026 QuizAI. Built with ❤️ using Next.js and Gemini AI</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
