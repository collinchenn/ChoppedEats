import { NextRequest, NextResponse } from 'next/server'
import { getParty, setRestaurantsForParty, broadcastToParty } from '@/lib/party-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { restaurants } = await request.json()

    if (!restaurants || !Array.isArray(restaurants)) {
      return NextResponse.json(
        { error: 'Restaurants array is required' },
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

    setRestaurantsForParty(code, restaurants)

    // Broadcast to all connected clients
    broadcastToParty(code, {
      type: 'restaurants_updated',
      restaurants
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating restaurants:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurants' },
      { status: 500 }
    )
  }
}

