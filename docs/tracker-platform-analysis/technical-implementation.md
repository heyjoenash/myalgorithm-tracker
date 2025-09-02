# Technical Implementation Guide

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│                    API Layer (Vercel)                    │
├─────────────────────────────────────────────────────────┤
│   Orchestration    │    Storage    │    Processing      │
│   - Agent Router   │  - Supabase   │  - Firecrawl       │
│   - Queue Manager  │  - Redis      │  - Exa.ai          │
│   - Scheduler      │  - R2/S3      │  - OpenAI          │
└─────────────────────────────────────────────────────────┘
```

## 📦 Core Components

### 1. Tracker Engine
The heart of the system - orchestrates data collection

```typescript
// lib/tracker-engine/types.ts
export interface Tracker {
  id: string;
  userId: string;
  name: string;
  description: string;
  schedule: CronSchedule;
  sources: DataSource[];
  processors: ProcessorPipeline[];
  outputs: OutputFormat[];
  metadata: TrackerMetadata;
}

export interface DataSource {
  type: 'web' | 'api' | 'rss' | 'social';
  config: {
    url?: string;
    query?: string;
    auth?: AuthConfig;
    rateLimit?: RateLimitConfig;
  };
}

export interface TrackerRun {
  id: string;
  trackerId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: TrackerResult[];
  errors?: Error[];
}
```

### 2. Data Collection Layer
Modular collectors for different data sources

```typescript
// lib/collectors/base-collector.ts
export abstract class BaseCollector {
  abstract type: string;
  abstract collect(config: DataSource): Promise<RawData[]>;
  
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        await this.exponentialBackoff(i);
      }
    }
    throw lastError!;
  }
  
  private exponentialBackoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// lib/collectors/firecrawl-collector.ts
import { BaseCollector } from './base-collector';
import FirecrawlApp from '@mendable/firecrawl-js';

export class FirecrawlCollector extends BaseCollector {
  type = 'firecrawl';
  private client: FirecrawlApp;
  
  constructor(apiKey: string) {
    super();
    this.client = new FirecrawlApp({ apiKey });
  }
  
  async collect(config: DataSource): Promise<RawData[]> {
    const { url, query } = config.config;
    
    const result = await this.withRetry(async () => {
      if (url) {
        return await this.client.scrapeUrl(url, {
          pageOptions: {
            includeHtml: false,
            screenshot: true,
            waitFor: 2000
          }
        });
      } else if (query) {
        return await this.client.search(query, {
          limit: 10,
          scrapeOptions: {
            formats: ['markdown', 'screenshot']
          }
        });
      }
    });
    
    return this.transformToRawData(result);
  }
  
  private transformToRawData(result: any): RawData[] {
    // Transform Firecrawl response to standard format
    return result.data.map((item: any) => ({
      source: 'firecrawl',
      url: item.url,
      title: item.title,
      content: item.markdown,
      media: item.screenshot ? [{ type: 'image', url: item.screenshot }] : [],
      metadata: item.metadata,
      collectedAt: new Date()
    }));
  }
}

// lib/collectors/exa-collector.ts
import Exa from 'exa-js';

export class ExaCollector extends BaseCollector {
  type = 'exa';
  private client: Exa;
  
  constructor(apiKey: string) {
    super();
    this.client = new Exa(apiKey);
  }
  
  async collect(config: DataSource): Promise<RawData[]> {
    const { query } = config.config;
    
    const results = await this.client.searchAndContents(query, {
      numResults: 10,
      category: 'tweet', // or 'news', 'company', etc.
      startPublishedDate: this.getDateRange(),
      useAutoprompt: true,
      text: true,
      highlights: true
    });
    
    return results.results.map(result => ({
      source: 'exa',
      url: result.url,
      title: result.title,
      content: result.text,
      media: this.extractMedia(result),
      metadata: {
        score: result.score,
        publishedDate: result.publishedDate,
        highlights: result.highlights
      },
      collectedAt: new Date()
    }));
  }
}
```

### 3. Processing Pipeline
Transform and enrich raw data

```typescript
// lib/processors/enrichment-processor.ts
export class EnrichmentProcessor {
  async process(data: RawData[]): Promise<EnrichedData[]> {
    return Promise.all(data.map(async (item) => {
      const enriched = { ...item } as EnrichedData;
      
      // Extract dominant colors from images
      if (item.media?.length) {
        enriched.colors = await this.extractColors(item.media);
      }
      
      // Generate AI summary
      enriched.summary = await this.generateSummary(item.content);
      
      // Extract entities
      enriched.entities = await this.extractEntities(item.content);
      
      // Sentiment analysis
      enriched.sentiment = await this.analyzeSentiment(item.content);
      
      return enriched;
    }));
  }
  
