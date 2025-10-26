import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { userId, likedIds } = await request.json()

    if (!userId || !Array.isArray(likedIds)) {
      return NextResponse.json({ error: 'userId and likedIds are required' }, { status: 400 })
    }

    const partyRef = adminDb().collection('parties').doc(code)

    // Dedupe likes to ensure max +1 per restaurant per user
    const uniqueLikedIds: string[] = Array.from(new Set(likedIds))

    // Write/overwrite the user's ballot
    try {
      await partyRef.collection('votingBallots').doc(userId).set({
        userId,
        likedIds: uniqueLikedIds,
        finished: true,
        finishedAt: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.error('Firestore write ballot error:', e)
    }

    // Compute participants based on vibes unique users
    let participantsSet = new Set<string>()
    try {
      const vibesSnap = await partyRef.collection('vibes').get()
      vibesSnap.docs.forEach((d: any) => {
        const v = d.data()
        const key = (v?.userId && typeof v.userId === 'string' && v.userId) || (typeof v?.user === 'string' ? v.user : null)
        if (key) participantsSet.add(key)
      })
    } catch (e) {
      // ignore
    }

    const ballotsSnap = await partyRef.collection('votingBallots').get()
    const finishedCount = ballotsSnap.docs.filter((d: any) => d.data()?.finished === true).length
    const participantsCount = Math.max(participantsSet.size, ballotsSnap.size)

    // Always write progress so clients can show waiting status
    try {
      await partyRef.set({
        votingFinishedCount: finishedCount,
        votingParticipantsCount: participantsCount
      }, { merge: true })
    } catch {}

    let top3: any[] | null = null
    let scoresMap: Record<string, number> | null = null
    let allFinished = false

    if (participantsCount > 0 && finishedCount >= participantsCount) {
      allFinished = true
      // Aggregate scores
      const score: Record<string, number> = {}
      ballotsSnap.docs.forEach((d: any) => {
        const b = d.data()
        const likesRaw: string[] = Array.isArray(b?.likedIds) ? b.likedIds : []
        const likesSet = new Set<string>(likesRaw)
        likesSet.forEach((rid: string) => {
          score[rid] = (score[rid] || 0) + 1
        })
      })

      // Get candidate restaurant docs to enrich
      const candidatesSnap = await partyRef.collection('votingCandidates').get()
      const candidatesMap = new Map<string, any>()
      candidatesSnap.docs.forEach((d: any) => candidatesMap.set(d.id, { id: d.id, ...d.data() }))

      const scoredList = Object.keys(score).map((id) => ({ id, score: score[id], restaurant: candidatesMap.get(id) }))
        .filter((x) => !!x.restaurant)
        .sort((a, b) => b.score - a.score)

      top3 = scoredList.slice(0, 1).map((s) => ({ ...s.restaurant, finalScore: s.score }))
      scoresMap = score

      try {
        await partyRef.set({
          votingAllFinished: true,
          votingCombinedScores: scoresMap,
          votingTop1: top3
        }, { merge: true })
      } catch (e) {
        console.error('Firestore write voting results error:', e)
      }
    }

    return NextResponse.json({
      success: true,
      finishedCount,
      participantsCount,
      allFinished,
      top1: top3 || undefined
    })
  } catch (error) {
    console.error('Error submitting ballot:', error)
    return NextResponse.json({ error: 'Failed to submit ballot' }, { status: 500 })
  }
}


