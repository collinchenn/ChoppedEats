import { NextRequest, NextResponse } from 'next/server'
import { getParty, addVibeToParty, broadcastToParty } from '@/lib/party-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { user, message, budget } = await request.json()

    if (!user || !message) {
      return NextResponse.json(
        { error: 'User and message are required' },
        { status: 400 }
      )
    }

    const party = getParty(code)
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    const newVibe = {
      id: Date.now().toString(),
      user,
      message,
      budget: budget ? parseFloat(budget) : undefined,
      timestamp: new Date().toISOString()
    }

    addVibeToParty(code, newVibe)

    // Broadcast to all connected clients
    broadcastToParty(code, {
      type: 'vibe_added',
      vibe: newVibe
    })

    return NextResponse.json(newVibe)
  } catch (error) {
    console.error('Error adding vibe:', error)
    return NextResponse.json(
      { error: 'Failed to add vibe' },
      { status: 500 }
    )
  }
}


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

    return NextResponse.json({ vibes: party.vibes })
  } catch (error) {
    console.error('Error fetching vibes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vibes' },
      { status: 500 }
    )
  }
}
