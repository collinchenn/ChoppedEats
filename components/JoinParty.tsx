'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinParty() {
  const [partyCode, setPartyCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleJoinParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyCode.trim()) return

    setIsJoining(true)
    setError('')

    // Simulate API call to check if party exists
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For now, just redirect to the party page
    // In a real app, you'd validate the party code first
    router.push(`/party/${partyCode.toUpperCase()}`)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Join a Party</h2>
      
      <form onSubmit={handleJoinParty} className="space-y-6">
        <div>
          <label htmlFor="partyCode" className="block text-sm font-medium text-gray-700 mb-2">
            Party Code
          </label>
          <input
            type="text"
            id="partyCode"
            value={partyCode}
            onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            className="input-field text-center text-2xl font-mono tracking-wider"
            maxLength={6}
            required
          />
          <p className="text-sm text-gray-500 mt-2 text-center">
            Ask your friend for the party code they received
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isJoining || !partyCode.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining Party...' : 'Join Party'}
        </button>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How to join:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Ask your friend for the 6-character party code</li>
          <li>2. Enter the code above</li>
          <li>3. Start sharing your dining preferences!</li>
        </ol>
      </div>
    </div>
  )
}
