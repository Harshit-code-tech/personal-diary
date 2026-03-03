/**
 * Weekly Insights API Route
 * Generates and caches weekly summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeeklySummary, cacheWeeklyInsight } from '@/lib/ai/ai-service'

export async function GET(request: NextRequest) {
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

    // Generate weekly summary
    const summary = await getWeeklySummary(session.user.id)

    if (!summary) {
      return NextResponse.json({
        success: true,
        summary: null,
        message: 'No entries this week',
      })
    }

    // Extract entry IDs from the summary for caching
    // Get entries from last 7 days to cache with the insight
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: weekEntries } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', session.user.id)
      .gte('created_at', weekAgo.toISOString())

    const entryIds = weekEntries?.map((e) => e.id) || []
    
    // Cache the insight with entry IDs
    await cacheWeeklyInsight(session.user.id, summary, entryIds)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error('Weekly insights error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
