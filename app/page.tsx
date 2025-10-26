'use client'

import { useState, useEffect } from 'react'
import DelayedLink from '@/components/DelayedLinkWithLoading'
import { Utensils } from 'lucide-react'

function TypingEffect() {
  const words = ['perfect', 'scrumptious', 'quintessential', 'ultimate']
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const currentWord = words[currentWordIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1))
        } else {
          // Finished typing, wait then start deleting
          const timeout = setTimeout(() => 
            setIsDeleting(true)
          , 1500)
          clearTimeout(timeout)
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? 50 : 150) // Faster deletion, slower typing

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentWordIndex, words])

  // Separate effect to handle the pause after typing
  useEffect(() => {
    if (!isDeleting && currentText.length === words[currentWordIndex].length) {
      const pauseTimeout = setTimeout(() => {
        setIsDeleting(true)
      }, 2000)

      return () => clearTimeout(pauseTimeout)
    }
  }, [currentText, isDeleting, currentWordIndex, words])

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <em className="inline-block min-w-[280px]">
      {currentText}
      <span className={showCursor ? 'opacity-100' : 'opacity-0'}>|</span>
    </em>
  )
}

export default function LandingPage() {
  return (
    <>
      <style jsx global>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center px-6 py-12"
        style={{
          background: 'linear-gradient(90deg, #fecaca 0%, #fed7aa 30%, #fde68a 60%, #fef3c7 100%)',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 15s ease infinite'
        }}
      >
        <div className="max-w-7xl w-full grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
          {/* Left side - Hero content */}
          <div>
            <div className="flex items-center mb-12">
              <Utensils className="h-12 w-12 text-primary-600 mr-3" />
              <div className="text-4xl font-bold text-gray-900 tracking-tight">ChoppedEats</div>
            </div>

            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-8 text-gray-900">
              Find your group the <TypingEffect /> restaurant in seconds
            </h1>

            <p className="text-xl lg:text-2xl font-normal mb-10 leading-relaxed max-w-2xl text-gray-700">
              Stop the endless debate. Everyone contributes. Everyone shares what they&apos;re feeling, and we&apos;ll show you restaurants that make whole group happy.
            </p>

            <div className="flex items-center gap-4">
              <DelayedLink
                href="/create"
                delay={1000}
                className="inline-block bg-gray-900 text-white font-semibold text-lg px-10 py-5 rounded-full hover:bg-gray-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Start a Group →
              </DelayedLink>
              <div className="text-sm text-gray-700">
                Free • No signup required
              </div>
            </div>
          </div>

          {/* Right side - Phone mockup with floating elements */}
          <div className="hidden lg:flex justify-end items-center">
            <div className="relative">
              {/* Floating card - Top left */}
              <div className="absolute -left-24 top-12 bg-white rounded-2xl shadow-2xl p-5 w-64 z-20 transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Mike</p>
                    <p className="text-xs text-gray-500">Just shared</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  "Craving spicy ramen, budget ~$25"
                </p>
              </div>

              {/* Floating card - Bottom right */}
              <div className="absolute -right-20 bottom-32 bg-white rounded-2xl shadow-2xl p-5 w-72 z-20 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900">Top Match</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">95% match</span>
                </div>
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg flex items-center justify-center text-2xl">
                    🍜
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Ramen House</p>
                    <p className="text-xs text-gray-500">Japanese • $$ • 0.3 mi</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500 text-xs">★★★★★</span>
                      <span className="text-xs text-gray-600">4.8 (234)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating mini map indicator */}
              <div className="absolute -left-16 bottom-24 bg-white rounded-xl shadow-xl p-3 z-20 transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Nearby</p>
                    <p className="text-xs text-gray-500">0.5 mi radius</p>
                  </div>
                </div>
              </div>

              {/* iPhone frame */}
              <div className="relative w-[340px] h-[690px] bg-black rounded-[3rem] p-3 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] z-10">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>

                {/* Screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Actual app interface */}
                  <div className="p-6 bg-white h-full overflow-hidden">
                    {/* Header */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Party: 2TQFKG</h2>
                      <p className="text-sm text-gray-600">Share your dining vibe and find the perfect restaurant together</p>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        <span>👥 0 members</span>
                      </div>
                    </div>

                    {/* Form */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Vibe</h3>

                      {/* Name input */}
                      <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-2">
                          👤 Your Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Rick Owens"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                          readOnly
                          disabled
                        />
                      </div>

                      {/* Vibe textarea */}
                      <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-2">
                          What are you feeling?
                        </label>
                        <div className="relative">
                          <div
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-black resize-none disabled:text-black disabled:opacity-100">
                            "I'm craving sushi and have about $30 to spend"
                          </div>
                        </div>
                      </div>

                      {/* Budget input */}
                      <div className="mb-6">
                        <label className="block text-sm text-gray-700 mb-2">
                          💲 Budget (optional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                          <input
                            type="text"
                            defaultValue="15.00"
                            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm bg-gray-50"
                            readOnly
                            disabled
                          />
                        </div>
                      </div>

                      {/* Share button */}
                      <button
                        className="w-full py-3.5 bg-rose-400 text-white border-none rounded-xl text-base font-semibold flex items-center justify-center gap-2 opacity-75 cursor-default"
                        disabled
                      >
                        <span className="text-xl">✈️</span>
                        Share Vibe
                      </button>

                      {/* Tips */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-xs text-blue-900 leading-relaxed">
                          <strong>Tips:</strong> Be specific about what you&apos;re craving, any dietary restrictions, and your budget. The more details you share, the better our recommendations will be!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}