import { NextRequest, NextResponse } from 'next/server'
import { getParty, clearVotingCandidates, broadcastToParty } from '@/lib/party-store'

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

    clearVotingCandidates(code)
    broadcastToParty(code, { type: 'voting_candidates_updated', candidates: [] })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing voting candidates:', error)
    return NextResponse.json({ error: 'Failed to clear candidates' }, { status: 500 })
  }
}


