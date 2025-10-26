'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, Clock, Trophy, BarChart3 } from 'lucide-react'
import { getFirebaseServices, ensureSignedInAnonymously } from '@/lib/firebase-client'
import { collection, onSnapshot, doc } from 'firebase/firestore'
import RestaurantSwiper from '@/components/RestaurantSwiper'

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

type Phase = 'swiping' | 'waiting' | 'results'

export default function VotingPage() {
  const params = useParams()
  const partyCode = params.code as string

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [userId, setUserId] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('swiping')
  const [finishedCount, setFinishedCount] = useState<number>(0)
  const [participantsCount, setParticipantsCount] = useState<number>(0)
  const [top3, setTop3] = useState<Restaurant[]>([])
  const [combinedScores, setCombinedScores] = useState<Record<string, number>>({})
  const [showScores, setShowScores] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  // map for quick lookup
  const restaurantById = useMemo(() => {
    const m = new Map<string, Restaurant>()
    restaurants.forEach(r => m.set(r.id, r))
    return m
  }, [restaurants])

  useEffect(() => {
    ensureSignedInAnonymously().finally(() => {
      // Generate or retrieve session-based user ID like party page
      const key = `cardivor-user-id-${partyCode}`
      let uid = sessionStorage.getItem(key)
      if (!uid) {
        try {
          uid = (self.crypto?.randomUUID && self.crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`
        } catch {
          uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        }
        sessionStorage.setItem(key, uid)
      }
      setUserId(uid!)

      const { db } = getFirebaseServices()
      // Candidates listener
      const candCol = collection(db, 'parties', partyCode, 'votingCandidates')
      const unsub1 = onSnapshot(candCol, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Restaurant[]
        setRestaurants(list)
      })

      // Party progress listener
      const partyRef = doc(db, 'parties', partyCode)
      const unsub2 = onSnapshot(partyRef, (snap) => {
        const data: any = snap.data()
        const fc = typeof data?.votingFinishedCount === 'number' ? data.votingFinishedCount : 0
        const pc = typeof data?.votingParticipantsCount === 'number' ? data.votingParticipantsCount : 0
        setFinishedCount(fc)
        setParticipantsCount(pc)

        if (data?.votingAllFinished) {
          const scores = (data?.votingCombinedScores || {}) as Record<string, number>
          const t3 = Array.isArray(data?.votingTop3) ? data.votingTop3 : []
          setCombinedScores(scores)
          setTop3(t3)
          setPhase('results')
        }
      })

      return () => {
        unsub1()
        unsub2()
      }
    })
  }, [partyCode])

  // Fetch photos for top 3 restaurants
  useEffect(() => {
    const fetchPhotos = async () => {
      if (top3.length === 0) return
      
      const updates: Record<string, string> = {}
      await Promise.all(
        top3.map(async (restaurant) => {
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
    
    fetchPhotos()
  }, [top3])

  const submitBallot = async (likedIds: string[]) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/parties/${partyCode}/voting/ballot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, likedIds })
      })
      if (res.ok) {
        const data = await res.json()
        setFinishedCount(data.finishedCount || 0)
        setParticipantsCount(data.participantsCount || 0)
        if (data.allFinished && Array.isArray(data.top3)) {
          setTop3(data.top3)
          setPhase('results')
        } else {
          setPhase('waiting')
        }
      } else {
        setPhase('waiting')
      }
    } catch {
      setPhase('waiting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = (liked: Restaurant[]) => {
    const likedIds = Array.from(new Set(liked.map(r => r.id)))
    submitBallot(likedIds)
  }

  if (phase === 'swiping') {
    return (
      <RestaurantSwiper
        restaurants={restaurants}
        onComplete={(liked) => handleComplete(liked)}
        hideCompletionScreen={true}
      />
    )
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitting your votes...</h2>
          <p className="text-gray-600">Please wait while we process your ballot.</p>
        </div>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for others…</h2>
          <p className="text-gray-600 mb-6">We'll show results once everyone finishes swiping.</p>
          <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 inline-block">
            <span className="font-semibold">{finishedCount}</span> / {Math.max(participantsCount, finishedCount)} finished
          </div>
        </div>
      </div>
    )
  }

  // Results phase
  const getGoogleMapsUrl = (r: Restaurant) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.address || ''}`.trim())}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Top Picks</h1>
              <p className="text-gray-600">Your group's top 3 restaurants</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{participantsCount} participants</span>
          </div>
        </div>

        {/* Deck of top3 */}
        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
              <div className="h-40 relative">
                {photoUrls[r.id] ? (
                  <img
                    src={photoUrls[r.id]}
                    alt={r.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Loading image...</div>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold text-gray-900 mb-1">{r.name}</div>
                <div className="text-sm text-gray-600 mb-2">{r.cuisine}</div>
                <div className="mt-auto">
                  <a
                    href={getGoogleMapsUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scores toggle button */}
        <button
          onClick={() => setShowScores(!showScores)}
          className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span>{showScores ? 'Hide scores' : 'Show all scores'}</span>
        </button>

        {showScores && (
          <div className="fixed bottom-20 right-6 w-80 max-h-[60vh] overflow-auto bg-white rounded-xl shadow-2xl p-4">
            <div className="font-semibold text-gray-900 mb-2">All restaurant scores</div>
            <div className="space-y-2">
              {[...restaurants]
                .map(r => ({ r, score: combinedScores[r.id] || 0 }))
                .sort((a, b) => b.score - a.score)
                .map(({ r, score }) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="truncate mr-2">{r.name}</div>
                    <div className="font-mono text-gray-700">{score}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

