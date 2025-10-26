import { NextRequest, NextResponse } from 'next/server'
import { getParty, voteForVotingCandidate, broadcastToParty } from '@/lib/party-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string; id: string } }
) {
  try {
    const { code, id } = params
    const party = getParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const votes = voteForVotingCandidate(code, id)
    broadcastToParty(code, { type: 'voting_vote_updated', restaurantId: id, votes })
    return NextResponse.json({ success: true, votes })
  } catch (error) {
    console.error('Error voting for candidate:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}


