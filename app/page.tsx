'use client'

import { useState } from 'react'
import { Plus, Users, MapPin, Utensils } from 'lucide-react'
import CreateParty from '@/components/CreateParty'
import JoinParty from '@/components/JoinParty'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Utensils className="h-12 w-12 text-primary-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">ChopEats</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create parties and decide on restaurants together with your friends. 
            Share your vibe, budget, and preferences to find the perfect spot!
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Party
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'join'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="h-5 w-5 mr-2" />
                Join Party
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {activeTab === 'create' ? <CreateParty /> : <JoinParty />}
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create & Invite</h3>
              <p className="text-gray-600">
                Create a party and get a unique code to share with your friends
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Vibe</h3>
              <p className="text-gray-600">
                Tell everyone what you're craving, your budget, and dietary preferences
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find & Decide</h3>
              <p className="text-gray-600">
                Get AI-powered restaurant recommendations and vote together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
