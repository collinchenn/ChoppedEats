import { NextRequest, NextResponse } from 'next/server'
import { getParty } from '@/lib/party-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const party = getParty(code)

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      vibes: party.vibes,
      restaurants: party.restaurants,
      votingCandidates: party.votingCandidates || []
    })
  } catch (error) {
    console.error('Error fetching party:', error)
    return NextResponse.json(
      { error: 'Failed to fetch party' },
      { status: 500 }
    )
  }
}
