import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    console.log('🔄 Vercel cron triggered at', new Date().toISOString())

    // Call all three Supabase edge functions:
    // 1. quick-handler (email-reminders): processes daily/weekly email reminders from email_queue
    // 2. send-reminder-notifications: processes user-created reminders (once/daily/weekly/custom)
    // 3. process-email-queue: sends all queued emails via SMTP
    // NOTE: This runs once/day on Vercel free tier as a safety net.
    //       Primary email processing is handled by Supabase pg_cron (every 5 min).
    const [quickHandlerResponse, reminderNotifResponse, emailQueueResponse] = await Promise.all([
      // Process email reminders via quick-handler (slug for email-reminders function)
      fetch(
        `${supabaseUrl}/functions/v1/quick-handler`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey,
          },
          body: JSON.stringify({ timestamp: new Date().toISOString() }),
        }
      ),
      // Process user-created reminders (once, daily, weekly, custom)
      fetch(
        `${supabaseUrl}/functions/v1/send-reminder-notifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey,
          },
          body: JSON.stringify({ timestamp: new Date().toISOString() }),
        }
      ),
      // Process email queue (sends all pending emails)
      fetch(
        `${supabaseUrl}/functions/v1/process-email-queue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey,
          },
        }
      ),
    ])

    const quickHandlerData = await quickHandlerResponse.json()
    const reminderNotifData = await reminderNotifResponse.json()
    const emailQueueData = await emailQueueResponse.json()

    console.log('✅ Quick-handler response:', quickHandlerData)
    console.log('✅ Reminder notifications response:', reminderNotifData)
    console.log('✅ Email queue response:', emailQueueData)

    return NextResponse.json({
      success: true,
      message: 'Reminders and email queue processed successfully',
      quickHandler: {
        status: quickHandlerResponse.status,
        data: quickHandlerData,
      },
      reminderNotifications: {
        status: reminderNotifResponse.status,
        data: reminderNotifData,
      },
      emailQueue: {
        status: emailQueueResponse.status,
        data: emailQueueData,
      },
    })
  } catch (error: any) {
    console.error('Error triggering reminders:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reminders', details: error.message },
      { status: 500 }
    )
  }
}
