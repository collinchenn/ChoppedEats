import { NextRequest, NextResponse } from 'next/server'
import { analyzeVibesAndRecommendRestaurants, Vibe } from '@/lib/groq'

export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  console.log('Request body:', body)

  const { vibes, location }: { vibes: Vibe[]; location: string } = body
  console.log('Received vibes:', vibes)

  if (!vibes || !Array.isArray(vibes) || vibes.length === 0) {
    return NextResponse.json({ error: 'Vibes array is required and cannot be empty' }, { status: 400 })
  }

  if (!location || typeof location !== 'string') {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 })
  }

  try {
    const recommendations = await analyzeVibesAndRecommendRestaurants(vibes, location)
    console.log('Recommendations:', recommendations)
    return NextResponse.json({ recommendations }, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    
    // Pass through more detailed error information
    let errorMessage = 'Internal error while analyzing vibes'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
