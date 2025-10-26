// app/api/restaurants/route.ts
import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// For testing without API key - mock data
const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'The Golden Spoon',
    rating: 4.5,
    priceLevel: 2,
    address: '123 Main St, Downtown',
    location: { lat: 37.7749, lng: -122.4194 },
    isOpen: true,
    types: ['restaurant', 'food'],
    userRatingsTotal: 234,
    distance: 0.8
  },
  {
    id: '2',
    name: 'Pizza Paradise',
    rating: 4.8,
    priceLevel: 1,
    address: '456 Oak Ave',
    location: { lat: 37.7751, lng: -122.4180 },
    isOpen: true,
    types: ['restaurant', 'pizza'],
    userRatingsTotal: 567,
    distance: 1.2
  },
  {
    id: '3',
    name: 'Sushi Sensation',
    rating: 4.6,
    priceLevel: 3,
    address: '789 Pine St',
    location: { lat: 37.7740, lng: -122.4200 },
    isOpen: false,
    types: ['restaurant', 'sushi'],
    userRatingsTotal: 189,
    distance: 2.3
  },
  {
    id: '4',
    name: 'Burger Barn',
    rating: 4.2,
    priceLevel: 1,
    address: '321 Elm St',
    location: { lat: 37.7760, lng: -122.4170 },
    isOpen: true,
    types: ['restaurant', 'burger'],
    userRatingsTotal: 445,
    distance: 1.5
  },
  {
    id: '5',
    name: 'Thai Terrace',
    rating: 4.7,
    priceLevel: 2,
    address: '555 Market St',
    location: { lat: 37.7730, lng: -122.4210 },
    isOpen: true,
    types: ['restaurant', 'thai'],
    userRatingsTotal: 312,
    distance: 3.1
  }
];


export async function POST(request: Request) {
  const { query, priceLevels, locationBias } = await request.json(); 

  const API_KEY = GOOGLE_PLACES_API_KEY;
  const BASE_URL = "https://places.googleapis.com/v1/places:searchText";
  const fieldMask =
    "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.websiteUri,places.location,places.photos,nextPageToken";

  let allResults: any[] = [];
  let pageToken: string | null = null;

  try {
    do {
      const body: { 
        pageToken?: string; 
        textQuery?: string; 
        pageSize?: number; 
        priceLevels?: string[];
        locationBias?: any;
      } = pageToken
        ? { pageToken } // pagination request
        : { 
            textQuery: query, 
            pageSize: 20,
            ...(Array.isArray(priceLevels) && priceLevels.length > 0 ? { priceLevels } : {}),
            ...(locationBias ? { locationBias } : {})
          }; // first request

      const response: Response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY!,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.places) {
        allResults = allResults.concat(data.places);
      }

      pageToken = data.nextPageToken || null;

      // wait for token activation before next call
      if (pageToken) {
        await new Promise((res) => setTimeout(res, 2000));
      }
    } while (pageToken);

    return Response.json({ results: allResults });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Helper function to calculate distance between two coordinates in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI/180);
}
