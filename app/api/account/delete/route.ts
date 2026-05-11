import { NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getApiError } from '@/lib/api-utils'
import { requireCsrf } from '@/lib/api-csrf'

export async function DELETE(request: Request) {
  try {
    const csrfError = await requireCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createUserClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server is missing Supabase configuration' }, { status: 500 })
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey)

    // Defensive cleanup in case some tables are not configured with ON DELETE CASCADE.
    await Promise.allSettled([
      adminSupabase.from('entries').delete().eq('user_id', user.id),
      adminSupabase.from('people').delete().eq('user_id', user.id),
      adminSupabase.from('stories').delete().eq('user_id', user.id),
      adminSupabase.from('folders').delete().eq('user_id', user.id),
      adminSupabase.from('reminders').delete().eq('user_id', user.id),
      adminSupabase.from('email_queue').delete().eq('user_id', user.id),
      adminSupabase.from('email_logs').delete().eq('user_id', user.id),
      adminSupabase.from('streaks').delete().eq('user_id', user.id),
      adminSupabase.from('user_settings').delete().eq('user_id', user.id),
      adminSupabase.from('profiles').delete().eq('id', user.id),
    ])

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json({ error: getApiError(deleteError) }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: getApiError(error) }, { status: 500 })
  }
}