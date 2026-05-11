import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheUtils, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'
import { entrySchema, formatZodErrors } from '@/lib/validation'
import { stripHtmlTags } from '@/lib/sanitize'
import { getApiError } from '@/lib/api-utils'
import { requireCsrf } from '@/lib/api-csrf'

/**
 * GET /api/entries
 * Fetch all entries for the authenticated user
 * Uses Redis cache for faster responses
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get from Redis cache first
    const cacheKey = CACHE_KEYS.ENTRIES(user.id)
    const cachedEntries = await cacheUtils.get(cacheKey)
    
    if (cachedEntries) {
      return NextResponse.json({ 
        data: cachedEntries, 
        cached: true 
      })
    }

    // Cache miss - fetch from database
    const { data: entries, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: getApiError(error) }, { status: 500 })
    }

    // Store in cache for 5 minutes
    await cacheUtils.set(cacheKey, entries, CACHE_TTL.MEDIUM)

    return NextResponse.json({ 
      data: entries, 
      cached: false 
    })
  } catch (error: any) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: getApiError(error) }, { status: 500 })
  }
}

/**
 * POST /api/entries
 * Create a new entry
 * Invalidates relevant caches
 */
export async function POST(request: Request) {
  try {
    const csrfError = await requireCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = entrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid entry data', details: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const sanitizedTitle = stripHtmlTags(parsed.data.title)
    const sanitizedContent = parsed.data.content.trim()
    const entryPayload = {
      ...parsed.data,
      title: sanitizedTitle,
      content: sanitizedContent,
      user_id: user.id,
    }
    
    // Create entry
    const { data: entry, error } = await supabase
      .from('entries')
      .insert([entryPayload])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: getApiError(error) }, { status: 500 })
    }

    // Invalidate caches - data has changed!
    await cacheUtils.del(CACHE_KEYS.ENTRIES(user.id))
    await cacheUtils.del(CACHE_KEYS.ANALYTICS(user.id))
    await cacheUtils.del(CACHE_KEYS.STREAKS(user.id))
    console.log('🗑️ Cache invalidated after new entry')

    return NextResponse.json({ data: entry })
  } catch (error: any) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: getApiError(error) }, { status: 500 })
  }
}
