import { FirecrawlService } from '@/lib/services/firecrawl'
import { supabase } from '@/lib/supabase/client'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export interface TrackerConfig {
  id?: string
  name: string
  prompt: string
  description?: string
  sources?: string[]
  isPublic?: boolean
}

export interface TrackerResult {
  title: string
  description?: string
  url: string
  images: string[]
  source: string
  score?: number
  metadata?: any
}

export class TrackerEngine {
  private firecrawl: FirecrawlService
  
  constructor() {
    this.firecrawl = new FirecrawlService()
  }
  
  // Parse natural language prompt into tracker configuration
  async parsePrompt(prompt: string): Promise<{
    name: string
    description: string
    sources: string[]
    queries: string[]
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Parse the user's tracking request and extract:
              1. A short name for the tracker (3-5 words)
              2. A description (1 sentence)
              3. Which platforms/sources to track from (tiktok, instagram, reddit, product hunt, etc)
              4. Search queries to use for finding content
              
              Examples:
              - "Track Korean beauty trends from TikTok" -> sources: ["tiktok"], queries: ["Korean beauty trends", "K-beauty skincare", "Korean makeup"]
              - "Monitor AI tools on Product Hunt" -> sources: ["product hunt"], queries: ["AI tools Product Hunt", "new AI launches", "artificial intelligence startup"]
              
              Return as JSON with keys: name, description, sources, queries`
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
      
      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Failed to parse prompt:', error)
      // Fallback parsing
      return {
        name: prompt.slice(0, 50),
        description: prompt,
        sources: ['web'],
        queries: [prompt]
      }
    }
  }
  
  // Create a new tracker
  async createTracker(config: TrackerConfig) {
    try {
      // Parse the prompt to get configuration
      const parsed = await this.parsePrompt(config.prompt)
      
      // Save tracker to database
      const { data: tracker, error } = await supabase
        .from('trackers')
        .insert({
          name: config.name || parsed.name,
          description: config.description || parsed.description,
          prompt: config.prompt,
          config: {
            queries: parsed.queries,
            platforms: parsed.sources
          },
          sources: parsed.sources,
          is_public: config.isPublic || true
        })
        .select()
        .single()
      
      if (error) throw error
      
      return {
        success: true,
        tracker
      }
    } catch (error) {
      console.error('Failed to create tracker:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tracker'
      }
    }
  }
  
  // Run a tracker and collect data
  async runTracker(trackerId: string) {
    try {
      // Get tracker configuration
      const { data: tracker, error: trackerError } = await supabase
        .from('trackers')
        .select('*')
        .eq('id', trackerId)
        .single()
      
      if (trackerError || !tracker) {
        throw new Error('Tracker not found')
      }
      
      // Create a new run record
      const { data: run, error: runError } = await supabase
        .from('tracker_runs')
        .insert({
          tracker_id: trackerId,
          status: 'running'
        })
        .select()
        .single()
      
      if (runError) throw runError
      
      // Collect data based on tracker configuration
      const results: TrackerResult[] = []
      const queries = tracker.config?.queries || [tracker.prompt]
      
      for (const query of queries) {
        // Search with Firecrawl
        const searchResult = await this.searchWithFirecrawl(query)
        results.push(...searchResult)
      }
      
      // Process and enrich results with AI
      const enrichedResults = await this.enrichResults(results, tracker.prompt)
      
      // Save results to database
      if (enrichedResults.length > 0) {
        const resultsToInsert = enrichedResults.map(result => ({
          run_id: run.id,
          tracker_id: trackerId,
          title: result.title,
          description: result.description,
          url: result.url,
          images: result.images,
          source: result.source,
          score: result.score,
          metadata: result.metadata
        }))
        
        await supabase
          .from('tracker_results')
          .insert(resultsToInsert)
      }
      
      // Update run status
      await supabase
        .from('tracker_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            results_count: enrichedResults.length
          }
        })
        .eq('id', run.id)
      
      // Update tracker's last run time
      await supabase
        .from('trackers')
        .update({
          last_run_at: new Date().toISOString()
        })
        .eq('id', trackerId)
      
      return {
        success: true,
        results: enrichedResults,
        runId: run.id
      }
    } catch (error) {
      console.error('Failed to run tracker:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run tracker'
      }
    }
  }
  
  // Search using Firecrawl
  private async searchWithFirecrawl(query: string): Promise<TrackerResult[]> {
    const result = await this.firecrawl.search(query, 5)
    
    if (!result.success || !result.data) {
      return []
    }
    
    return result.data.map((item: any) => ({
      title: item.title || 'Untitled',
      description: item.content?.slice(0, 200),
      url: item.url,
      images: item.screenshot ? [item.screenshot] : [],
      source: 'firecrawl',
      score: item.score,
      metadata: {
        raw_content: item.content
      }
    }))
  }
  
  // Enrich results with AI analysis
  private async enrichResults(
    results: TrackerResult[], 
    trackerPrompt: string
  ): Promise<TrackerResult[]> {
    if (results.length === 0) return []
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are analyzing search results for a tracker: "${trackerPrompt}".
              Score each result's relevance from 0-10.
              Extract key insights and improve descriptions.
              Return JSON array with same structure but enhanced.`
          },
          {
            role: 'user',
            content: JSON.stringify(results.slice(0, 10))
          }
        ],
        response_format: { type: 'json_object' }
      })
      
      const enhanced = JSON.parse(response.choices[0].message.content || '{"results":[]}')
      return enhanced.results || results
    } catch (error) {
      console.error('Failed to enrich results:', error)
      return results
    }
  }
  
  // Get tracker with latest results
  async getTrackerWithResults(trackerId: string) {
    try {
      // Get tracker details
      const { data: tracker, error: trackerError } = await supabase
        .from('trackers')
        .select('*')
        .eq('id', trackerId)
        .single()
      
      if (trackerError) throw trackerError
      
      // Get latest run
      const { data: latestRun } = await supabase
        .from('tracker_runs')
        .select('*')
        .eq('tracker_id', trackerId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()
      
      // Get results from latest run
      let results: any[] = []
      if (latestRun) {
        const { data: runResults } = await supabase
          .from('tracker_results')
          .select('*')
          .eq('run_id', latestRun.id)
          .order('score', { ascending: false })
        
        results = runResults || []
      }
      
      return {
        success: true,
        tracker,
        latestRun,
        results
      }
    } catch (error) {
      console.error('Failed to get tracker:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracker'
      }
    }
  }
  
  // Get all public trackers
  async getPublicTrackers() {
    try {
      const { data: trackers, error } = await supabase
        .from('trackers')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      return {
        success: true,
        trackers: trackers || []
      }
    } catch (error) {
      console.error('Failed to get public trackers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trackers'
      }
    }
  }
}
