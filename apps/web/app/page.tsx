'use client'

import { useState, useRef } from 'react'
import { Header } from '../components/Header'
import { AudioPlayer } from '../components/AudioPlayer'
import { PianoKeyboard } from '../components/PianoKeyboard'

interface ChordResult {
  chord: string
  confidence: number
  chroma_vector: number[]
  analysis_time: number
  model_type: string
  source?: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStatus, setAnalysisStatus] = useState<string>('')
  const [result, setResult] = useState<ChordResult | null>(null)
  const [topChords, setTopChords] = useState<Array<{chord: string, confidence: number}> | null>(null)
  const [showTopChords, setShowTopChords] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [youtubeStartTime, setYoutubeStartTime] = useState(0)
  const [youtubeEndTime, setYoutubeEndTime] = useState(10)
  const [youtubeAudioUrl, setYoutubeAudioUrl] = useState<string | null>(null)
  const [youtubeDuration, setYoutubeDuration] = useState<number>(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)

      // Create audio URL for the player
      const url = URL.createObjectURL(selectedFile)
      setAudioUrl(url)

      // Reset time ranges
      setStartTime(0)
      setEndTime(0)
    }
  }

  const handleTimeRangeChange = (start: number, end: number) => {
    setStartTime(start)
    setEndTime(end)
  }

  const handleYouTubeDownload = async () => {
    if (!url) return;

    setIsDownloading(true)
    setError(null)

    try {
        const response = await fetch('http://localhost:3001/api/youtube/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setYoutubeAudioUrl(`http://localhost:3001${data.data.audioUrl}`)
        setYoutubeDuration(data.data.duration)
        setAudioUrl(`http://localhost:3001${data.data.audioUrl}`)
        setAudioDuration(data.data.duration)
        // Reset time ranges
        setYoutubeStartTime(0)
        setYoutubeEndTime(Math.min(10, data.data.duration))
        setStartTime(0)
        setEndTime(Math.min(10, data.data.duration))
      } else {
        throw new Error(data.error || 'Failed to download YouTube audio')
      }
    } catch (error) {
      console.error('Error downloading YouTube audio:', error)
      setError(error instanceof Error ? error.message : 'Failed to download YouTube audio')
    } finally {
      setIsDownloading(false)
    }
  }

  // Generate mock top 5 chords for demonstration
  const generateTopChords = (mainChord: string, confidence: number) => {
    const chordVariations = [
      mainChord,
      mainChord.replace('maj', 'm').replace('m', 'maj'),
      mainChord.replace('7', '').replace('maj7', ''),
      mainChord + '7',
      mainChord.replace('7', '9'),
      mainChord.replace('maj', 'sus4'),
      mainChord.replace('maj', 'sus2'),
      mainChord.replace('7', 'maj7'),
      mainChord.replace('maj7', '7'),
      mainChord.replace('m', 'dim')
    ].filter((chord, index, arr) => arr.indexOf(chord) === index) // Remove duplicates

    return chordVariations.slice(0, 5).map((chord, index) => ({
      chord,
      confidence: index === 0 ? confidence : Math.max(0.1, confidence - (index * 0.15) + Math.random() * 0.1)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      if (activeTab === 'upload' && file) {
        // Handle file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('start_time', startTime.toString())
        if (endTime > startTime) formData.append('end_time', endTime.toString())
        formData.append('model_type', 'chroma')

        const response = await fetch('http://localhost:3001/api/analysis/audio', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setResult(data)
        // Generate top 5 alternative chords
        setTopChords(generateTopChords(data.chord, data.confidence))
        setShowTopChords(false) // Start with alternatives hidden
      } else if (activeTab === 'youtube' && youtubeAudioUrl) {
        // Handle YouTube analysis using the downloaded audio and selected time range
        setAnalysisStatus('Starting analysis...')
        const response = await fetch('http://localhost:3001/api/analysis/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            startTime: startTime,
            endTime: endTime > startTime ? endTime : undefined
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          // For YouTube, we get an analysis ID, so we need to poll for results
          const analysisId = data.data.analysisId

          // Start polling for results
          const pollForResults = async () => {
            try {
              const statusResponse = await fetch(`http://localhost:3001/api/analysis/${analysisId}`)
              const statusData = await statusResponse.json()

              if (statusData.success) {
                const data = statusData.data

                // Update progress and status
                setAnalysisProgress(data.progress || 0)

                if (data.status === 'completed') {
                  setAnalysisStatus('Analysis complete!')
                  // Analysis completed, get the results
                  const results = data.results
                  if (results && results.chords && results.chords.length > 0) {
                    const chordResult = results.chords[0] // Get the first chord result
                    setResult({
                      chord: chordResult.chord,
                      confidence: chordResult.confidence,
                      chroma_vector: [], // YouTube results don't include chroma vector yet
                      analysis_time: 0, // Could be calculated from timestamps
                      model_type: 'chroma',
                      source: 'youtube'
                    })
                    // Generate top chords for YouTube results too
                    setTopChords(generateTopChords(chordResult.chord, chordResult.confidence))
                    setShowTopChords(false)
                  } else {
                    throw new Error('No chord results found')
                  }
                } else if (data.status === 'error') {
                  throw new Error('YouTube analysis failed')
                } else if (data.status === 'processing') {
                  setAnalysisStatus(`Processing... ${Math.round((data.progress || 0) * 100)}%`)
                  // Still processing, poll again in 1 second
                  setTimeout(pollForResults, 1000)
                } else {
                  setAnalysisStatus('Waiting...')
                  // Still processing, poll again in 1 second
                  setTimeout(pollForResults, 1000)
                }
              } else {
                throw new Error('Failed to get analysis status')
              }
            } catch (error) {
              console.error('Error polling for results:', error)
              setError('Failed to get analysis results')
            }
          }

          // Start polling
          pollForResults()
        } else {
          throw new Error(data.error || 'YouTube analysis failed')
        }
      } else {
        setError('Please select a file or enter a YouTube URL')
      }
    } catch (error) {
      console.error('Error during analysis:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during analysis')
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
              ChordRectness
              </h1>
            <p className="text-xl text-gray-600">
              AI-powered chord recognition
            </p>
          </div>

          {/* Results - Prominent Display */}
          {result && (
            <div className="mb-6">
              <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-lg">
                <div className="text-center mb-4">
                  <button
                    onClick={() => setShowTopChords(!showTopChords)}
                    className="text-3xl font-bold text-green-800 mb-2 hover:text-green-900 transition-colors cursor-pointer"
                  >
                    🎵 {result.chord}
                  </button>
                  <p className="text-lg text-green-700">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                  <p className="text-sm text-gray-600 mt-1">Click chord to see alternatives</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Analysis Time</p>
                    <p className="text-lg font-semibold text-gray-800">{result.analysis_time.toFixed(2)}s</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="text-lg font-semibold text-gray-800">{result.model_type}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Time Range</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {activeTab === 'youtube'
                        ? `${youtubeStartTime.toFixed(1)}s - ${youtubeEndTime.toFixed(1)}s`
                        : `${startTime.toFixed(3)}s - ${endTime.toFixed(3)}s`
                      }
                    </p>
                  </div>
                </div>

                {/* Top 5 Alternative Chords */}
                {showTopChords && topChords && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Top 5 Alternative Chords</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      {topChords.map((chordData, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-md text-center transition-colors ${
                            index === 0
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-sm font-medium">{chordData.chord}</div>
                          <div className="text-xs text-gray-500">
                            {(chordData.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chroma Vector Visualization */}
                {result?.chroma_vector && (
                  <div className="mt-4">
                    <div className="grid grid-cols-12 gap-1 max-w-md mx-auto">
                      {result.chroma_vector.map((intensity, index) => {
                        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                        return (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-600 mb-1">{noteNames[index]}</div>
                            <div
                              className="w-full bg-blue-200 rounded-sm"
                              style={{ height: `${Math.max(intensity * 100, 5)}px` }}
                            >
                              <div
                                className="w-full bg-blue-600 rounded-sm transition-all duration-300"
                                style={{ height: `${intensity * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📁 Upload Audio
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('youtube')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'youtube'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🎬 YouTube URL
              </button>
            </div>

            {!audioUrl ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'upload' ? (
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                      Audio File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input
                              ref={fileInputRef}
                              id="file"
                              name="file"
                              type="file"
                              accept="audio/*"
                              className="sr-only"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">WAV, MP3, M4A up to 10MB</p>
                      </div>
                    </div>
                    {file && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
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
                      />
                    </div>

                    {!youtubeAudioUrl ? (
                      <button
                        type="button"
                        onClick={handleYouTubeDownload}
                        disabled={isDownloading || !url}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading Audio...
                          </div>
                        ) : (
                          'Download Audio'
                        )}
                      </button>
                    ) : (
                      <div className="text-sm text-green-600 text-center">
                        ✅ Audio downloaded successfully! Duration: {youtubeDuration.toFixed(1)}s
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'youtube' && youtubeAudioUrl ? (
                  <div className="text-center text-sm text-gray-600">
                    Audio ready! Use the player below to select time ranges and analyze chords.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isAnalyzing || (activeTab === 'upload' && !file) || (activeTab === 'youtube' && !youtubeAudioUrl)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {analysisStatus || 'Processing...'}
                      </div>
                    ) : (
                      'Load Audio'
                    )}
                  </button>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                {/* Audio Player with Integrated Controls */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Audio Player & Time Selection</h3>
                    <button
                      onClick={() => {
                        setAudioUrl(null)
                        setFile(null)
                        setUrl('')
                        setStartTime(0)
                        setEndTime(0)
                        setResult(null)
                        setError(null)
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change Audio
                    </button>
                  </div>

                  <AudioPlayer
                    audioUrl={audioUrl}
                    onTimeRangeChange={handleTimeRangeChange}
                    duration={audioDuration}
                    onDurationChange={setAudioDuration}
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Selected: {startTime.toFixed(3)}s - {endTime.toFixed(3)}s
                      <span className="ml-2 text-gray-500">({(endTime - startTime).toFixed(3)}s duration)</span>
                </div>
                    <button
                      onClick={handleSubmit}
                      disabled={isAnalyzing || endTime <= startTime}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Chords'}
                    </button>
                </div>
                </div>
              </div>
            )}

            {/* Progress Bar for YouTube Analysis */}
            {isAnalyzing && activeTab === 'youtube' && (
              <div className="mt-6 p-4 rounded-md bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-800">{analysisStatus}</p>
                  <p className="text-sm text-blue-600">{Math.round(analysisProgress * 100)}%</p>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  This may take a few moments as we download and analyze the audio...
                </p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </div>


          {/* Old Results - Removed */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-md bg-green-50 border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Analysis Complete!</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Chord:</span> {result?.chord}
                    </p>
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Confidence:</span> {((result?.confidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
                  <div>
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Analysis Time:</span> {(result?.analysis_time || 0).toFixed(2)}s
                    </p>
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Model:</span> {result?.model_type}
                    </p>
                    {result?.source && (
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Source:</span> {result.source}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Chroma Vector Visualization */}
              {result?.chroma_vector && (
                <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Chroma Vector (12-Note Intensity)</h4>
                  <div className="grid grid-cols-12 gap-1">
                    {result.chroma_vector.map((intensity, index) => {
                      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-1">{noteNames[index]}</div>
                          <div
                            className="w-full bg-blue-200 rounded-sm"
                            style={{ height: `${Math.max(intensity * 100, 5)}px` }}
                          >
                            <div
                              className="w-full bg-blue-600 rounded-sm transition-all duration-300"
                              style={{ height: `${intensity * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {intensity.toFixed(2)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">📁</div>
                <h3 className="font-semibold mb-2">1. Upload Audio</h3>
                <p className="text-gray-600">Upload your audio file or paste a YouTube URL</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">⏰</div>
                <h3 className="font-semibold mb-2">2. Set Time Range</h3>
                <p className="text-gray-600">Specify the start and end time for analysis</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🎼</div>
                <h3 className="font-semibold mb-2">3. Get Chord Analysis</h3>
                <p className="text-gray-600">AI analyzes the audio and returns chord symbols</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="font-semibold mb-2">4. View Chroma Vector</h3>
                <p className="text-gray-600">See the 12-note intensity visualization</p>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}