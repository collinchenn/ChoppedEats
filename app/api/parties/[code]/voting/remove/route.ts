import { NextRequest, NextResponse } from 'next/server'
import { getParty, removeVotingCandidate, broadcastToParty } from '@/lib/party-store'

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

    const { restaurantId } = await request.json()
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const candidates = removeVotingCandidate(code, restaurantId)

    broadcastToParty(code, { type: 'voting_candidates_updated', candidates })
    return NextResponse.json({ success: true, candidates })
  } catch (error) {
    console.error('Error removing voting candidate:', error)
    return NextResponse.json({ error: 'Failed to remove candidate' }, { status: 500 })
  }
}
