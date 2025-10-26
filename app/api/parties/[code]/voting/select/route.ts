import { NextRequest, NextResponse } from 'next/server'
import { getParty, setVotingCandidates, broadcastToParty, type Restaurant } from '@/lib/party-store'
import { analyzeVibesAndRecommendRestaurants } from '@/lib/groq'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const party = getParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    let selected: Restaurant[] = []
    try {
      const recs = await analyzeVibesAndRecommendRestaurants(
        party.vibes.map(v => ({ user: v.user, message: v.message, budget: v.budget })),
        party.location
      )
      // Map by name+address match from pooled restaurants when possible, else create entries
      const pool = party.restaurants || []
      const key = (name: string, address: string) => `${(name||'').toLowerCase()}|${(address||'').toLowerCase()}`
      const poolMap = new Map(pool.map(r => [key(r.name, r.address), r]))

      for (const r of recs) {
        const k = key((r as any).name, (r as any).address || '')
        const match = poolMap.get(k)
        if (match) {
          selected.push(match)
        } else {
          selected.push({
            id: `${(r as any).name}-${(r as any).address || ''}`,
            name: (r as any).name,
            cuisine: (r as any).cuisine || 'Restaurant',
            priceRange: (r as any).priceRange || '$$',
            rating: (r as any).yelpRating || 0,
            distance: '',
            address: (r as any).address || '',
            votes: 0
          })
        }
        if (selected.length >= 5) break
      }
    } catch (e) {
      // Fallback heuristic: top-rated from pool
      const pool = party.restaurants || []
      selected = pool
        .slice()
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
    }

    // Merge with existing manual candidates and dedupe by name+address
    const existing = party.votingCandidates || []
    const combined = [...existing, ...selected]
    const seen = new Set<string>()
    const merged = combined.filter(r => {
      const k = `${r.name.toLowerCase()}|${(r.address||'').toLowerCase()}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

    setVotingCandidates(code, merged)
    broadcastToParty(code, { type: 'voting_candidates_updated', candidates: merged })
    return NextResponse.json({ success: true, candidates: merged })
  } catch (error) {
    console.error('Error selecting voting candidates:', error)
    return NextResponse.json({ error: 'Failed to select candidates' }, { status: 500 })
  }
}


