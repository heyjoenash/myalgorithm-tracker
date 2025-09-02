export interface Tracker {
  id: string
  name: string
  description: string
  prompt: string
  schedule: string
  sources: DataSource[]
  isPublic: boolean
  userId?: string
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date
}

export interface DataSource {
  type: 'firecrawl' | 'exa' | 'jina' | 'api'
  config: {
    url?: string
    query?: string
    limit?: number
    filters?: any
  }
}

export interface TrackerResult {
  id: string
  trackerId: string
  title: string
  description?: string
  content?: string
  url: string
  images: string[]
  videos?: string[]
  source: string
  score?: number
  metadata?: any
  createdAt: Date
}

export interface TrackerRun {
  id: string
  trackerId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  results: TrackerResult[]
  error?: string
  startedAt: Date
  completedAt?: Date
}
