import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call Supabase edge function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-reminder-notifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Reminders triggered successfully',
      data,
    })
  } catch (error: any) {
    console.error('Error triggering reminders:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reminders', details: error.message },
      { status: 500 }
    )
  }
}
