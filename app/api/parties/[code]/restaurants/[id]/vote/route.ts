import { NextRequest, NextResponse } from 'next/server'
import { getParty, voteForRestaurant, broadcastToParty } from '@/lib/party-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string; id: string } }
) {
  try {
    const { code, id } = params

    const party = getParty(code)
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    const restaurant = party.restaurants.find(r => r.id === id)
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const votes = voteForRestaurant(code, id)

    // Broadcast to all connected clients
    broadcastToParty(code, {
      type: 'vote_updated',
      restaurantId: id,
      votes
    })

    return NextResponse.json({ success: true, votes })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    )
  }
}

