// app/api/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const photoName = searchParams.get('photoName');
  const placeId = searchParams.get('placeId');

  if (!photoName || !placeId) {
    return new NextResponse('Missing photoName or placeId', { status: 400 });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return new NextResponse('API key not configured', { status: 500 });
  }

  try {
    // Extract the photo resource name from the full name
    const photoResource = photoName.split('/photos/')[1];
    if (!photoResource) {
      return new NextResponse('Invalid photo name format', { status: 400 });
    }

    // Construct the Google Places Photos API URL
    const photoUrl = `https://places.googleapis.com/v1/places/${placeId}/photos/${photoResource}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_PLACES_API_KEY}`;

    // Fetch the photo from Google Places API
    const response = await fetch(photoUrl);

    if (!response.ok) {
      console.error('Photo API error:', response.status, response.statusText);
      return new NextResponse('Failed to fetch photo', { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
