import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface Party {
  id: string
  code: string
  name: string
  location: string
  createdAt: string
  vibes: Vibe[]
  restaurants: Restaurant[]
}

export interface Vibe {
  id: string
  user: string
  message: string
  budget?: number
  timestamp: string
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  priceRange: string
  rating: number
  distance: string
  address: string
  image?: string
  votes: number
}

const DATA_FILE = join(process.cwd(), 'data', 'parties.json')

// Ensure data directory exists (server-side only)
function ensureDataDirectory() {
  if (typeof window === 'undefined') {
    const dataDir = join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }
}

ensureDataDirectory()

// Load parties from file
function loadParties(): Map<string, Party> {
  if (typeof window !== 'undefined') {
    return new Map() // Client-side, return empty map
  }

  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf8')
      const partiesArray: [string, Party][] = JSON.parse(data)
      return new Map(partiesArray)
    }
  } catch (error) {
    console.error('Error loading parties:', error)
  }
  return new Map()
}

// Save parties to file with write lock simulation
let isSaving = false
let pendingSave: NodeJS.Timeout | null = null

function saveParties(parties: Map<string, Party>) {
  if (typeof window !== 'undefined') {
    return // Client-side, do nothing
  }

  // Debounce saves to prevent race conditions
  if (pendingSave) {
    clearTimeout(pendingSave)
  }

  pendingSave = setTimeout(() => {
    if (isSaving) {
      // If already saving, retry after a short delay
      saveParties(parties)
      return
    }

    isSaving = true
    try {
      const partiesArray = Array.from(parties.entries())
      writeFileSync(DATA_FILE, JSON.stringify(partiesArray, null, 2), 'utf8')
    } catch (error) {
      console.error('Error saving parties:', error)
    } finally {
      isSaving = false
      pendingSave = null
    }
  }, 100) // 100ms debounce
}

// In-memory storage with file persistence
export const parties = loadParties()

// Store for Server-Sent Events connections
export const eventStreams = new Map<string, Set<ReadableStreamDefaultController>>()

// Helper functions
export function getParty(code: string): Party | undefined {
  return parties.get(code)
}

export function setParty(code: string, party: Party): boolean {
  try {
    parties.set(code, party)
    saveParties(parties)
    return true
  } catch (error) {
    console.error('Error setting party:', error)
    return false
  }
}

export function addVibeToParty(code: string, vibe: Vibe): boolean {
  const party = parties.get(code)
  if (!party) {
    console.error(`Party not found: ${code}`)
    return false
  }

  try {
    party.vibes.push(vibe)
    parties.set(code, party)
    saveParties(parties)
    return true
  } catch (error) {
    console.error('Error adding vibe:', error)
    return false
  }
}

export function setRestaurantsForParty(code: string, restaurants: Restaurant[]): boolean {
  const party = parties.get(code)
  if (!party) {
    console.error(`Party not found: ${code}`)
    return false
  }

  try {
    party.restaurants = restaurants
    parties.set(code, party)
    saveParties(parties)
    return true
  } catch (error) {
    console.error('Error setting restaurants:', error)
    return false
  }
}

export function voteForRestaurant(code: string, restaurantId: string): number {
  const party = parties.get(code)
  if (!party) {
    console.error(`Party not found: ${code}`)
    return 0
  }

  const restaurant = party.restaurants.find(r => r.id === restaurantId)
  if (!restaurant) {
    console.error(`Restaurant not found: ${restaurantId}`)
    return 0
  }

  try {
    restaurant.votes = (restaurant.votes || 0) + 1
    parties.set(code, party)
    saveParties(parties)
    return restaurant.votes
  } catch (error) {
    console.error('Error voting for restaurant:', error)
    return 0
  }
}

// Add controller to event stream
export function addEventStreamController(
  partyCode: string, 
  controller: ReadableStreamDefaultController
) {
  if (!eventStreams.has(partyCode)) {
    eventStreams.set(partyCode, new Set())
  }
  eventStreams.get(partyCode)!.add(controller)
}

// Remove controller from event stream
export function removeEventStreamController(
  partyCode: string, 
  controller: ReadableStreamDefaultController
) {
  const streams = eventStreams.get(partyCode)
  if (streams) {
    streams.delete(controller)
    if (streams.size === 0) {
      eventStreams.delete(partyCode)
    }
  }
}

// Broadcast function for real-time updates
export function broadcastToParty(partyCode: string, data: any): void {
  const streams = eventStreams.get(partyCode)
  if (!streams || streams.size === 0) {
    return
  }

  const message = `data: ${JSON.stringify(data)}\n\n`
  const encodedMessage = new TextEncoder().encode(message)
  const deadControllers: ReadableStreamDefaultController[] = []

  streams.forEach(controller => {
    try {
      controller.enqueue(encodedMessage)
    } catch (error) {
      console.error('Error broadcasting to client:', error)
      deadControllers.push(controller)
    }
  })

  // Clean up dead controllers
  deadControllers.forEach(controller => {
    streams.delete(controller)
  })

  // Remove empty stream sets
  if (streams.size === 0) {
    eventStreams.delete(partyCode)
  }
}

// Cleanup old parties (optional utility function)
export function cleanupOldParties(maxAgeHours: number = 24): number {
  const now = new Date()
  let removed = 0

  parties.forEach((party, code) => {
    const partyAge = now.getTime() - new Date(party.createdAt).getTime()
    const maxAge = maxAgeHours * 60 * 60 * 1000

    if (partyAge > maxAge) {
      parties.delete(code)
      eventStreams.delete(code)
      removed++
    }
  })

  if (removed > 0) {
    saveParties(parties)
  }

  return removed
}