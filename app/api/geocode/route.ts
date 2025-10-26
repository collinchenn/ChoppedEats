import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    // Use Place API reverse geocoding via geocode endpoint
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      `${lat},${lng}`
    )}&key=${GOOGLE_PLACES_API_KEY}`

    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to reverse geocode' }, { status: res.status })
    }
    const data = await res.json()
    const formattedAddress = data.results?.[0]?.formatted_address
    if (!formattedAddress) {
      return NextResponse.json({ error: 'No address found' }, { status: 404 })
    }
    return NextResponse.json({ address: formattedAddress })
  } catch (e) {
    console.error('Reverse geocode error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


