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
    // Authorization: allow if Firebase ownerUid matches request OR if ownerSessionId matches a provided client session id
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    let requesterUid: string | null = null
    if (idToken) {
      try {
        const decoded = await adminAuth().verifyIdToken(idToken)
        requesterUid = decoded.uid
      } catch {}
    }

    const { ownerSessionId: clientOwnerSessionId } = await request.json().catch(() => ({ ownerSessionId: undefined }))

    // Load party doc from Firestore for owner checks
    const partyDoc = await adminDb().collection('parties').doc(code).get()
    const pdata = partyDoc.exists ? (partyDoc.data() as any) : null
    const ownerUid: string | undefined = pdata?.ownerUid
    const ownerSessionId: string | undefined = pdata?.ownerSessionId
    
    const isOwner = (ownerUid && requesterUid && ownerUid === requesterUid) || (ownerSessionId && clientOwnerSessionId && ownerSessionId === clientOwnerSessionId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const party = getParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Get all vibes from Firestore (not just party-store)
    let allVibes: any[] = []
    try {
      const vibesSnap = await adminDb().collection('parties').doc(code).collection('vibes').orderBy('timestamp', 'asc').get()
      allVibes = vibesSnap.docs.map((d: any) => d.data())
    } catch (e) {
      console.error('Error fetching vibes from Firestore:', e)
      // Fallback to party-store vibes
      allVibes = party.vibes || []
    }

    // Get all restaurants from Firestore (not just party-store)
    let allRestaurants: any[] = []
    try {
      const restaurantsSnap = await adminDb().collection('parties').doc(code).collection('restaurants').get()
      allRestaurants = restaurantsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.error('Error fetching restaurants from Firestore:', e)
      // Fallback to party-store restaurants
      allRestaurants = party.restaurants || []
    }

    let selected: Restaurant[] = []
    try {
      const recs = await analyzeVibesAndRecommendRestaurants(
        allVibes.map(v => ({ user: v.user, message: v.message, budget: v.budget })),
        party.location
      )
      // Map by name+address match from pooled restaurants when possible, else create entries
      const pool = allRestaurants
      const key = (name: string, address: string) => `${(name||'').toLowerCase()}|${(address||'').toLowerCase()}`
      const poolMap = new Map(pool.map(r => [key(r.name, r.address), r]))

      for (const r of recs) {
        const k = key((r as any).name, (r as any).address || '')
        const match = poolMap.get(k)
        if (match) {
          selected.push({ ...match, addedBy: 'AI' })
        } else {
          selected.push({
            id: `${(r as any).name}-${(r as any).address || ''}`,
            name: (r as any).name,
            cuisine: (r as any).cuisine || 'Restaurant',
            priceRange: (r as any).priceRange || '$$',
            rating: (r as any).yelpRating || 0,
            distance: '',
            address: (r as any).address || '',
            votes: 0,
            addedBy: 'AI'
          })
        }
        if (selected.length >= 5) break
      }
    } catch (e) {
      // Fallback heuristic: top-rated from pool
      const pool = allRestaurants
      selected = pool
        .slice()
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
        .map(r => ({ ...r, addedBy: 'AI' }))
    }

    // Get existing manual candidates from Firestore (not just party-store)
    let existingCandidates: any[] = []
    try {
      const candidatesSnap = await adminDb().collection('parties').doc(code).collection('votingCandidates').get()
      existingCandidates = candidatesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.error('Error fetching existing candidates from Firestore:', e)
      // Fallback to party-store candidates
      existingCandidates = party.votingCandidates || []
    }

    // Merge with existing manual candidates and dedupe by name+address
    const combined = [...existingCandidates, ...selected]
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
      const partyRef = adminDb().collection('parties').doc(code)
      const col = partyRef.collection('votingCandidates')
      merged.forEach((r) => batch.set(col.doc(r.id), r, { merge: true }))
      // mark voting started to trigger client redirects
      batch.set(partyRef, { votingStarted: true }, { merge: true })
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


