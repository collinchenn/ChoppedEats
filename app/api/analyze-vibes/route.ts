import { NextRequest, NextResponse } from 'next/server'
import { analyzeVibesAndRecommendRestaurants, Vibe } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { vibes, location } = await request.json()

    if (!vibes || !Array.isArray(vibes) || vibes.length === 0) {
      return NextResponse.json(
        { error: 'Vibes array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    const recommendations = await analyzeVibesAndRecommendRestaurants(vibes, location)
    
    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Error in analyze-vibes API:', error)
    
    if (error instanceof Error && error.message.includes('GROQ_API_KEY')) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GROQ_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze vibes and get recommendations' },
      { status: 500 }
    )
  }
}
