/**
 * AI Processing API Route
 * Handles entry analysis (sentiment + embeddings)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeEntry } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const { entryId, content, autoSave = true } = await request.json()

    if (!entryId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify entry belongs to user
    const { data: entry, error: entryError } = await supabase
      .from('diary_entries')
      .select('id, user_id')
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    if (entry.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Analyze entry
    const result = await analyzeEntry(entryId, content, autoSave)

    return NextResponse.json({
      success: true,
      sentiment: result.sentiment,
      embeddingGenerated: result.embedding !== null,
    })
  } catch (error) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Processing API',
    version: '1.0.0',
    endpoints: {
      POST: 'Analyze entry with sentiment and embeddings',
    },
  })
}
