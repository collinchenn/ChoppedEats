'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Utensils, DollarSign, MapPin, Users, Send, Heart, Trophy, Vote, ListPlus } from 'lucide-react'
import VibeInput from '@/components/VibeInput'
import { ensureSignedInAnonymously, getFirebaseServices } from '@/lib/firebase-client'
import VibeList from '@/components/VibeList'
import RestaurantRecommendations from '@/components/RestaurantRecommendations'
import WinnerDisplay from '@/components/WinnerDisplay'
import NameEntryModal from '@/components/NameEntryModal'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'

interface Vibe {
  id: string
  user: string
  message: string
  budget?: number
  timestamp: Date
  userId?: string
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
  const [ownerSessionId, setOwnerSessionId] = useState<string | null>(null)
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string>('')

  // Load party data when component mounts
  useEffect(() => {
    // Check if user has a name for this session
    const sessionKey = `cardivor-user-name-${partyCode}`
    const savedName = sessionStorage.getItem(sessionKey)
    
    // Ensure we have a per-party session user id
    const idKey = `cardivor-user-id-${partyCode}`
    let uid = sessionStorage.getItem(idKey)
    if (!uid) {
      try {
        uid = (self.crypto?.randomUUID && self.crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      } catch {
        uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }
      sessionStorage.setItem(idKey, uid)
    }
    setSessionUserId(uid!)
    
    // Setup party-level subscriptions immediately (for votingStarted redirect)
    setupPartySubscriptions(uid!)
    
    if (savedName) {
      setUserName(savedName)
      setupRealtimeUpdates(uid!)
    } else {
      // Show name entry modal
      setShowNameModal(true)
    }
    
    return () => {
      // Cleanup Firestore subscriptions
      if (typeof window !== 'undefined') {
        const unsubs: Array<() => void> | undefined = (window as any).partyUnsubs
        if (Array.isArray(unsubs)) {
          unsubs.forEach(u => { try { u() } catch {} })
        }
        ;(window as any).partyUnsubs = undefined
      }
    }
  }, [partyCode])

  const handleNameSubmit = (name: string) => {
    setUserName(name)
    setShowNameModal(false)
    
    // Save name for this session
    const sessionKey = `cardivor-user-name-${partyCode}`
    sessionStorage.setItem(sessionKey, name)
    
    // Now setup realtime updates
    const idKey = `cardivor-user-id-${partyCode}`
    const uid = sessionStorage.getItem(idKey) || sessionUserId
    setupRealtimeUpdates(uid)
  }

  const setupPartySubscriptions = (currentUserId: string) => {
    if (typeof window === 'undefined') return
    const { db } = getFirebaseServices()
    console.log('🚀 Setting up party-level subscriptions')
    
    // Initialize unsubs array if it doesn't exist
    if (!(window as any).partyUnsubs) {
      ;(window as any).partyUnsubs = []
    }
    const unsubs: Array<() => void> = (window as any).partyUnsubs

    // Owner + votingStarted subscription
    const partyRef = doc(db, 'parties', partyCode)
    unsubs.push(onSnapshot(partyRef, (snap) => {
      const data: any = snap.data()
      setOwnerUid(data?.ownerUid || null)
      setOwnerSessionId(data?.ownerSessionId || null)
      if (data?.votingStarted) {
        // redirect everyone to voting
        if (window.location.pathname.indexOf('/voting') === -1) {
          window.location.href = `/party/${partyCode}/voting`
        }
      }
    }))
  }

  const setupRealtimeUpdates = (currentUserId: string) => {
    if (typeof window === 'undefined') return
    const { db } = getFirebaseServices()
    console.log('🚀 Setting up realtime updates')
    
    // Use existing unsubs array from party subscriptions
    const unsubs: Array<() => void> = (window as any).partyUnsubs || []

    // Restaurants pool subscription
    const restaurantsCol = collection(db, 'parties', partyCode, 'restaurants')
    unsubs.push(onSnapshot(restaurantsCol, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Restaurant[]
      setRestaurants(arr)
    }))

    // Vibes and matches for latest vibe by THIS user (pool remains shared)
    let matchesUnsub: null | (() => void) = null
    const vibesCol = collection(db, 'parties', partyCode, 'vibes')
    const vibesQ = query(vibesCol, orderBy('timestamp', 'asc'))
    unsubs.push(onSnapshot(vibesQ, (snap) => {
      const list = snap.docs.map(d => {
        const v: any = d.data()
        return { ...v, timestamp: new Date(v.timestamp) }
      }) as Vibe[]
      console.log('🔥 Vibes updated:', list.length, 'vibes')
      setVibes(list)
      
      // Get the latest vibe authored by this session user
      const latest = list.filter(v => (v as any).userId === currentUserId).slice(-1)[0]
      const latestId = latest?.id
      console.log('📝 Latest vibe ID:', latestId)
      if (latestId) {
        if (matchesUnsub) {
          try { matchesUnsub() } catch {}
        }
        const matchesCol = collection(db, 'parties', partyCode, 'vibes', latestId, 'matches')
        console.log('🎯 Setting up matches listener for vibe:', latestId)
        matchesUnsub = onSnapshot(matchesCol, (msnap) => {
          const matches = msnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Restaurant[]
          console.log('🍽️ Matches received:', matches.length, 'restaurants')
          console.log('🍽️ Match data:', matches)
          setLatestMatches(matches)
          setShowRecommendations(true)
        })
        // Add the matches unsubscribe to the cleanup array
        unsubs.push(() => { try { matchesUnsub && matchesUnsub() } catch {} })
      } else {
        setLatestMatches(null)
        setShowRecommendations(false)
      }
    }))
  }

