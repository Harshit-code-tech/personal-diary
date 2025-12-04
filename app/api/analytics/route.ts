import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheUtils, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

/**
 * GET /api/analytics
 * Fetch analytics data for the authenticated user
 * Cached for 30 minutes since it's expensive to calculate
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try cache first (analytics is expensive!)
    const cacheKey = CACHE_KEYS.ANALYTICS(user.id)
    const cachedAnalytics = await cacheUtils.get(cacheKey)
    
    if (cachedAnalytics) {
      console.log('✅ Cache hit for analytics')
      return NextResponse.json({ 
        data: cachedAnalytics, 
        cached: true 
      })
    }

    // Cache miss - calculate analytics
    console.log('❌ Cache miss - calculating analytics')
    
    // Fetch all entries
    const { data: entries, error } = await supabase
      .from('entries')
      .select('id, title, content, entry_date, word_count, mood, created_at')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate analytics
    const totalEntries = entries?.length || 0
    const totalWords = entries?.reduce((sum, e) => sum + (e.word_count || 0), 0) || 0
    const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0

    // Mood distribution
    const moodCounts = entries?.reduce((acc: any, e) => {
      if (e.mood) {
        acc[e.mood] = (acc[e.mood] || 0) + 1
      }
      return acc
    }, {})
    const moodDistribution = Object.entries(moodCounts || {}).map(([mood, count]) => ({
      mood,
      count: count as number
    }))

    // Most productive hour
    const hours = entries?.reduce((acc: any, e) => {
      const hour = new Date(e.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})
    const mostProductiveHour = Object.entries(hours || {}).reduce(
      (max: any, [hour, count]: any) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 }
    ).hour

    const analytics = {
      totalEntries,
      totalWords,
      avgWordsPerEntry,
      moodDistribution,
      mostProductiveHour,
      lastUpdated: new Date().toISOString()
    }

    // Cache for 30 minutes (analytics changes slowly)
    await cacheUtils.set(cacheKey, analytics, CACHE_TTL.LONG)

    return NextResponse.json({ 
      data: analytics, 
      cached: false 
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
