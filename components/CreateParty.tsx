'use client'

import { useState } from 'react'
import { Copy, Check, MapPin, LocateFixed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ensureSignedInAnonymously, getFirebaseServices } from '@/lib/firebase-client'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function CreateParty() {
  const [partyName, setPartyName] = useState('')
  const [location, setLocation] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [partyCode, setPartyCode] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const [isLocating, setIsLocating] = useState(false)

  const useCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        )
      })
      const res = await fetch(`/api/geocode?lat=${coords.latitude}&lng=${coords.longitude}`)
      if (!res.ok) {
        throw new Error('Failed to resolve address')
      }
      const data = await res.json()
      if (data.address) {
        setLocation(data.address)
      }
    } catch (e) {
      console.error(e)
      alert('Could not get your current location. Please enter it manually.')
    } finally {
      setIsLocating(false)
    }
  }

  const generatePartyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyName.trim() || !location.trim()) return

    setIsCreating(true)
    
    try {
      await ensureSignedInAnonymously()
      const { auth } = getFirebaseServices()
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: partyName,
          location: location
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPartyCode(data.party.code)
      } else {
        const errorData = await response.json()
        console.error('Failed to create party:', errorData.error)
        alert('Failed to create party. Please try again.')
      }
    } catch (error) {
      console.error('Error creating party:', error)
      alert('Failed to create party. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinParty = async () => {
    if (partyCode) {
      // Show loading overlay
      setShowLoadingOverlay(true)
      
      // Wait 4 seconds for animation
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Navigate to party
      window.location.href = `/party/${partyCode}`
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(partyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (partyCode) {
    return (
      <>
        {showLoadingOverlay && <LoadingOverlay />}
        
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
      </>
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
          <div className="flex gap-2">
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="input-field flex-1"
              required
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title="Use current location"
            >
              <LocateFixed className="h-4 w-4 mr-1" />
              {isLocating ? 'Locating...' : 'Use Current'}
            </button>
          </div>
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