'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function JoinParty() {
  const [partyCode, setPartyCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleJoinParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyCode.trim()) return

    setIsJoining(true)
    setError('')

    try {
      // Validate that the party exists
      const response = await fetch(`/api/parties?code=${partyCode.toUpperCase()}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.party) {
          // Show loading overlay
          setShowLoadingOverlay(true)
          
          // Wait 3 seconds for animation
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Use window.location for actual page change (not instant like router.push)
          window.location.href = `/party/${partyCode.toUpperCase()}`
        } else {
          setError('Party not found. Please check the code and try again.')
          setIsJoining(false)
        }
      } else {
        setError('Party not found. Please check the code and try again.')
        setIsJoining(false)
      }
    } catch (error) {
      console.error('Error joining party:', error)
      setError('Failed to join party. Please try again.')
      setIsJoining(false)
    }
  }

  return (
    <>
      {showLoadingOverlay && <LoadingOverlay />}
      
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
          {isJoining ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining Party...
            </span>
          ) : (
            'Join Party'
          )}
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
    </>
  )
}