import { NextRequest, NextResponse } from 'next/server'
import { type Restaurant } from '@/lib/party-store'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { user, message, budget, userId: clientUserId } = await request.json()

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

    const finalUserId = userId || (typeof clientUserId === 'string' && clientUserId ? clientUserId : undefined)

    const newVibe = {
      id: Date.now().toString(),
      user,
      message,
      budget: budget ? parseFloat(budget) : undefined,
      timestamp: new Date().toISOString(),
      userId: finalUserId
    }
    
    console.log('👤 Creating vibe with userId:', finalUserId || null, 'vibeId:', newVibe.id)


    // Write vibe to Firestore
    try {
      // Filter out undefined values for Firestore
      const vibeData = { ...newVibe }
      if (vibeData.budget === undefined) {
        delete vibeData.budget
      }
      if (vibeData.userId === undefined) {
        delete vibeData.userId
      }
      await adminDb().collection('parties').doc(code).collection('vibes').doc(newVibe.id).set(vibeData, { merge: true })
    } catch (e) {
      console.error('Firestore write vibe error:', e)
    }

    // Prepare matches container
    let matches: Restaurant[] = []

    // Augment: fetch restaurants for this vibe and accumulate into party list
    try {
      // Read party doc from Firestore for location (fallback to SF)
      let partyLocation = 'San Francisco, CA'
      try {
        const partyRef = adminDb().collection('parties').doc(code)
        const partySnap = await partyRef.get()
        const pdata: any = partySnap.data()
        if (pdata?.location) partyLocation = pdata.location
        // If no ownerSessionId is set yet, set it to the first client's user id
        if (!pdata?.ownerSessionId && finalUserId) {
          try {
            await partyRef.set({ ownerSessionId: finalUserId }, { merge: true })
          } catch {}
        }
      } catch {}
      const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
      if (GOOGLE_PLACES_API_KEY) {
        const textQuery = `${newVibe.message} ${partyLocation}`.trim()
        const BASE_URL = 'https://places.googleapis.com/v1/places:searchText'
        const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.location,places.photos,places.types'

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

          const getCuisineType = (types: string[] | undefined): string => {
            if (!types || !Array.isArray(types)) return 'Restaurant'
            
            // Cuisine type mappings from Google Places types
            const cuisineMap: Record<string, string> = {
              'chinese_restaurant': 'Chinese',
              'japanese_restaurant': 'Japanese',
              'korean_restaurant': 'Korean',
              'italian_restaurant': 'Italian',
              'mexican_restaurant': 'Mexican',
              'indian_restaurant': 'Indian',
              'thai_restaurant': 'Thai',
              'vietnamese_restaurant': 'Vietnamese',
              'french_restaurant': 'French',
              'american_restaurant': 'American',
              'greek_restaurant': 'Greek',
              'spanish_restaurant': 'Spanish',
              'mediterranean_restaurant': 'Mediterranean',
              'middle_eastern_restaurant': 'Middle Eastern',
              'seafood_restaurant': 'Seafood',
              'steakhouse': 'Steakhouse',
              'sushi_restaurant': 'Sushi',
              'pizza_restaurant': 'Pizza',
              'hamburger_restaurant': 'Burger',
              'sandwich_shop': 'Sandwiches',
              'bakery': 'Bakery',
              'cafe': 'Cafe',
              'bar': 'Bar & Grill',
              'barbecue_restaurant': 'BBQ',
              'fast_food_restaurant': 'Fast Food',
              'vegetarian_restaurant': 'Vegetarian',
              'vegan_restaurant': 'Vegan'
            }
            
            // Find first matching cuisine type
            for (const type of types) {
              if (cuisineMap[type]) {
                return cuisineMap[type]
              }
            }
            
            // Default to Restaurant if no specific cuisine found
            return 'Restaurant'
          }

          // Build existing key set from current pooled restaurants in Firestore
          const existingKey = new Set<string>()
          try {
            const pooledSnap = await adminDb().collection('parties').doc(code).collection('restaurants').get()
            pooledSnap.docs.forEach((d: { data: () => any }) => {
              const r: any = d.data()
              const key = `${(r.name || '').toLowerCase()}|${(r.address || '').toLowerCase()}`
              existingKey.add(key)
            })
          } catch {}

          const newRestaurants: Restaurant[] = places.map((p: any) => {
            const name = p?.displayName?.text || p?.displayName || 'Unknown'
            const address = p?.formattedAddress || ''
            return {
              id: p?.id || `${name}-${address}`,
              name,
              cuisine: getCuisineType(p?.types),
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
            console.log('📝 Writing matches to Firestore:', matches.length, 'restaurants')
            console.log('📝 Matches data:', matches)
            const batch = adminDb().batch()
            const vibeRef = adminDb().collection('parties').doc(code).collection('vibes').doc(newVibe.id)
            matches.forEach((m) => {
              const docRef = vibeRef.collection('matches').doc(m.id)
              batch.set(docRef, m, { merge: true })
            })
            await batch.commit()
            console.log('✅ Successfully wrote matches to Firestore')
          } catch (e) {
            console.error('❌ Firestore write matches error:', e)
          }

          // Upsert restaurants into Firestore pooled list
          try {
            const batch = adminDb().batch()
            const restaurantsRef = adminDb().collection('parties').doc(code).collection('restaurants')
            const toWrite: Restaurant[] = []
            for (const r of newRestaurants) {
              const key = `${r.name.toLowerCase()}|${r.address.toLowerCase()}`
              if (!existingKey.has(key)) {
                existingKey.add(key)
                toWrite.push(r)
              }
            }
            toWrite.forEach((r) => {
              const docRef = restaurantsRef.doc(r.id)
              batch.set(docRef, r, { merge: true })
            })
            await batch.commit()
          } catch (e) {
            console.error('Firestore write pooled restaurants error:', e)
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch/accumulate restaurants for vibe:', e)
      // Non-fatal; still return success for the vibe creation
    }

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
    // Read vibes directly from Firestore ordered by timestamp
    const vibesSnap = await adminDb().collection('parties').doc(code).collection('vibes').orderBy('timestamp', 'asc').get()
    const vibes = vibesSnap.docs.map((d: { data: () => any }) => d.data())
    return NextResponse.json({ vibes })
  } catch (error) {
    console.error('Error fetching vibes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vibes' },
      { status: 500 }
    )
  }
}
