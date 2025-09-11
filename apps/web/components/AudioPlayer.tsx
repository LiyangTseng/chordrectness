'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioUrl?: string
  onTimeRangeChange: (startTime: number, endTime: number) => void
  duration?: number
  onDurationChange?: (duration: number) => void
  className?: string
}

export function AudioPlayer({
  audioUrl,
  onTimeRangeChange,
  duration = 0,
  onDurationChange,
  className = ""
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(duration)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      const updateTime = () => {
        setCurrentTime(audio.currentTime)
        // Auto-pause when reaching end time
        if (audio.currentTime >= endTime) {
          audio.pause()
          setIsPlaying(false)
        }
      }
      const updateDuration = () => {
        setAudioDuration(audio.duration)
        // Set a default 0.5-second range in the middle of the audio
        const defaultStart = Math.max(0, audio.duration / 2 - 0.25)
        const defaultEnd = Math.min(audio.duration, audio.duration / 2 + 0.25)
        setStartTime(defaultStart)
        setEndTime(defaultEnd)
        onTimeRangeChange(defaultStart, defaultEnd)
        onDurationChange?.(audio.duration)
      }

      audio.addEventListener('timeupdate', updateTime)
      audio.addEventListener('loadedmetadata', updateDuration)
      audio.addEventListener('ended', () => setIsPlaying(false))

      return () => {
        audio.removeEventListener('timeupdate', updateTime)
        audio.removeEventListener('loadedmetadata', updateDuration)
        audio.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [startTime, endTime, onTimeRangeChange])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        // Set audio to start time and play
        audioRef.current.currentTime = startTime
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && audioDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      const newTime = percentage * audioDuration

      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleRangeChange = (type: 'start' | 'end', value: number) => {
    if (type === 'start') {
      setStartTime(Math.min(value, endTime - 0.01))
    } else {
      setEndTime(Math.max(value, startTime + 0.01))
    }
  }

  useEffect(() => {
    onTimeRangeChange(startTime, endTime)
  }, [startTime, endTime, onTimeRangeChange])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || audioDuration === 0) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickTime = (clickX / rect.width) * audioDuration

    // If click is closer to start handle, move start
    // If click is closer to end handle, move end
    const startDistance = Math.abs(clickTime - startTime)
    const endDistance = Math.abs(clickTime - endTime)

    if (startDistance < endDistance) {
      const newStart = Math.max(0, Math.min(clickTime, endTime - 0.01))
      setStartTime(newStart)
    } else {
      const newEnd = Math.min(audioDuration, Math.max(clickTime, startTime + 0.01))
      setEndTime(newEnd)
    }
  }

  const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(type)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current || audioDuration === 0) return

      const rect = timelineRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseTime = Math.max(0, Math.min(audioDuration, (mouseX / rect.width) * audioDuration))

      if (isDragging === 'start') {
        const newStart = Math.max(0, Math.min(mouseTime, endTime - 0.01))
        setStartTime(newStart)
      } else if (isDragging === 'end') {
        const newEnd = Math.min(audioDuration, Math.max(mouseTime, startTime + 0.01))
        setEndTime(newEnd)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, audioDuration, startTime, endTime])

  const startPercentage = (startTime / audioDuration) * 100
  const endPercentage = (endTime / audioDuration) * 100
  const currentPercentage = (currentTime / audioDuration) * 100

  return (
    <div className={`${className}`}>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          className="hidden"
        />
      )}

      {/* Audio Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex flex-col items-center">
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <span className="text-xs text-gray-500 mt-1">Play Range</span>
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">
          Select Analysis Range: {formatTime(startTime)} - {formatTime(endTime)}
        </div>

        {/* Visual Timeline */}
        <div className="relative">
          <div
            ref={timelineRef}
            className="w-full h-8 bg-gray-200 rounded-lg cursor-pointer relative"
            onClick={handleTimelineClick}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gray-200 rounded-lg" />

            {/* Selected Range */}
            <div
              className="absolute top-0 h-full bg-blue-500 rounded-lg"
              style={{
                left: `${startPercentage}%`,
                width: `${endPercentage - startPercentage}%`
              }}
            />

            {/* Current Time Indicator */}
            <div
              className="absolute top-0 w-1 h-full bg-red-500 rounded-full"
              style={{ left: `${currentPercentage}%` }}
            />

            {/* Start Time Handle */}
            <div
              className="absolute top-0 w-4 h-full bg-blue-700 rounded-l-lg cursor-ew-resize flex items-center justify-center"
              style={{ left: `${startPercentage}%` }}
              onMouseDown={handleMouseDown('start')}
            >
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>

            {/* End Time Handle */}
            <div
              className="absolute top-0 w-4 h-full bg-blue-700 rounded-r-lg cursor-ew-resize flex items-center justify-center"
              style={{ left: `${endPercentage - 1.6}%` }}
              onMouseDown={handleMouseDown('end')}
            >
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
