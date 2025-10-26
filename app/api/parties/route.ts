import { NextRequest, NextResponse } from 'next/server'
import { setParty, getParty, type Party } from '@/lib/party-store'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { name, location } = await request.json()
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    let ownerUid: string | undefined = undefined
    if (idToken) {
      try {
        const decoded = await adminAuth().verifyIdToken(idToken)
        ownerUid = decoded.uid
      } catch (e) {
        // ignore, allow party creation without verified owner
      }
    }

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

    try {
      // Persist to Firestore as well for multi-user
      await adminDb().collection('parties').doc(code).set({
        id,
        code,
        name,
        location,
        ownerUid: ownerUid || null,
        createdAt: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.error('Firestore create party error:', e)
    }

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

  try {
    const snap = await adminDb().collection('parties').doc(code).get()
    if (!snap.exists) {
      const party = getParty(code)
      if (!party) {
        return NextResponse.json(
          { error: 'Party not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ party })
    }
    return NextResponse.json({ party: { ...snap.data() } })
  } catch (e) {
    console.error('Firestore get party error:', e)
    const party = getParty(code)
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ party })
  }
}
