import { NextRequest, NextResponse } from 'next/server'
import { TrackerEngine } from '@/lib/trackers/engine'

const engine = new TrackerEngine()

// GET /api/trackers - Get all public trackers
export async function GET() {
  try {
    const result = await engine.getPublicTrackers()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      trackers: result.trackers
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trackers' },
      { status: 500 }
    )
  }
}

// POST /api/trackers - Create a new tracker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, name, description, isPublic } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    // Create the tracker
    const createResult = await engine.createTracker({
      prompt,
      name,
      description,
      isPublic: isPublic !== false
    })
    
    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error },
        { status: 500 }
      )
    }
    
    // Run the tracker immediately to get initial results
    const runResult = await engine.runTracker(createResult.tracker.id)
    
    return NextResponse.json({
      tracker: createResult.tracker,
      run: runResult
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to create tracker' },
      { status: 500 }
    )
  }
}
