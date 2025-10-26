import { NextRequest, NextResponse } from 'next/server'
import { getParty, addVotingCandidate, broadcastToParty } from '@/lib/party-store'
import { adminDb } from '@/lib/firebase-admin'

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

    const candidate = {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine || 'Restaurant',
      priceRange: restaurant.priceRange || '$$',
      rating: restaurant.rating || 0,
      distance: restaurant.distance || '',
      address: restaurant.address || '',
      image: restaurant.image,
      votes: restaurant.votes || 0,
      addedBy: addedBy || 'Unknown'
    }
    const candidates = addVotingCandidate(code, candidate)
    try {
      await adminDb().collection('parties').doc(code).collection('votingCandidates').doc(candidate.id).set(candidate, { merge: true })
    } catch (e) {
      console.error('Firestore add candidate error:', e)
    }

    broadcastToParty(code, { type: 'voting_candidates_updated', candidates })
    return NextResponse.json({ success: true, candidates })
  } catch (error) {
    console.error('Error adding voting candidate:', error)
    return NextResponse.json({ error: 'Failed to add candidate' }, { status: 500 })
  }
}


