'use client'

import { useState } from 'react'
import { Header } from '../components/Header'

export default function Home() {
  const [url, setUrl] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('http://localhost:3001/api/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          startTime: parseFloat(startTime),
          endTime: endTime ? parseFloat(endTime) : undefined,
        }),
      })
      
      const data = await response.json()
      console.log('Analysis started:', data)
      
      // For now, just show a success message
      setResult({ message: 'Analysis started successfully!', analysisId: data.data.analysisId })
    } catch (error) {
      console.error('Error starting analysis:', error)
      setResult({ message: 'Error starting analysis', error: true })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎵 ChordRectness
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered chord recognition for YouTube videos
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time (seconds)
                  </label>
                  <input
                    type="number"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time (seconds) - Optional
                  </label>
                  <input
                    type="number"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="60"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Chords'}
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded-md ${
                result.error 
                  ? 'bg-red-50 border border-red-200 text-red-700' 
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <p className="font-medium">{result.message}</p>
                {result.analysisId && (
                  <p className="text-sm mt-1">Analysis ID: {result.analysisId}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🎬</div>
                <h3 className="font-semibold mb-2">1. Paste YouTube URL</h3>
                <p className="text-gray-600">Enter any YouTube video URL you want to analyze</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">⏰</div>
                <h3 className="font-semibold mb-2">2. Set Time Range</h3>
                <p className="text-gray-600">Specify the start and end time for analysis</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🎼</div>
                <h3 className="font-semibold mb-2">3. Get Chord Progression</h3>
                <p className="text-gray-600">AI analyzes the audio and returns chord symbols</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}