'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Utensils, DollarSign, MapPin, Users, Send, Heart, Trophy, Vote, ListPlus } from 'lucide-react'
import VibeInput from '@/components/VibeInput'
import { ensureSignedInAnonymously, getFirebaseServices } from '@/lib/firebase-client'
import VibeList from '@/components/VibeList'
import RestaurantRecommendations from '@/components/RestaurantRecommendations'
import WinnerDisplay from '@/components/WinnerDisplay'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'

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
  const [latestMatches, setLatestMatches] = useState<Restaurant[] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [ownerUid, setOwnerUid] = useState<string | null>(null)
  const [currentUid, setCurrentUid] = useState<string | null>(null)

  // Load party data when component mounts
  useEffect(() => {
    ensureSignedInAnonymously().then(async () => {
      const { auth } = getFirebaseServices()
      setCurrentUid(auth.currentUser?.uid || null)
      loadPartyData()
    })
    setupRealtimeUpdates()
    
    return () => {
      // Cleanup event source when component unmounts
      if (typeof window !== 'undefined') {
        const eventSource = (window as any).partyEventSource
        if (eventSource) {
          eventSource.close()
        }
      }
    }
  }, [partyCode])

  const setupRealtimeUpdates = () => {
    if (typeof window === 'undefined') return
    const { auth, db } = getFirebaseServices()
    const uid = auth.currentUser?.uid || null
    const unsubs: Array<() => void> = []
    ;(window as any).partyUnsubs = unsubs

    // Owner UID subscription
    const partyRef = doc(db, 'parties', partyCode)
    unsubs.push(onSnapshot(partyRef, (snap) => {
      const data: any = snap.data()
      setOwnerUid(data?.ownerUid || null)
    }))

    // Restaurants pool subscription
    const restaurantsCol = collection(db, 'parties', partyCode, 'restaurants')
    unsubs.push(onSnapshot(restaurantsCol, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Restaurant[]
      setRestaurants(arr)
      if (arr.length > 0) setShowRecommendations(true)
    }))

    // Vibes and matches for latest own vibe
    let matchesUnsub: null | (() => void) = null
    const vibesCol = collection(db, 'parties', partyCode, 'vibes')
    const vibesQ = query(vibesCol, orderBy('timestamp', 'asc'))
    unsubs.push(onSnapshot(vibesQ, (snap) => {
      const list = snap.docs.map(d => {
        const v: any = d.data()
        return { ...v, timestamp: new Date(v.timestamp) }
      }) as Vibe[]
      setVibes(list)
      if (uid) {
        const own = (list as any[]).filter(v => (v as any).userId === uid)
        const latest = own[own.length - 1]
        const latestId = (latest as any)?.id
        if (latestId) {
          if (matchesUnsub) {
            try { matchesUnsub() } catch {}
          }
          const matchesCol = collection(db, 'parties', partyCode, 'vibes', latestId, 'matches')
          matchesUnsub = onSnapshot(matchesCol, (msnap) => {
            const matches = msnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Restaurant[]
            setLatestMatches(matches)
            setShowRecommendations(true)
          })
        }
      }
    }))

    if (matchesUnsub) {
      unsubs.push(() => { try { matchesUnsub && matchesUnsub() } catch {} })
    }
  }

  const loadPartyData = async () => {
    try {
      const response = await fetch(`/api/parties/${partyCode}`)
      if (response.ok) {
        const data = await response.json()
        
        // Convert string timestamps to Date objects
        const vibesWithDates = (data.vibes || []).map((vibe: any) => ({
          ...vibe,
          timestamp: new Date(vibe.timestamp)
        }))
        
        setVibes(vibesWithDates)
        setRestaurants(data.restaurants || [])
        setShowRecommendations(data.restaurants && data.restaurants.length > 0)
        setOwnerUid(data.party?.ownerUid || null)
      }
    } catch (error) {
      console.error('Error loading party data:', error)
    }
  }

  const handleVibeSubmit = async (vibe: Omit<Vibe, 'id' | 'timestamp'>) => {
    try {
      const { auth } = getFirebaseServices()
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch(`/api/parties/${partyCode}/vibes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(vibe),
      })

      if (!response.ok) {
        console.error('Failed to save vibe')
      }
      // Don't manually add to state - the EventSource will handle it via broadcast
    } catch (error) {
      console.error('Error saving vibe:', error)
    }
  }
  
  const analyzeVibes = async () => {
    if (vibes.length === 0) {
      console.error('No vibes to analyze')
      return
    }

    setIsAnalyzing(true)
    try {
      // Get party location with error handling
      const partyResponse = await fetch(`/api/parties?code=${partyCode}`)
      if (!partyResponse.ok) {
        throw new Error('Failed to fetch party details')
      }
      const partyData = await partyResponse.json()
      const location = partyData.party?.location || 'San Francisco, CA'

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
          location
        }),
      })

      console.log('Analyze vibes response received 0')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze vibes')
      }
      console.log('Analyze vibes response received')
      const data = await response.json()
      
      // Validate response
      if (!data.recommendations || !Array.isArray(data.recommendations)) {
        throw new Error('Invalid response format from server')
      }

      // Convert Groq recommendations to our restaurant format
      const restaurants: Restaurant[] = data.recommendations.map((rec: any, index: number) => ({
        id: (index + 1).toString(),
        name: rec.name,
        cuisine: rec.cuisine,
        description: rec.description,
        priceRange: rec.priceRange,
        rating: rec.yelpRating,
        address: rec.address,
        why: rec.why,
        votes: 0
      }))
      
      setRestaurants(restaurants)
      setShowRecommendations(true)
      
      // Save restaurants to server
      await fetch(`/api/parties/${partyCode}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurants }),
      })
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

  const handleVote = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/parties/${partyCode}/restaurants/${restaurantId}/vote`, {
        method: 'POST',
      })

      if (response.ok) {
        setRestaurants(prev => 
          prev.map(restaurant => 
            restaurant.id === restaurantId 
              ? { ...restaurant, votes: restaurant.votes + 1 }
              : restaurant
          )
        )
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const addToVoting = async (restaurant: Restaurant) => {
    try {
      await fetch(`/api/parties/${partyCode}/voting/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant })
      })
    } catch (e) {
      console.error('Error adding to voting:', e)
    }
  }

  const enterVoting = async () => {
    try {
      const { auth } = getFirebaseServices()
      const token = await auth.currentUser?.getIdToken()
      await fetch(`/api/parties/${partyCode}/voting/select`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      // optimistic navigate shortly after
      setTimeout(() => {
        window.location.href = `/party/${partyCode}/voting`
      }, 200)
    } catch (e) {
      console.error('Error entering voting:', e)
    }
  }

  const handleProceed = () => {
    // Find restaurant with most votes
    if (restaurants.length === 0) return
    
    const winner = restaurants.reduce((prev, current) => 
      current.votes > prev.votes ? current : prev
    )
    
    // Only proceed if there's at least one vote
    if (winner.votes > 0) {
      setShowWinner(true)
    }
  }

  // Show winner display if proceed was clicked
  if (showWinner && restaurants.length > 0) {
    const winner = restaurants.reduce((prev, current) => 
      current.votes > prev.votes ? current : prev
    )
    return <WinnerDisplay restaurant={winner} onBack={() => setShowWinner(false)} />
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
          {/* Left Column - Vibes + All Recommendations */}
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

            {/* All Recommended (accumulated) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">All recommended</h3>
              {restaurants.length === 0 ? (
                <p className="text-sm text-gray-500">No recommendations yet</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {restaurants.map(r => (
                    <li key={r.id}>{r.name} — {r.address}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column - Recommendations */}
          <div>
            {showRecommendations ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {latestMatches ? 'Latest vibe matches' : 'All recommendations'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => (window.location.href = `/party/${partyCode}/voting`)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      View voting
                    </button>
                    {ownerUid && currentUid === ownerUid && (
                      <button
                        onClick={enterVoting}
                        className="btn-primary px-4 py-2"
                      >
                        Enter voting
                      </button>
                    )}
                  </div>
                </div>
                <RestaurantRecommendations 
                  restaurants={latestMatches && latestMatches.length > 0 ? latestMatches : restaurants} 
                  onVote={handleVote}
                  onAddToVoting={addToVoting}
                  mode={latestMatches && latestMatches.length > 0 ? 'matches' : 'all'}
                />
                
                {/* Proceed Button */}
                {restaurants.some(r => r.votes > 0) && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <button
                      onClick={handleProceed}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Proceed with Winner
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Click to reveal the restaurant with the most votes!
                    </p>
                  </div>
                )}
              </div>
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