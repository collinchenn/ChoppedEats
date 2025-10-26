'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, Heart, Star, MapPin, DollarSign } from 'lucide-react'

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
  votedBy?: string[]
}

export default function VotingPage() {
  const params = useParams()
  const partyCode = params.code as string
  const [candidates, setCandidates] = useState<Restaurant[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    // Generate or retrieve userId from localStorage
    let storedUserId = localStorage.getItem(`userId_${partyCode}`)
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(`userId_${partyCode}`, storedUserId)
    }
    setUserId(storedUserId)

    const load = async () => {
      const res = await fetch(`/api/parties/${partyCode}/voting`)
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.candidates || [])
      }
    }
    load()

    const eventSource = new EventSource(`/api/parties/${partyCode}/events`)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'voting_candidates_updated') {
        setCandidates(data.candidates)
      } else if (data.type === 'voting_vote_updated') {
        setCandidates(prev => prev.map(r => 
          r.id === data.restaurantId 
            ? { ...r, votes: data.votes, votedBy: data.votedBy } 
            : r
        ))
      }
    }
    return () => eventSource.close()
  }, [partyCode])

  const hasVoted = (restaurant: Restaurant) => {
    return restaurant.votedBy?.includes(userId) || false
  }

  const toggleVote = async (restaurant: Restaurant) => {
    if (!userId) return
    
    const voted = hasVoted(restaurant)
    
    if (voted) {
      // Unvote
      await fetch(`/api/parties/${partyCode}/voting/${restaurant.id}/vote`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
    } else {
      // Vote
      await fetch(`/api/parties/${partyCode}/voting/${restaurant.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voting - Party: {partyCode}</h1>
              <p className="text-gray-600">Vote on the finalists selected by your group</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {candidates.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 flex">
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="w-20 h-20 rounded object-cover mr-4" />
                  ) : (
                    <div className="w-20 h-20 rounded bg-gray-100 mr-4" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{r.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{r.cuisine}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span>{r.rating}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>{r.priceRange}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{r.distance}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{r.address}</p>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-primary-600 mb-2">{r.votes}</div>
                  <button
                    onClick={() => toggleVote(r)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      hasVoted(r)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    <Heart className="h-4 w-4" />
                    <span>{hasVoted(r) ? 'Voted' : 'Vote'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {candidates.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
              No candidates yet. Ask your group to add restaurants or use Enter Voting.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


