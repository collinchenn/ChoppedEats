'use client'

import { useState, useEffect } from 'react'
import { User, X } from 'lucide-react'

interface NameEntryModalProps {
  isOpen: boolean
  onClose: (name: string) => void
}

export default function NameEntryModal({ isOpen, onClose }: NameEntryModalProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setIsSubmitting(true)
    // Small delay to show loading state
    setTimeout(() => {
      onClose(name.trim())
      setIsSubmitting(false)
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Welcome to the Party!</h2>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          What's your name? This will be used for all your vibes in this group session.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                'Join Party'
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Your name will be saved for this group session only
        </p>
      </div>
    </div>
  )
}
