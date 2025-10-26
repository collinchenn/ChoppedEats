'use client'

import { useEffect, useState } from 'react'

export default function LoadingOverlay() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) {
          clearInterval(timer)
          return 90
        }
        const diff = Math.random() * 15
        return Math.min(oldProgress + diff, 90)
      })
    }, 200)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-red-200 via-orange-200 via-yellow-200 to-yellow-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-6">
          {/* Animated food icon */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center text-4xl animate-bounce">
              🍽️
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
          
          {/* Loading text */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Joining Party...</h3>
            <p className="text-gray-600">Getting your group ready</p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">{Math.round(progress)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}