'use client'

import { useState } from 'react'

interface PianoKeyboardProps {
  chromaVector: number[]
  className?: string
}

export function PianoKeyboard({ chromaVector, className = "" }: PianoKeyboardProps) {
  const [hoveredKey, setHoveredKey] = useState<number | null>(null)

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const isBlackKey = [false, true, false, true, false, false, true, false, true, false, true, false]

  // Normalize chroma vector to 0-1 range for better visualization
  const normalizedChroma = chromaVector.map(val => Math.min(val, 1))

  return (
    <div className={`${className}`}>
      <div className="flex justify-center mb-4">
        <div className="flex max-w-md">
          {noteNames.map((note, index) => {
            const intensity = normalizedChroma[index]
            const isHovered = hoveredKey === index
            const isBlack = isBlackKey[index]

            return (
              <div
                key={index}
                className="relative flex-1"
                onMouseEnter={() => setHoveredKey(index)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <div
                  className={`
                    w-full border border-gray-300 rounded-b-md flex flex-col justify-end
                    transition-all duration-200 cursor-pointer relative
                    ${isHovered ? 'shadow-lg scale-105' : 'hover:shadow-md'}
                    ${isBlack ? 'h-12 bg-gray-800 z-10' : 'h-20 bg-white'}
                  `}
                >
                  {/* Intensity visualization - same as chroma vector */}
                  <div className="w-full flex flex-col justify-end h-full">
                    {/* Light blue base (like chroma vector) */}
                    <div
                      className="w-full bg-blue-200"
                      style={{ height: '4px' }}
                    />
                    {/* Dark blue intensity (like chroma vector) */}
                    <div
                      className="w-full bg-blue-600 rounded-b-md transition-all duration-300"
                      style={{ height: `${Math.max(intensity * 100, 4)}px` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
