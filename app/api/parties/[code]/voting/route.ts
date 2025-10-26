import { NextRequest, NextResponse } from 'next/server'
import { getParty, getVotingCandidates } from '@/lib/party-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const party = getParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }
    const candidates = getVotingCandidates(code)
    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('Error getting voting candidates:', error)
    return NextResponse.json({ error: 'Failed to get candidates' }, { status: 500 })
  }
}


