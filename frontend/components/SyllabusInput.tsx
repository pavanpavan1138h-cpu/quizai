'use client'

import { useState } from 'react'
import { uploadFile, processText } from '@/lib/api'

interface SyllabusInputProps {
  onSuccess: (sessionId: string, topics: string[]) => void
}

export default function SyllabusInput({ onSuccess }: SyllabusInputProps) {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [inputType, setInputType] = useState<'upload' | 'text'>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError(null)

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreview(reader.result as string)
          }
          reader.readAsDataURL(selectedFile)
        } else {
          setPreview(null)
        }
      } else {
        setError('Please upload an image or PDF file')
      }
    }
  }

  const handleProcess = async () => {
    setProcessing(true)
    setError(null)

    try {
      let result
      if (inputType === 'upload') {
        if (!file) {
          setError('Please select a file')
          setProcessing(false)
          return
        }
        result = await uploadFile(file)
      } else {
        if (!text.trim()) {
          setError('Please enter some text')
          setProcessing(false)
          return
        }
        result = await processText(text)
      }
      onSuccess(result.session_id, result.topics)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {inputType === 'upload' ? 'Upload Syllabus' : 'Paste Syllabus Text'}
        </h2>
        <p className="text-gray-600">
          {inputType === 'upload'
            ? 'Upload an image or PDF of your syllabus'
            : 'Paste your syllabus or topic list directly'}
        </p>
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setInputType('upload')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${inputType === 'upload'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          File Upload
        </button>
        <button
          onClick={() => setInputType('text')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${inputType === 'text'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Direct Text
        </button>
      </div>

      {inputType === 'upload' ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-gray-600 font-medium">
              {file ? file.name : 'Click to upload or drag and drop'}
            </span>
            <span className="text-sm text-gray-500 mt-2">
              PNG, JPG, PDF up to 10MB
            </span>
          </label>
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your syllabus content here..."
          className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
        />
      )}

      {preview && inputType === 'upload' && (
        <div className="mt-4 text-center">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg shadow-md mx-auto max-h-96"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(file || (inputType === 'text' && text)) && (
        <button
          onClick={handleProcess}
          disabled={processing}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? 'Processing...' : 'Process & Extract Topics'}
        </button>
      )}
    </div>
  )
}
