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
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/detect-inactive-users`,
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
      message: 'Inactive users detected successfully',
      data,
    })
  } catch (error: any) {
    console.error('Error detecting inactive users:', error)
    return NextResponse.json(
      { error: 'Failed to detect inactive users', details: error.message },
      { status: 500 }
    )
  }
}
