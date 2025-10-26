'use client'

import { useState } from 'react'
import { Star, MapPin, DollarSign, Heart, Users, CheckCircle } from 'lucide-react'

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

interface RestaurantRecommendationsProps {
  restaurants: Restaurant[]
  onVote: (restaurantId: string) => void
}

export default function RestaurantRecommendations({ restaurants, onVote }: RestaurantRecommendationsProps) {
  const [votedRestaurant, setVotedRestaurant] = useState<string | null>(null)

  const handleVote = (restaurantId: string) => {
    if (votedRestaurant) return 
    
    onVote(restaurantId)
    setVotedRestaurant(restaurantId)
  }

  const sortedRestaurants = [...restaurants].sort((a, b) => b.votes - a.votes)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Restaurant Recommendations</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-1" />
          <span>Vote for your favorite</span>
        </div>
      </div>

      <div className="space-y-4">
        {sortedRestaurants.map((restaurant, index) => (
          <div 
            key={restaurant.id} 
            className={`border rounded-lg p-4 transition-all ${
              index === 0 && restaurant.votes > 0 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                  {index === 0 && restaurant.votes > 0 && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{restaurant.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{restaurant.priceRange}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{restaurant.distance}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2">{restaurant.address}</p>
              </div>
              
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  {restaurant.votes}
                </div>
                <button
                  onClick={() => handleVote(restaurant.id)}
                  disabled={votedRestaurant !== null}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    votedRestaurant === restaurant.id
                      ? 'bg-green-100 text-green-700'
                      : votedRestaurant !== null
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  <span>
                    {votedRestaurant === restaurant.id ? 'Voted' : 'Vote'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {votedRestaurant && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">Thanks for voting!</p>
          </div>
          <p className="text-green-700 text-sm mt-1">
            The restaurant with the most votes will be the group's choice.
          </p>
        </div>
      )}
    </div>
  )
}
