import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheUtils, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

/**
 * GET /api/entries
 * Fetch all entries for the authenticated user
 * Uses Redis cache for faster responses
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get from Redis cache first
    const cacheKey = CACHE_KEYS.ENTRIES(user.id)
    const cachedEntries = await cacheUtils.get(cacheKey)
    
    if (cachedEntries) {
      console.log('✅ Cache hit for entries')
      return NextResponse.json({ 
        data: cachedEntries, 
        cached: true 
      })
    }

    // Cache miss - fetch from database
    console.log('❌ Cache miss - fetching from database')
    const { data: entries, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Store in cache for 5 minutes
    await cacheUtils.set(cacheKey, entries, CACHE_TTL.MEDIUM)

    return NextResponse.json({ 
      data: entries, 
      cached: false 
    })
  } catch (error: any) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/entries
 * Create a new entry
 * Invalidates relevant caches
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Create entry
    const { data: entry, error } = await supabase
      .from('entries')
      .insert([{ ...body, user_id: user.id }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate caches - data has changed!
    await cacheUtils.del(CACHE_KEYS.ENTRIES(user.id))
    await cacheUtils.del(CACHE_KEYS.ANALYTICS(user.id))
    await cacheUtils.del(CACHE_KEYS.STREAKS(user.id))
    console.log('🗑️ Cache invalidated after new entry')

    return NextResponse.json({ data: entry })
  } catch (error: any) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
