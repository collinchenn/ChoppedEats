'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, Clock, Trophy, BarChart3 } from 'lucide-react'
import confetti from 'canvas-confetti'
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
  finalScore?: number
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
  const [top1, setTop1] = useState<Restaurant[]>([])
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
          const t1 = Array.isArray(data?.votingTop1) ? data.votingTop1 : []
          setCombinedScores(scores)
          setTop1(t1)
          setPhase('results')
        }
      })

      return () => {
        unsub1()
        unsub2()
      }
    })
  }, [partyCode])

  // Confetti effect when results phase starts
  useEffect(() => {
    if (phase === 'results' && top1.length > 0) {
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 100 * (timeLeft / duration)
        
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
    }
  }, [phase, top1])

  // Fetch photos for top 1 restaurant
  useEffect(() => {
    const fetchPhotos = async () => {
      if (top1.length === 0) return
      
      const updates: Record<string, string> = {}
      await Promise.all(
        top1.map(async (restaurant) => {
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
  }, [top1])

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
        if (data.allFinished && Array.isArray(data.top1)) {
          setTop1(data.top1)
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Winner!</h1>
              <p className="text-gray-600">Your group's chosen restaurant</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{participantsCount} participants</span>
          </div>
        </div>
      </div>
      {top1.length > 0 && (
        <div className="max-w-5xl mx-auto mt-24">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image on the left */}
                <div className="md:w-1/2 h-96 md:h-auto relative">
                  {photoUrls[top1[0].id] ? (
                    <img
                      src={photoUrls[top1[0].id]}
                      alt={top1[0].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="text-gray-400 text-sm">Loading image...</div>
                    </div>
                  )}
                </div>
                
                {/* Content on the right */}
                <div className="md:w-1/2 p-8 flex flex-col justify-between">
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">{top1[0].name}</h2>
                    <p className="text-xl text-gray-600 mb-2">{top1[0].cuisine} Restauraunt</p>
                    
                    <div className="flex items-center space-x-6 text-base text-gray-500 mb-2">
                      <div className="flex items-center">
                        <span className="font-medium text-lg">{top1[0].rating} ⭐</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg">{top1[0].priceRange}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg">{top1[0].distance}</span>
                      </div>
                    </div>
                    
                    <div className="text-base text-gray-700 mb-6">
                      <p>{top1[0].address}</p>
                    </div>
                    
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center mb-6">
                      <div className="text-4xl font-bold text-blue-700">{top1[0].finalScore || 0}</div>
                      <div className="text-sm text-blue-600">
                        {top1[0].finalScore === 1 ? 'Vote' : 'Votes'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <a
                      href={getGoogleMapsUrl(top1[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Scores toggle button */}
      <button
        onClick={() => setShowScores(!showScores)}
        className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-2 z-20"
      >
        <BarChart3 className="h-4 w-4" />
        <span>{showScores ? 'Hide scores' : 'Show all scores'}</span>
      </button>

      {showScores && (
        <div className="fixed bottom-20 right-6 w-80 max-h-[60vh] overflow-auto bg-white rounded-xl shadow-2xl p-4 z-20">
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
  )
}

