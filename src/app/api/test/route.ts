import { NextResponse } from 'next/server'
import { FirecrawlService } from '@/lib/services/firecrawl'

export async function GET() {
  try {
    // Test that environment variables are loaded
    const hasFirecrawlKey = !!process.env.FIRECRAWL_API_KEY
    const hasExaKey = !!process.env.EXA_API_KEY
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    
    // Test Firecrawl connection
    let firecrawlStatus = 'Not tested'
    if (hasFirecrawlKey) {
      const firecrawl = new FirecrawlService()
      const result = await firecrawl.search('test', 1)
      firecrawlStatus = result.success ? 'Connected' : 'Failed'
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        firecrawl: {
          hasKey: hasFirecrawlKey,
          status: firecrawlStatus
        },
        exa: {
          hasKey: hasExaKey,
          status: hasExaKey ? 'Ready' : 'No key'
        },
        openai: {
          hasKey: hasOpenAIKey,
          status: hasOpenAIKey ? 'Ready' : 'No key'
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
