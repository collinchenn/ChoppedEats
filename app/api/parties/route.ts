import { NextRequest, NextResponse } from 'next/server'
import { setParty, getParty, type Party } from '@/lib/party-store'

export async function POST(request: NextRequest) {
  try {
    const { name, location } = await request.json()

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      )
    }

    // Generate unique party code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const id = Date.now().toString()

    const party: Party = {
      id,
      code,
      name,
      location,
      createdAt: new Date().toISOString(),
      vibes: [],
      restaurants: []
    }

    setParty(code, party)

    return NextResponse.json({ party })
  } catch (error) {
    console.error('Error creating party:', error)
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { error: 'Party code is required' },
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

  return NextResponse.json({ party })
}