  const handleVibeSubmit = async (vibe: Omit<Vibe, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch(`/api/parties/${partyCode}/vibes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...vibe, userId: sessionUserId }),
      })

      if (!response.ok) {
        console.error('Failed to save vibe')
      }
      // State updates come from Firestore listeners
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
        body: JSON.stringify({ restaurant, addedBy: userName })
      })
    } catch (e) {
      console.error('Error adding to voting:', e)
    }
  }

  const removeFromVoting = async (restaurantId: string) => {
    try {
      await fetch(`/api/parties/${partyCode}/voting/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId })
      })
    } catch (e) {
      console.error('Error removing from voting:', e)
    }
  }

  const enterVoting = async () => {
    try {
      const { auth } = getFirebaseServices()
      const token = await auth.currentUser?.getIdToken()
      await fetch(`/api/parties/${partyCode}/voting/select`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ ownerSessionId: sessionUserId })})
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
      {/* Name Entry Modal */}
      <NameEntryModal 
        isOpen={showNameModal} 
        onClose={handleNameSubmit} 
      />
      
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
            {userName && <VibeInput onSubmit={handleVibeSubmit} userName={userName} />}
            
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
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Your vibe matches
                  </div>
                  {(ownerUid || ownerSessionId) && (ownerUid ? true : (ownerSessionId === sessionUserId)) && (
                    <button
                      onClick={enterVoting}
                      className="btn-primary px-4 py-2"
                    >
                      Enter voting
                    </button>
                  )}
                </div>
                {latestMatches && latestMatches.length > 0 ? (
                  <RestaurantRecommendations 
                    restaurants={latestMatches} 
                    onVote={handleVote}
                    onAddToVoting={addToVoting}
                    onRemoveFromVoting={removeFromVoting}
                    partyCode={partyCode}
                    mode={'matches'}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
                    Share a vibe to see your recommendations
                  </div>
                )}
                {/* Debug info */}
                <div className="mt-4 p-2 bg-gray-100 text-xs">
                  <div>Debug: latestMatches = {latestMatches?.length || 0} items</div>
                  <div>Debug: restaurants = {restaurants.length} items</div>
                  <div>Debug: showRecommendations = {showRecommendations.toString()}</div>
                  <div>Debug: mode = {latestMatches && latestMatches.length > 0 ? 'matches' : 'none'}</div>
                </div>
                
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