  private async extractColors(media: Media[]): Promise<string[]> {
    // Use Replicate or similar for color extraction
    const imageUrls = media
      .filter(m => m.type === 'image')
      .map(m => m.url);
    
    // Implementation using Replicate API
    return ['#FF5733', '#33FF57', '#3357FF']; // Placeholder
  }
  
  private async generateSummary(content: string): Promise<string> {
    // Use OpenAI for summarization
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Summarize this content in 2-3 sentences, focusing on key trends and insights.'
        },
        { role: 'user', content }
      ],
      max_tokens: 150
    });
    
    return response.choices[0].message.content;
  }
}
```

### 4. Tracker Builder Interface
Natural language to tracker configuration

```typescript
// lib/builder/tracker-builder.ts
export class TrackerBuilder {
  async buildFromPrompt(prompt: string): Promise<TrackerConfig> {
    // Use AI to parse user intent
    const parsed = await this.parseIntent(prompt);
    
    // Map to tracker configuration
    return {
      name: parsed.name,
      description: parsed.description,
      schedule: this.determineSchedule(parsed),
      sources: this.determineSources(parsed),
      processors: this.determineProcessors(parsed),
      outputs: this.determineOutputs(parsed)
    };
  }
  
  private async parseIntent(prompt: string): Promise<ParsedIntent> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Parse the user's tracking request and extract:
            - What they want to track (subject)
            - Where to get the data (sources)
            - How often to update (frequency)
            - Any specific filters or criteria
            Return as JSON.`
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  private determineSources(parsed: ParsedIntent): DataSource[] {
    const sources: DataSource[] = [];
    
    // Map common platforms to collectors
    const platformMap = {
      'tiktok': { type: 'firecrawl', query: `site:tiktok.com ${parsed.subject}` },
      'twitter': { type: 'exa', query: `${parsed.subject} filter:safe` },
      'reddit': { type: 'api', endpoint: 'reddit', query: parsed.subject },
      'news': { type: 'exa', category: 'news', query: parsed.subject }
    };
    
    parsed.platforms.forEach(platform => {
      if (platformMap[platform]) {
        sources.push(platformMap[platform]);
      }
    });
    
    return sources;
  }
}
```

### 5. Storage Layer
Efficient temporal data storage

```typescript
// lib/storage/tracker-storage.ts
import { createClient } from '@supabase/supabase-js';

export class TrackerStorage {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  
  async saveTrackerRun(run: TrackerRun): Promise<void> {
    // Save run metadata
    const { error: runError } = await this.supabase
      .from('tracker_runs')
      .insert({
        id: run.id,
        tracker_id: run.trackerId,
        started_at: run.startedAt,
        completed_at: run.completedAt,
        status: run.status
      });
    
    if (runError) throw runError;
    
    // Save results with optimized storage
    const results = run.results.map(result => ({
      run_id: run.id,
      content: result.content,
      summary: result.summary,
      media_urls: result.media.map(m => m.url),
      metadata: result.metadata,
      created_at: new Date()
    }));
    
    const { error: resultsError } = await this.supabase
      .from('tracker_results')
      .insert(results);
    
    if (resultsError) throw resultsError;
    
    // Update tracker's last run timestamp
    await this.supabase
      .from('trackers')
      .update({ last_run_at: run.completedAt })
      .eq('id', run.trackerId);
  }
  
  async getTrackerHistory(
    trackerId: string,
    limit: number = 30
  ): Promise<TrackerRun[]> {
    const { data, error } = await this.supabase
      .from('tracker_runs')
      .select(`
        *,
        tracker_results (*)
      `)
      .eq('tracker_id', trackerId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
}
```

### 6. Scheduling System
Cron-based tracker execution

```typescript
// lib/scheduler/tracker-scheduler.ts
import { CronJob } from 'cron';
import { Queue } from 'bullmq';

export class TrackerScheduler {
  private jobs: Map<string, CronJob> = new Map();
  private queue: Queue;
  
  constructor() {
    this.queue = new Queue('tracker-runs', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }
  
  async scheduleTracker(tracker: Tracker): Promise<void> {
    // Stop existing job if any
    if (this.jobs.has(tracker.id)) {
      this.jobs.get(tracker.id)!.stop();
    }
    
    // Create new cron job
    const job = new CronJob(
      tracker.schedule.pattern, // e.g., '0 9 * * *' for daily at 9am
      async () => {
        await this.queue.add('run-tracker', {
          trackerId: tracker.id,
          scheduledAt: new Date()
        });
      },
      null,
      true,
      tracker.schedule.timezone || 'America/Los_Angeles'
    );
    
    this.jobs.set(tracker.id, job);
  }
  
  async unscheduleTracker(trackerId: string): Promise<void> {
    if (this.jobs.has(trackerId)) {
      this.jobs.get(trackerId)!.stop();
      this.jobs.delete(trackerId);
    }
  }
}
```

## 🎨 Frontend Components

### Tracker Card Component
```tsx
// components/tracker-card.tsx
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Share2 } from 'lucide-react';

interface TrackerCardProps {
  tracker: {
    id: string;
    name: string;
    lastUpdate: Date;
    media: string[];
    summary: string;
    metrics: {
      trend: 'up' | 'down' | 'stable';
      change: number;
    };
  };
}

export function TrackerCard({ tracker }: TrackerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Media Gallery */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
        {tracker.media.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 h-full p-1">
            {tracker.media.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white/50 text-4xl">📊</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{tracker.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {tracker.summary}
        </p>
        
        {/* Metrics */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">
              {new Date(tracker.lastUpdate).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${
              tracker.metrics.trend === 'up' ? 'text-green-500' : 
              tracker.metrics.trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span>{Math.abs(tracker.metrics.change)}%</span>
            </div>
            
            <button className="p-1 hover:bg-gray-100 rounded">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

### Tracker Builder UI
```tsx
// components/tracker-builder.tsx
import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

export function TrackerBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  
  const handleBuild = async () => {
    setIsBuilding(true);
    
    try {
      const response = await fetch('/api/trackers/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const tracker = await response.json();
      // Navigate to tracker or show preview
    } catch (error) {
      console.error('Failed to build tracker:', error);
    } finally {
      setIsBuilding(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-2">
          Create Your Tracker ✨
        </h2>
        <p className="text-gray-600 mb-6">
          Tell us what you want to track in plain English
        </p>
        
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Track Korean beauty trends from TikTok..."
            className="w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          
          <button
            onClick={handleBuild}
            disabled={!prompt || isBuilding}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {isBuilding ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Building your tracker...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Create Tracker
              </>
            )}
          </button>
        </div>
        
        {/* Template suggestions */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3">
            Or try these popular templates:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Tech trends on Twitter',
              'New restaurants in SF',
              'Fashion from Instagram',
              'BookTok recommendations'
            ].map((template) => (
              <button
                key={template}
                onClick={() => setPrompt(`Track ${template}`)}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 🚀 Deployment Configuration

### Docker Compose for Local Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/trackers
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: supabase/postgres:15
    environment:
      POSTGRES_PASSWORD: your-super-secret-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/trackers
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
```

### Vercel Deployment Config
```json
// vercel.json
{
  "functions": {
    "app/api/trackers/run.ts": {
      "maxDuration": 60
    },
    "app/api/trackers/build.ts": {
      "maxDuration": 30
    }
  },
  "crons": [{
    "path": "/api/cron/daily-trackers",
    "schedule": "0 9 * * *"
  }]
}
```

## 📊 Database Schema

```sql
-- Supabase SQL schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  schedule JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tracker_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID REFERENCES trackers(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  error TEXT,
  metadata JSONB
);

CREATE TABLE tracker_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES tracker_runs(id) ON DELETE CASCADE,
  content TEXT,
  summary TEXT,
  media_urls TEXT[],
  entities JSONB,
  sentiment JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follows (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tracker_id UUID REFERENCES trackers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tracker_id)
);

-- Indexes for performance
CREATE INDEX idx_trackers_user_id ON trackers(user_id);
CREATE INDEX idx_tracker_runs_tracker_id ON tracker_runs(tracker_id);
CREATE INDEX idx_tracker_results_run_id ON tracker_results(run_id);
CREATE INDEX idx_follows_tracker_id ON follows(tracker_id);

-- RLS Policies
ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can see public trackers or their own
CREATE POLICY "Trackers are viewable by owner or if public" ON trackers
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = true
  );

-- Users can only modify their own trackers
CREATE POLICY "Users can modify own trackers" ON trackers
  FOR ALL USING (auth.uid() = user_id);
```

## 🔑 Environment Variables

```bash
# .env.local
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Redis
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# AI Services
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=...
ANTHROPIC_API_KEY=...

# Data Collection
FIRECRAWL_API_KEY=...
EXA_API_KEY=...
SERP_API_KEY=...

# Storage
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_BUCKET=...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Analytics
POSTHOG_KEY=...
VERCEL_ANALYTICS_ID=...
```

This implementation provides a solid foundation for building your tracker platform with real-time data collection, processing, and social features!
