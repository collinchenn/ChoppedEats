import { NextRequest, NextResponse } from 'next/server'
import { getParty, addVotingCandidate, broadcastToParty } from '@/lib/party-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const party = getParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const { restaurant, addedBy } = await request.json()
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant is required' }, { status: 400 })
    }

    const candidates = addVotingCandidate(code, {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine || 'Restaurant',
      priceRange: restaurant.priceRange || '$$',
      rating: restaurant.rating || 0,
      distance: restaurant.distance || '',
      address: restaurant.address || '',
      image: restaurant.image,
      votes: restaurant.votes || 0,
      addedBy: addedBy || 'Unknown',
      source: 'manual'
    })

    broadcastToParty(code, { type: 'voting_candidates_updated', candidates })
    return NextResponse.json({ success: true, candidates })
  } catch (error) {
    console.error('Error adding voting candidate:', error)
    return NextResponse.json({ error: 'Failed to add candidate' }, { status: 500 })
  }
}


