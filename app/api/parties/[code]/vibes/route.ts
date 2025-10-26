import { NextRequest, NextResponse } from 'next/server'
import { getParty, addVibeToParty, broadcastToParty, setRestaurantsForParty, type Restaurant } from '@/lib/party-store'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { user, message, budget } = await request.json()

    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userId: string | null = null
    if (idToken) {
      try {
        const decoded = await adminAuth().verifyIdToken(idToken)
        userId = decoded.uid
      } catch (e) {
        // allow unauth, stays null
      }
    }

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
      timestamp: new Date().toISOString(),
      userId: userId || undefined
    }

    addVibeToParty(code, newVibe)

    // Write vibe to Firestore
    try {
      await adminDb().collection('parties').doc(code).collection('vibes').doc(newVibe.id).set(newVibe, { merge: true })
    } catch (e) {
      console.error('Firestore write vibe error:', e)
    }

    // Prepare matches container
    let matches: Restaurant[] = []

    // Augment: fetch restaurants for this vibe and accumulate into party list
    try {
      const partyAfterVibe = getParty(code)
      const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
      if (partyAfterVibe && GOOGLE_PLACES_API_KEY) {
        const textQuery = `${newVibe.message} ${partyAfterVibe.location}`.trim()
        const BASE_URL = 'https://places.googleapis.com/v1/places:searchText'
        const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.location,places.photos'

        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify({ textQuery, pageSize: 10 })
        })

        if (response.ok) {
          const data: any = await response.json()
          const places: any[] = Array.isArray(data.places) ? data.places : []

          const mapPriceLevel = (pl: string | undefined): string => {
            switch (pl) {
              case 'PRICE_LEVEL_FREE':
              case 'PRICE_LEVEL_INEXPENSIVE':
                return '$'
              case 'PRICE_LEVEL_MODERATE':
                return '$$'
              case 'PRICE_LEVEL_EXPENSIVE':
                return '$$$'
              case 'PRICE_LEVEL_VERY_EXPENSIVE':
                return '$$$$'
              default:
                return '$$'
            }
          }

          const existing: Restaurant[] = partyAfterVibe.restaurants || []
          const existingKey = new Set(
            existing.map(r => `${(r.name || '').toLowerCase()}|${(r.address || '').toLowerCase()}`)
          )

          const newRestaurants: Restaurant[] = places.map((p: any) => {
            const name = p?.displayName?.text || p?.displayName || 'Unknown'
            const address = p?.formattedAddress || ''
            return {
              id: p?.id || `${name}-${address}`,
              name,
              cuisine: 'Restaurant',
              priceRange: mapPriceLevel(p?.priceLevel),
              rating: typeof p?.rating === 'number' ? p.rating : 0,
              distance: '',
              address,
              votes: 0
            }
          })

          matches = newRestaurants.slice(0, 10)

          // Write matches under this vibe (visible to author; enforce via rules client-side)
          try {
            const batch = adminDb().batch()
            const vibeRef = adminDb().collection('parties').doc(code).collection('vibes').doc(newVibe.id)
            matches.forEach((m) => {
              const docRef = vibeRef.collection('matches').doc(m.id)
              batch.set(docRef, m, { merge: true })
            })
            await batch.commit()
          } catch (e) {
            console.error('Firestore write matches error:', e)
          }

          const merged: Restaurant[] = [...existing]
          for (const r of newRestaurants) {
            const key = `${r.name.toLowerCase()}|${r.address.toLowerCase()}`
            if (!existingKey.has(key)) {
              existingKey.add(key)
              merged.push(r)
            }
          }

          setRestaurantsForParty(code, merged)

          // Upsert restaurants into Firestore pooled list
          try {
            const batch = adminDb().batch()
            const restaurantsRef = adminDb().collection('parties').doc(code).collection('restaurants')
            merged.forEach((r) => {
              const docRef = restaurantsRef.doc(r.id)
              batch.set(docRef, r, { merge: true })
            })
            await batch.commit()
          } catch (e) {
            console.error('Firestore write pooled restaurants error:', e)
          }

          broadcastToParty(code, { type: 'restaurants_updated', restaurants: merged })
        }
      }
    } catch (e) {
      console.error('Failed to fetch/accumulate restaurants for vibe:', e)
      // Non-fatal; still return success for the vibe creation
    }

    // Broadcast vibe with matches (if any)
    broadcastToParty(code, {
      type: 'vibe_added',
      vibe: newVibe,
      matches
    })

    return NextResponse.json({ ...newVibe, matches })
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
