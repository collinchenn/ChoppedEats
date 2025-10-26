'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { getFirebaseServices } from '@/lib/firebase-client'
import { Users } from 'lucide-react'

interface JoinEvent {
  id: string
  username: string
  timestamp: number
}

interface PartyJoinFeedFirebaseProps {
  partyCode: string
}

export default function PartyJoinFeedFirebase({ partyCode }: PartyJoinFeedFirebaseProps) {
  const [joinEvents, setJoinEvents] = useState<JoinEvent[]>([])
  const [previousMembers, setPreviousMembers] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const { db } = getFirebaseServices()
    
    // Listen to members collection in real-time (tracks name entries)
    const membersRef = collection(db, 'parties', partyCode, 'members')
    
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      if (!snapshot.empty) {
        const membersData = snapshot.docs.map(doc => doc.data())
        
        // Get unique usernames (current members who entered names)
        const currentMembers = new Set(membersData.map((m: any) => m.name))
        
        // On first load, just set the baseline without showing notifications
        if (!isInitialized) {
          setPreviousMembers(currentMembers)
          setIsInitialized(true)
          return
        }
        
        // Find NEW members (who weren't in previous set)
        const newMembers = Array.from(currentMembers).filter(
          member => !previousMembers.has(member)
        )
        
        // Create join events for new members
        newMembers.forEach(username => {
          const newEvent: JoinEvent = {
            id: `${username}-${Date.now()}`,
            username: username as string,
            timestamp: Date.now()
          }
          
          setJoinEvents(prev => [newEvent, ...prev].slice(0, 5))
          
          // Auto-remove after 6 seconds
          setTimeout(() => {
            setJoinEvents(prev => prev.filter(e => e.id !== newEvent.id))
          }, 6000)
        })
        
        // Update previous members
        setPreviousMembers(currentMembers)
      } else {
        // No members yet - initialize as empty
        if (!isInitialized) {
          setIsInitialized(true)
        }
      }
    })
    
    // Cleanup listener on unmount
    return () => {
      unsubscribe()
    }
  }, [partyCode, isInitialized])

  if (joinEvents.length === 0) return null

  return (
    <div className="fixed top-6 right-6 z-50 space-y-1.5 pointer-events-none">
      {joinEvents.map((event, index) => (
        <div
          key={event.id}
          style={{
            animation: 'slideInRight 0.3s ease-out, fadeOut 0.4s ease-in 5.6s forwards',
            opacity: 1 - (index * 0.1)
          }}
        >
          {/* CSGO-style horizontal layout */}
          <div className="bg-gray-100 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg border border-gray-300 shadow-sm flex items-center gap-3 min-w-[280px]">
            {/* Left side - username */}
            <span className="font-semibold text-sm text-gray-800">
              {event.username}
            </span>
            
            {/* Middle - icon with colored background */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-sky-100 rounded">
              <Users className="h-3.5 w-3.5 text-sky-500" strokeWidth={2.5} />
              <span className="text-xs font-medium text-sky-600 uppercase tracking-wide">
                Joined
              </span>
            </div>
            
            {/* Right side - party name */}
            <span className="text-sm text-gray-500 ml-auto">
              Party
            </span>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(30px);
          }
        }
      `}</style>
    </div>
  )
}