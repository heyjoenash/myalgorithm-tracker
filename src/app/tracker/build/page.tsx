'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Loader2, TrendingUp, Sparkles } from 'lucide-react'

const EXAMPLE_PROMPTS = [
  "Track Korean beauty trends from TikTok",
  "Monitor new AI tools on Product Hunt",
  "Follow sustainable fashion on Instagram",
  "Track book recommendations from BookTok",
  "Monitor crypto news and sentiment",
  "Track new restaurants in San Francisco",
  "Follow workout trends from fitness influencers",
  "Monitor tech layoffs and hiring news"
]

export default function BuildTrackerPage() {
  const [prompt, setPrompt] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleBuild = async () => {
    if (!prompt.trim()) return
    
    setIsBuilding(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tracker')
      }
      
      setResult(data)
    } catch (err) {
      console.error('Build failed:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsBuilding(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Your Tracker
            </span>
            <Sparkles className="inline-block ml-3 w-10 h-10 text-yellow-500" />
          </h1>
          <p className="text-xl text-gray-600">
            Tell us what you want to track in plain English
          </p>
        </motion.div>
        
        {/* Builder Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Input Section */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Track trending Korean beauty products from TikTok and Instagram"
                className="w-full h-32 p-4 pr-12 border-2 border-gray-200 rounded-xl resize-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition text-lg"
                disabled={isBuilding}
              />
              <Wand2 className="absolute right-4 top-4 w-6 h-6 text-gray-400" />
            </div>
            
            {/* Build Button */}
            <button
              onClick={handleBuild}
              disabled={!prompt.trim() || isBuilding}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-50 disabled:scale-100"
            >
              {isBuilding ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Building Your Tracker...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  Create Tracker
                </>
              )}
            </button>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Result Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-green-50 rounded-xl border-2 border-green-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{result.tracker?.name}</h3>
                  <p className="text-gray-600">{result.tracker?.description}</p>
                </div>
              </div>
              
              {result.run?.success && result.run?.results?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Found {result.run.results.length} results:
                  </p>
                  <div className="space-y-2">
                    {result.run.results.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-lg">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{item.description}</p>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <a
                  href={`/tracker/${result.tracker?.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  View Your Tracker →
                </a>
              </div>
            </motion.div>
          )}
          
          {/* Example Prompts */}
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-3">
              Or try one of these popular ideas:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
