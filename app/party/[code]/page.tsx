'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Utensils, DollarSign, MapPin, Users, Send, Heart } from 'lucide-react'
import VibeInput from '@/components/VibeInput'
import VibeList from '@/components/VibeList'
import RestaurantRecommendations from '@/components/RestaurantRecommendations'

interface Vibe {
  id: string
  user: string
  message: string
  budget?: number
  timestamp: Date
}

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

export default function PartyPage() {
  const params = useParams()
  const partyCode = params.code as string
  
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    // Simulate some existing vibes
    setVibes([
      {
        id: '1',
        user: 'Alice',
        message: "I'm feeling like sushi. I got about 30 bucks total to spend",
        budget: 30,
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: '2',
        user: 'Bob',
        message: "I want KBBQ, and I'm not really feeling anything too healthy",
        timestamp: new Date(Date.now() - 1000 * 60 * 3)
      }
    ])
  }, [])

  const handleVibeSubmit = (vibe: Omit<Vibe, 'id' | 'timestamp'>) => {
    const newVibe: Vibe = {
      ...vibe,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setVibes(prev => [...prev, newVibe])
  }

  const analyzeVibes = async () => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/analyze-vibes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vibes: vibes.map(vibe => ({
            user: vibe.user,
            message: vibe.message,
            budget: vibe.budget
          })),
          location: 'San Francisco, CA' // In a real app, this would come from the party data
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      
      // Convert Groq recommendations to our restaurant format
      const restaurants: Restaurant[] = data.recommendations.map((rec: any, index: number) => ({
        id: (index + 1).toString(),
        name: rec.name,
        cuisine: rec.cuisine,
        priceRange: rec.priceRange,
        rating: 4.0 + Math.random() * 1.0, // Mock rating
        distance: `${(Math.random() * 2).toFixed(1)} mi`,
        address: `Mock Address ${index + 1}, San Francisco, CA`,
        votes: 0
      }))
      
      setRestaurants(restaurants)
      setShowRecommendations(true)
    } catch (error) {
      console.error('Error analyzing vibes:', error)
      // Fallback to mock data if API fails
      const mockRestaurants: Restaurant[] = [
        {
          id: '1',
          name: 'Sushi Zen',
          cuisine: 'Japanese',
          priceRange: '$$',
          rating: 4.5,
          distance: '0.3 mi',
          address: '123 Main St, San Francisco, CA',
          votes: 0
        },
        {
          id: '2',
          name: 'Gen Korean BBQ',
          cuisine: 'Korean BBQ',
          priceRange: '$$$',
          rating: 4.2,
          distance: '0.7 mi',
          address: '456 Oak Ave, San Francisco, CA',
          votes: 0
        },
        {
          id: '3',
          name: 'Sushi & KBBQ Fusion',
          cuisine: 'Fusion',
          priceRange: '$$',
          rating: 4.3,
          distance: '0.5 mi',
          address: '789 Pine St, San Francisco, CA',
          votes: 0
        }
      ]
      
      setRestaurants(mockRestaurants)
      setShowRecommendations(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleVote = (restaurantId: string) => {
    setRestaurants(prev => 
      prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, votes: restaurant.votes + 1 }
          : restaurant
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Party: {partyCode}</h1>
              <p className="text-gray-600">Share your dining vibe and find the perfect restaurant together</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{vibes.length} members</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Vibes */}
          <div className="space-y-6">
            {/* Vibe Input */}
            <VibeInput onSubmit={handleVibeSubmit} />
            
            {/* Vibe List */}
            <VibeList vibes={vibes} />
            
            {/* Analyze Button */}
            {vibes.length > 0 && !showRecommendations && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={analyzeVibes}
                  disabled={isAnalyzing}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing vibes...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Heart className="h-4 w-4 mr-2" />
                      Find Restaurants
                    </div>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  We'll analyze everyone's preferences and find nearby restaurants
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Recommendations */}
          <div>
            {showRecommendations ? (
              <RestaurantRecommendations 
                restaurants={restaurants} 
                onVote={handleVote}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                <p className="text-gray-500">
                  Share your vibe and we'll find restaurants that match everyone's preferences
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
