import { NextRequest, NextResponse } from 'next/server'
import { getParty, setVotingCandidates, broadcastToParty, type Restaurant } from '@/lib/party-store'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { analyzeVibesAndRecommendRestaurants } from '@/lib/groq'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    // Verify owner
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    let requesterUid: string | null = null
    if (idToken) {
      try {
        const decoded = await adminAuth().verifyIdToken(idToken)
        requesterUid = decoded.uid
      } catch (e) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const party = getParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Ensure requester is owner
    try {
      const partyDoc = await adminDb().collection('parties').doc(code).get()
      if (partyDoc.exists) {
        const data = partyDoc.data() as any
        if (data?.ownerUid && data.ownerUid !== requesterUid) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    } catch (e) {
      // if we cannot verify, proceed but still rely on client being honest
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
    // Mirror to Firestore votingCandidates
    try {
      const batch = adminDb().batch()
      const col = adminDb().collection('parties').doc(code).collection('votingCandidates')
      merged.forEach((r) => batch.set(col.doc(r.id), r, { merge: true }))
      await batch.commit()
    } catch (e) {
      console.error('Firestore write votingCandidates error:', e)
    }
    broadcastToParty(code, { type: 'voting_candidates_updated', candidates: merged })
    return NextResponse.json({ success: true, candidates: merged })
  } catch (error) {
    console.error('Error selecting voting candidates:', error)
    return NextResponse.json({ error: 'Failed to select candidates' }, { status: 500 })
  }
}


