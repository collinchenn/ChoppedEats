'use client'

import { useState } from 'react'
import { Copy, Check, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CreateParty() {
  const [partyName, setPartyName] = useState('')
  const [location, setLocation] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [partyCode, setPartyCode] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const generatePartyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyName.trim() || !location.trim()) return

    setIsCreating(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const code = generatePartyCode()
    setPartyCode(code)
    setIsCreating(false)
  }

  const handleJoinParty = () => {
    if (partyCode) {
      router.push(`/party/${partyCode}`)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(partyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (partyCode) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Party Created!</h2>
          <p className="text-gray-600">Share this code with your friends to invite them</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Party Code</p>
          <div className="flex items-center justify-center space-x-3">
            <span className="text-3xl font-mono font-bold text-gray-900">{partyCode}</span>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleJoinParty}
            className="btn-primary w-full"
          >
            Join Your Party
          </button>
          <button
            onClick={() => {
              setPartyCode('')
              setPartyName('')
              setLocation('')
            }}
            className="btn-secondary w-full"
          >
            Create Another Party
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create a New Party</h2>
      
      <form onSubmit={handleCreateParty} className="space-y-6">
        <div>
          <label htmlFor="partyName" className="block text-sm font-medium text-gray-700 mb-2">
            Party Name
          </label>
          <input
            type="text"
            id="partyName"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="e.g., Friday Night Dinner"
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA"
            className="input-field"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isCreating || !partyName.trim() || !location.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating Party...' : 'Create Party'}
        </button>
      </form>
    </div>
  )
}
