'use client'

import { DollarSign, Clock } from 'lucide-react'

interface Vibe {
  id: string
  user: string
  message: string
  budget?: number
  timestamp: Date
}

interface VibeListProps {
  vibes: Vibe[]
}

export default function VibeList({ vibes }: VibeListProps) {
  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (vibes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="text-gray-400 mb-2">
          <DollarSign className="h-8 w-8 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Vibes Yet</h3>
        <p className="text-gray-500">
          Be the first to share what you're feeling!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Party Vibes ({vibes.length})
      </h3>
      
      <div className="space-y-4">
        {vibes.map((vibe) => (
          <div key={vibe.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {vibe.user.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-900">{vibe.user}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(vibe.timestamp)}
              </div>
            </div>
            
            <p className="text-gray-700 mb-2">{vibe.message}</p>
            
            {vibe.budget && (
              <div className="flex items-center text-sm text-green-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>Budget: ${vibe.budget.toFixed(2)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
