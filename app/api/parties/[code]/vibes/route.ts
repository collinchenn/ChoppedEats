import { NextRequest, NextResponse } from 'next/server'
import { getParty, addVibeToParty, broadcastToParty, setRestaurantsForParty, type Restaurant } from '@/lib/party-store'

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

    // Prepare matches container
    let matches: Restaurant[] = []

    // Augment: fetch restaurants for this vibe and accumulate into party list
    try {
      const partyAfterVibe = getParty(code)
      const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
      if (partyAfterVibe && GOOGLE_PLACES_API_KEY) {
        const textQuery = `${newVibe.message} ${partyAfterVibe.location}`.trim()
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
              cuisine: getCuisineType(p?.types),
              priceRange: mapPriceLevel(p?.priceLevel),
              rating: typeof p?.rating === 'number' ? p.rating : 0,
              distance: '',
              address,
              votes: 0
            }
          })

          matches = newRestaurants.slice(0, 10)

          const merged: Restaurant[] = [...existing]
          for (const r of newRestaurants) {
            const key = `${r.name.toLowerCase()}|${r.address.toLowerCase()}`
            if (!existingKey.has(key)) {
              existingKey.add(key)
              merged.push(r)
            }
          }

          setRestaurantsForParty(code, merged)
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
