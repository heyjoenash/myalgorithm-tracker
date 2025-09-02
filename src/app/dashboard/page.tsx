'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Share2, Plus, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTrackers()
  }, [])
  
  const fetchTrackers = async () => {
    try {
      const response = await fetch('/api/trackers')
      const data = await response.json()
      setTrackers(data.trackers || [])
    } catch (error) {
      console.error('Failed to fetch trackers:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading trackers...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Public Trackers
            </h1>
            <p className="text-gray-600 mt-2">
              Discover what others are tracking
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={fetchTrackers}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <a
              href="/tracker/build"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Tracker
            </a>
          </div>
        </div>
        
        {/* Trackers Grid */}
        {trackers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No trackers yet</p>
            <a
              href="/tracker/build"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create the First Tracker
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackers.map((tracker, index) => (
              <motion.div
                key={tracker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Card Header */}
                <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 p-4 flex items-end">
                  <div className="text-white">
                    <h3 className="font-bold text-lg line-clamp-1">
                      {tracker.name}
                    </h3>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {tracker.description || tracker.prompt}
                    </p>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-4">
                  {/* Sources */}
                  {tracker.sources && tracker.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tracker.sources.map((source: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Metrics */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {tracker.last_run_at 
                          ? formatDate(tracker.last_run_at)
                          : 'Never run'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Share2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* View Button */}
                  <a
                    href={`/tracker/${tracker.id}`}
                    className="mt-4 w-full block text-center py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                  >
                    View Tracker
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
