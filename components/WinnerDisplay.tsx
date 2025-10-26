'use client'

import { useEffect } from 'react'
import { Trophy, Star, MapPin, DollarSign, ExternalLink, Navigation } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Restaurant {
  id: string
  name: string
  cuisine: string
  priceRange: string
  rating: number
  distance: string
  address: string
  image?: string
  votes: number
}

interface WinnerDisplayProps {
  restaurant: Restaurant
  onBack: () => void
}

export default function WinnerDisplay({ restaurant, onBack }: WinnerDisplayProps) {
  useEffect(() => {
    // Fire confetti when component mounts
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Trophy Header */}
        <div className="text-center mb-8 animate-bounce">
          <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 We Have a Winner! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Your group has chosen their destination
          </p>
        </div>

        {/* Winner Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-yellow-400">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {restaurant.name}
            </h2>
            <p className="text-xl text-gray-600">{restaurant.cuisine}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{restaurant.rating}</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{restaurant.priceRange}</div>
              <div className="text-sm text-gray-600">Price</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{restaurant.distance}</div>
              <div className="text-sm text-gray-600">Away</div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Address</p>
                <p className="text-gray-700">{restaurant.address}</p>
              </div>
            </div>
          </div>

          {/* Votes Display */}
          <div className="mb-6 text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{restaurant.votes}</div>
            <div className="text-sm text-purple-700">
              {restaurant.votes === 1 ? 'Vote' : 'Votes'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center group"
            >
              <Navigation className="h-5 w-5 mr-2 group-hover:rotate-45 transition-transform" />
              Get Directions
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>

            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Party
            </button>
          </div>
        </div>

        {/* Fun Message */}
        <div className="text-center mt-6">
          <p className="text-gray-600 italic">
            Time to eat! 🍽️ Enjoy your meal together! 
          </p>
        </div>
      </div>
    </div>
  )
}

