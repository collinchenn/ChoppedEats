'use client'

import { useEffect, useState } from 'react'
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
  onAddToVoting?: (restaurant: Restaurant) => void
  mode?: 'matches' | 'all'
}

export default function RestaurantRecommendations({ restaurants, onVote, onAddToVoting, mode = 'all' }: RestaurantRecommendationsProps) {
  const [votedRestaurant, setVotedRestaurant] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [addedToVoting, setAddedToVoting] = useState<Set<string>>(new Set())

  const handleVote = (restaurantId: string) => {
    if (votedRestaurant) return 
    
    onVote(restaurantId)
    setVotedRestaurant(restaurantId)
  }

  const handleAddToVoting = (restaurant: Restaurant) => {
    if (onAddToVoting) {
      onAddToVoting(restaurant)
      setAddedToVoting(prev => new Set(Array.from(prev).concat(restaurant.id)))
    }
  }

  const sortedRestaurants = [...restaurants].sort((a, b) => b.votes - a.votes)

  useEffect(() => {
    const fetchPhotos = async () => {
      const updates: Record<string, string> = {}
      await Promise.all(
        restaurants.map(async (restaurant) => {
          if (photoUrls[restaurant.id]) return
          try {
            const res = await fetch('/api/restaurants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `${restaurant.name} ${restaurant.address || ''}`.trim() })
            })
            if (!res.ok) return
            const data: any = await res.json()
            const place = data.results?.[0]
            const photoName = place?.photos?.[0]?.name
            const placeId = place?.id
            if (photoName && placeId) {
              updates[restaurant.id] = `/api/photo?placeId=${encodeURIComponent(placeId)}&photoName=${encodeURIComponent(photoName)}`
            }
          } catch (e) {
            // ignore per-restaurant photo failures
          }
        })
      )
      if (Object.keys(updates).length > 0) {
        setPhotoUrls((prev) => ({ ...prev, ...updates }))
      }
    }
    if (restaurants.length > 0) {
      fetchPhotos()
    }
  }, [restaurants])

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
              <div className="flex-1 flex">
                {photoUrls[restaurant.id] ? (
                  <img
                    src={photoUrls[restaurant.id]}
                    alt={restaurant.name}
                    className="w-20 h-20 rounded object-cover mr-4"
                  />
                ) : (
                  <div className="w-20 h-20 rounded bg-gray-100 mr-4" />
                )}
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
              </div>
              
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  {restaurant.votes}
                </div>
                <div className="flex items-center justify-end space-x-2">
                  {onAddToVoting && (
                    <button
                      onClick={() => handleAddToVoting(restaurant)}
                      disabled={addedToVoting.has(restaurant.id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        addedToVoting.has(restaurant.id)
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {addedToVoting.has(restaurant.id) && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>
                        {addedToVoting.has(restaurant.id) ? 'Added to voting' : 'Add to voting'}
                      </span>
                    </button>
                  )}
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
