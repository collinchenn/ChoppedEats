'use client'

import RestaurantSwiper from '@/components/RestaurantSwiper'

// Mock restaurant data for testing
const mockRestaurants = [
  {
    id: '1',
    name: 'The Golden Spoon',
    cuisine: 'Fine Dining • American',
    priceRange: '$$$$',
    rating: 4.5,
    distance: '0.8 mi',
    address: '123 Main St, Downtown',
    votes: 0
  },
  {
    id: '2',
    name: 'Pizza Paradise',
    cuisine: 'Italian • Pizza',
    priceRange: '$$',
    rating: 4.8,
    distance: '1.2 mi',
    address: '456 Oak Ave',
    votes: 0
  },
  {
    id: '3',
    name: 'Sushi Sensation',
    cuisine: 'Japanese • Sushi Bar',
    priceRange: '$$$',
    rating: 4.6,
    distance: '2.3 mi',
    address: '789 Pine St',
    votes: 0
  },
  {
    id: '4',
    name: 'Burger Barn',
    cuisine: 'American • Burgers',
    priceRange: '$',
    rating: 4.2,
    distance: '1.5 mi',
    address: '321 Elm St',
    votes: 0
  },
  {
    id: '5',
    name: 'Thai Terrace',
    cuisine: 'Thai • Asian Fusion',
    priceRange: '$$',
    rating: 4.7,
    distance: '3.1 mi',
    address: '555 Market St',
    votes: 0
  },
  {
    id: '6',
    name: 'Mediterranean Magic',
    cuisine: 'Mediterranean • Greek',
    priceRange: '$$$',
    rating: 4.4,
    distance: '1.8 mi',
    address: '777 Beach Blvd',
    votes: 0
  },
  {
    id: '7',
    name: 'Taco Temple',
    cuisine: 'Mexican • Street Food',
    priceRange: '$',
    rating: 4.9,
    distance: '0.5 mi',
    address: '888 Mission St',
    votes: 0
  },
  {
    id: '8',
    name: 'Steakhouse Supreme',
    cuisine: 'Steakhouse • Grill',
    priceRange: '$$$$',
    rating: 4.3,
    distance: '2.7 mi',
    address: '999 Broadway',
    votes: 0
  },
]

export default function SwipeTestPage() {
  const handleLike = (restaurant: any) => {
    console.log('Liked:', restaurant.name)
  }

  const handleDislike = (restaurant: any) => {
    console.log('Disliked:', restaurant.name)
  }

  const handleComplete = (liked: any[], disliked: any[]) => {
    console.log('Completed!')
    console.log('Liked restaurants:', liked)
    console.log('Disliked restaurants:', disliked)
  }

  return (
    <div>
      <RestaurantSwiper
        restaurants={mockRestaurants}
        onLike={handleLike}
        onDislike={handleDislike}
        onComplete={handleComplete}
      />
    </div>
  )
}

