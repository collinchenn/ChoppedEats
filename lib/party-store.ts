// Simple file-based storage for party data
// In production, this would be replaced with a database

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface Party {
  id: string
  code: string
  name: string
  location: string
  createdAt: string
  vibes: Vibe[]
  restaurants: Restaurant[]
  votingCandidates?: Restaurant[]
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

// Ensure data directory exists
if (typeof window === 'undefined') {
  const fs = require('fs')
  const path = require('path')
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load parties from file
function loadParties(): Map<string, Party> {
  if (typeof window !== 'undefined') {
    return new Map() // Client-side, return empty map
  }

  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf8')
      const partiesArray = JSON.parse(data)
      return new Map(partiesArray)
    }
  } catch (error) {
    console.error('Error loading parties:', error)
  }
  return new Map()
}

// Save parties to file
function saveParties(parties: Map<string, Party>) {
  if (typeof window !== 'undefined') {
    return // Client-side, do nothing
  }

  try {
    const partiesArray = Array.from(parties.entries())
    writeFileSync(DATA_FILE, JSON.stringify(partiesArray, null, 2))
  } catch (error) {
    console.error('Error saving parties:', error)
  }
}

// In-memory storage with file persistence
export const parties = loadParties()

// Store for Server-Sent Events connections
export const eventStreams = new Map<string, Set<ReadableStreamDefaultController>>()

// Helper functions
export function getParty(code: string): Party | undefined {
  return parties.get(code)
}

export function setParty(code: string, party: Party) {
  parties.set(code, party)
  saveParties(parties)
}

export function addVibeToParty(code: string, vibe: Vibe) {
  const party = parties.get(code)
  if (party) {
    party.vibes.push(vibe)
    parties.set(code, party)
    saveParties(parties)
  }
}

export function setRestaurantsForParty(code: string, restaurants: Restaurant[]) {
  const party = parties.get(code)
  if (party) {
    party.restaurants = restaurants
    parties.set(code, party)
    saveParties(parties)
  }
}

export function getVotingCandidates(code: string): Restaurant[] {
  const party = parties.get(code)
  return party?.votingCandidates || []
}

export function setVotingCandidates(code: string, candidates: Restaurant[]) {
  const party = parties.get(code)
  if (party) {
    party.votingCandidates = candidates
    parties.set(code, party)
    saveParties(parties)
  }
}

export function addVotingCandidate(code: string, candidate: Restaurant) {
  const party = parties.get(code)
  if (party) {
    const list = party.votingCandidates || []
    const key = (r: Restaurant) => `${(r.name || '').toLowerCase()}|${(r.address || '').toLowerCase()}`
    const exists = list.some(r => key(r) === key(candidate))
    if (!exists) {
      list.push({ ...candidate, votes: candidate.votes ?? 0 })
      party.votingCandidates = list
      parties.set(code, party)
      saveParties(parties)
    }
    return party.votingCandidates
  }
  return []
}

export function clearVotingCandidates(code: string) {
  const party = parties.get(code)
  if (party) {
    party.votingCandidates = []
    parties.set(code, party)
    saveParties(parties)
  }
}

export function voteForVotingCandidate(code: string, restaurantId: string) {
  const party = parties.get(code)
  if (party && party.votingCandidates) {
    const restaurant = party.votingCandidates.find(r => r.id === restaurantId)
    if (restaurant) {
      restaurant.votes = (restaurant.votes || 0) + 1
      parties.set(code, party)
      saveParties(parties)
      return restaurant.votes
    }
  }
  return 0
}

export function voteForRestaurant(code: string, restaurantId: string) {
  const party = parties.get(code)
  if (party) {
    const restaurant = party.restaurants.find(r => r.id === restaurantId)
    if (restaurant) {
      restaurant.votes = (restaurant.votes || 0) + 1
      parties.set(code, party)
      saveParties(parties)
      return restaurant.votes
    }
  }
  return 0
}

// Broadcast function for real-time updates
export function broadcastToParty(partyCode: string, data: any) {
  const streams = eventStreams.get(partyCode)
  if (streams) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    streams.forEach(controller => {
      try {
        controller.enqueue(new TextEncoder().encode(message))
      } catch (error) {
        console.error('Error broadcasting to client:', error)
        streams.delete(controller)
      }
    })
  }
}