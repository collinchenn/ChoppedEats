'use client'

import { useState, useRef, useEffect } from 'react'
import { Star, MapPin, DollarSign, X, Heart, RotateCcw, Info } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  cuisine: string
  priceRange: string
  rating: number
  distance: string
  address: string
  image?: string
  votes?: number
  addedBy?: string
}

interface RestaurantSwiperProps {
  restaurants: Restaurant[]
  onLike?: (restaurant: Restaurant) => void
  onDislike?: (restaurant: Restaurant) => void
  onComplete?: (liked: Restaurant[], disliked: Restaurant[]) => void
  hideCompletionScreen?: boolean
}

export default function RestaurantSwiper({ 
  restaurants, 
  onLike, 
  onDislike,
  onComplete,
  hideCompletionScreen = false
}: RestaurantSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [likedRestaurants, setLikedRestaurants] = useState<Restaurant[]>([])
  const [dislikedRestaurants, setDislikedRestaurants] = useState<Restaurant[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [showInfo, setShowInfo] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({})
  const cardRef = useRef<HTMLDivElement>(null)

  const currentRestaurant = restaurants[currentIndex]
  const isComplete = currentIndex >= restaurants.length

  // Fetch restaurant photos
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

  // Preload images for smooth transitions
  useEffect(() => {
    const preloadImages = () => {
      Object.entries(photoUrls).forEach(([restaurantId, url]) => {
        const img = new Image()
        img.onload = () => {
          setImagesLoaded(prev => ({ ...prev, [restaurantId]: true }))
        }
        img.onerror = () => {
          setImagesLoaded(prev => ({ ...prev, [restaurantId]: false }))
        }
        img.src = url
      })
    }
    if (Object.keys(photoUrls).length > 0) {
      preloadImages()
    }
  }, [photoUrls])

  const handleSwipe = (direction: 'left' | 'right', animated: boolean = false) => {
    if (!currentRestaurant) return

    setIsTransitioning(true)

    // Animate the card off screen if triggered by button click
    if (animated) {
      const targetX = direction === 'right' ? 1000 : -1000
      setDragOffset({ x: targetX, y: 0 })
    }

    if (direction === 'right') {
      // Prevent duplicate likes if user rapidly triggers multiple swipes/buttons
      const alreadyLiked = likedRestaurants.some(r => r.id === currentRestaurant.id)
      if (!alreadyLiked) {
        setLikedRestaurants([...likedRestaurants, currentRestaurant])
      }
      onLike?.(currentRestaurant)
    } else {
      const alreadyDisliked = dislikedRestaurants.some(r => r.id === currentRestaurant.id)
      if (!alreadyDisliked) {
        setDislikedRestaurants([...dislikedRestaurants, currentRestaurant])
      }
      onDislike?.(currentRestaurant)
    }

    setTimeout(() => {
      const nextIndex = currentIndex + 1
      
      // Reset everything instantly for the next card
      setDragOffset({ x: 0, y: 0 })
      setIsTransitioning(false)
      setCurrentIndex(nextIndex)
      
      if (nextIndex >= restaurants.length) {
        onComplete?.(
          direction === 'right' ? [...likedRestaurants, currentRestaurant] : likedRestaurants,
          direction === 'left' ? [...dislikedRestaurants, currentRestaurant] : dislikedRestaurants
        )
      }
    }, 300)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const offsetX = e.clientX - startPos.x
    const offsetY = e.clientY - startPos.y
    setDragOffset({ x: offsetX, y: offsetY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const offsetX = e.touches[0].clientX - startPos.x
    const offsetY = e.touches[0].clientY - startPos.y
    setDragOffset({ x: offsetX, y: offsetY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    
    // Swipe threshold
    if (Math.abs(dragOffset.x) > 100) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left')
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    // Swipe threshold
    if (Math.abs(dragOffset.x) > 100) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left')
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const handleUndo = () => {
    if (currentIndex === 0) return
    
    const prevIndex = currentIndex - 1
    const wasLiked = likedRestaurants[likedRestaurants.length - 1]?.id === restaurants[prevIndex].id
    
    if (wasLiked) {
      setLikedRestaurants(likedRestaurants.slice(0, -1))
    } else {
      setDislikedRestaurants(dislikedRestaurants.slice(0, -1))
    }
    
    setCurrentIndex(prevIndex)
    setDragOffset({ x: 0, y: 0 })
    setIsTransitioning(false)
  }

  const rotation = isDragging ? dragOffset.x / 20 : 0
  const opacity = isDragging ? Math.max(0.5, 1 - Math.abs(dragOffset.x) / 500) : 1

  if (isComplete && !hideCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
            <p className="text-gray-600">
              You've reviewed all {restaurants.length} restaurants
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <Heart className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{likedRestaurants.length}</div>
              <div className="text-sm text-gray-600">Liked</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <X className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{dislikedRestaurants.length}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
          </div>

          {likedRestaurants.length > 0 && (
            <div className="text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Favorites:</h3>
              <div className="space-y-2">
                {likedRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    {photoUrls[restaurant.id] ? (
                      <img 
                        src={photoUrls[restaurant.id]} 
                        alt={restaurant.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.cuisine}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setCurrentIndex(0)
              setLikedRestaurants([])
              setDislikedRestaurants([])
              setDragOffset({ x: 0, y: 0 })
              setIsTransitioning(false)
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  // If completion screen is hidden but swiping is complete, show loading
  if (isComplete && hideCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h2>
          <p className="text-gray-600">Please wait while we process your votes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Swipe</h1>
        <p className="text-gray-600">
          {currentIndex + 1} / {restaurants.length}
        </p>
        {Object.keys(photoUrls).length < restaurants.length && (
          <div className="mt-2 text-sm text-gray-500">
            Loading images... ({Object.keys(photoUrls).length}/{restaurants.length})
          </div>
        )}
      </div>

      {/* Card Stack */}
      <div className="relative w-full max-w-md" style={{ height: '600px' }}>
        {/* Next card preview */}
        {restaurants[currentIndex + 1] && (
          <div 
            className="absolute inset-x-0 mx-auto w-full bg-white rounded-2xl shadow-lg"
            style={{ 
              top: '20px',
              transform: 'scale(0.95)',
              zIndex: 1,
              opacity: 0.5
            }}
          >
            <div className="h-96 bg-gray-100 rounded-t-2xl" />
          </div>
        )}

        {/* Current card */}
        {currentRestaurant && (
          <div
            ref={cardRef}
            className="absolute inset-0 mx-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
              transition: (isDragging || isTransitioning) ? (isDragging ? 'none' : 'all 0.3s ease-out') : 'none',
              opacity,
              zIndex: 2,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Restaurant Image */}
            <div className="relative h-96">
              {photoUrls[currentRestaurant.id] && imagesLoaded[currentRestaurant.id] ? (
                <img
                  src={photoUrls[currentRestaurant.id]}
                  alt={currentRestaurant.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-gray-400 text-lg">
                    {photoUrls[currentRestaurant.id] ? 'Loading image...' : 'No image available'}
                  </div>
                </div>
              )}

              {/* Color overlay for swipe direction */}
              {(isDragging || dragOffset.x !== 0) && (
                <>
                  {/* Red overlay for left swipe */}
                  <div 
                    className="absolute inset-0 bg-red-500 pointer-events-none"
                    style={{ 
                      opacity: Math.max(0, Math.min(0.5, -dragOffset.x / 200)),
                      transition: isDragging ? 'none' : 'opacity 0.3s ease-out'
                    }}
                  />
                  {/* Green overlay for right swipe */}
                  <div 
                    className="absolute inset-0 bg-green-500 pointer-events-none"
                    style={{ 
                      opacity: Math.max(0, Math.min(0.5, dragOffset.x / 200)),
                      transition: isDragging ? 'none' : 'opacity 0.3s ease-out'
                    }}
                  />
                </>
              )}

              {/* Swipe indicators */}
              {(isDragging || dragOffset.x !== 0) && (
                <>
                  <div 
                    className="absolute top-8 left-8 border-4 border-red-500 text-red-500 font-bold text-3xl px-6 py-3 rounded-lg rotate-[-30deg] bg-white"
                    style={{ opacity: Math.max(0, -dragOffset.x / 100) }}
                  >
                    NOPE
                  </div>
                  <div 
                    className="absolute top-8 right-8 border-4 border-green-500 text-green-500 font-bold text-3xl px-6 py-3 rounded-lg rotate-[30deg] bg-white"
                    style={{ opacity: Math.max(0, dragOffset.x / 100) }}
                  >
                    LIKE
                  </div>
                </>
              )}
            </div>

            {/* Restaurant Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentRestaurant.name}
                    </h2>
                    {currentRestaurant.addedBy === 'AI' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                        🤖 AI Suggested
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg">{currentRestaurant.cuisine}</p>
                </div>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Info className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-1 fill-current" />
                  <span className="text-gray-700 font-medium">{currentRestaurant.rating}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700">{currentRestaurant.priceRange}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-gray-700">{currentRestaurant.distance}</span>
                </div>
              </div>

              {showInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {currentRestaurant.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-6 mt-8">
        <button
          onClick={() => handleSwipe('left', true)}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <X className="h-8 w-8 text-red-500" />
        </button>

        <button
          onClick={handleUndo}
          disabled={currentIndex === 0}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <RotateCcw className="h-6 w-6 text-gray-500" />
        </button>

        <button
          onClick={() => handleSwipe('right', true)}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <Heart className="h-8 w-8 text-green-500 fill-current" />
        </button>
      </div>

      {/* Swipe instruction */}
      <p className="mt-6 text-sm text-gray-500 text-center">
        Swipe right to like • Swipe left to pass
      </p>
    </div>
  )
}

