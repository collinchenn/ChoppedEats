'use client'

import { useState } from 'react'
import { Send, DollarSign, User } from 'lucide-react'

interface VibeInputProps {
  onSubmit: (vibe: { user: string; message: string; budget?: number }) => void
}

export default function VibeInput({ onSubmit }: VibeInputProps) {
  const [user, setUser] = useState('')
  const [message, setMessage] = useState('')
  const [budget, setBudget] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.trim() || !message.trim()) return

    onSubmit({
      user: user.trim(),
      message: message.trim(),
      budget: budget ? parseFloat(budget) : undefined
    })

    setMessage('')
    setBudget('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Vibe</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Your Name
          </label>
          <input
            type="text"
            id="user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Enter your name"
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            What are you feeling?
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., I'm craving sushi and have about $30 to spend"
            className="input-field min-h-[100px] resize-none"
            required
          />
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Budget (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input-field pl-8"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!user.trim() || !message.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 mr-2" />
          Share Vibe
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tips:</strong> Be specific about what you're craving, any dietary restrictions, 
          and your budget. The more details you share, the better our recommendations will be!
        </p>
      </div>
    </div>
  )
}
