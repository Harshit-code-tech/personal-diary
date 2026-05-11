import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getApiError, requireCsrf } from '@/lib/api-utils'

const errorLogSchema = z.object({
  error_type: z.string().min(1).max(100),
  error_message: z.string().min(1).max(1000),
  error_stack: z.string().max(4000).optional().nullable(),
  path: z.string().max(2048).optional().nullable(),
  user_agent: z.string().max(512).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
})

const truncate = (value: string | null | undefined, limit: number) => {
  if (!value) return null
  return value.length > limit ? value.slice(0, limit) : value
}

export async function POST(request: Request) {
  const csrfError = await requireCsrf(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createUserClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = errorLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid error payload' },
        { status: 400 }
      )
    }

    if (parsed.data.metadata) {
      let metadataSize = 0
      try {
        metadataSize = JSON.stringify(parsed.data.metadata).length
      } catch {
        return NextResponse.json({ error: 'Invalid metadata payload' }, { status: 400 })
      }

      if (metadataSize > 4000) {
        return NextResponse.json({ error: 'Metadata payload too large' }, { status: 400 })
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server is missing Supabase configuration' }, { status: 500 })
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const userAgent = request.headers.get('user-agent') || parsed.data.user_agent || undefined

    const errorLog = {
      error_type: parsed.data.error_type,
      error_message: parsed.data.error_message,
      error_stack: truncate(parsed.data.error_stack, 4000) || undefined,
      user_id: user.id,
      path: truncate(parsed.data.path, 2048) || undefined,
      user_agent: truncate(userAgent, 512) || undefined,
      timestamp: new Date().toISOString(),
      metadata: parsed.data.metadata || undefined,
    }

    const { error } = await adminSupabase
      .from('error_logs')
      .insert(errorLog)

    if (error) {
      return NextResponse.json({ error: getApiError(error) }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: getApiError(error) }, { status: 500 })
  }
}
