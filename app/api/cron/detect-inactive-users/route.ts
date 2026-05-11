import { NextRequest, NextResponse } from 'next/server'
import { getApiError } from '@/lib/api-utils'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server is missing Supabase configuration' }, { status: 500 })
    }

    // Call Supabase edge function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/detect-inactive-users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Inactive users detected successfully',
      data,
    })
  } catch (error: any) {
    console.error('Error detecting inactive users:', error)
    return NextResponse.json(
      { error: getApiError(error) },
      { status: 500 }
    )
  }
}
