import { NextRequest, NextResponse } from 'next/server'
import { getApiError } from '@/lib/api-utils'

export const runtime = 'edge'

async function parseJsonSafely(response: Response) {
  try {
    return await response.json()
  } catch {
    return { error: 'Non-JSON response body' }
  }
}

async function callEmailReminderFunction(
  supabaseUrl: string,
  headers: Record<string, string>,
  body: string
) {
  const configuredName = process.env.SUPABASE_EMAIL_REMINDERS_FUNCTION?.trim()
  const candidates = [configuredName, 'quick-handler', 'email-reminders']
    .filter((v): v is string => !!v)
    .filter((name, index, all) => all.indexOf(name) === index)

  let lastResponse: Response | null = null
  let lastFunction = ''

  for (const functionName of candidates) {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body,
    })

    lastResponse = response
    lastFunction = functionName

    // Fallback only when the function endpoint is missing.
    if (response.status !== 404) {
      return { response, functionName }
    }
  }

  return { response: lastResponse, functionName: lastFunction }
}

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
    // 1. email-reminders: processes daily/weekly email reminders from email_queue
    // 2. send-reminder-notifications: processes user-created reminders (once/daily/weekly/custom)
    // 3. process-email-queue: sends all queued emails via SMTP
    // NOTE: This runs once/day on Vercel free tier as a safety net.
    //       Primary email processing is handled by Supabase pg_cron (every 5 min).
    const functionHeaders = {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'apikey': serviceKey,
    }

    const requestBody = JSON.stringify({ timestamp: new Date().toISOString() })

    const [emailRemindersResult, reminderNotifResponse, emailQueueResponse] = await Promise.all([
      // Process email reminders. Production may still use the old function path "quick-handler".
      callEmailReminderFunction(supabaseUrl, functionHeaders, requestBody),
      // Process user-created reminders (once, daily, weekly, custom)
      fetch(
        `${supabaseUrl}/functions/v1/send-reminder-notifications`,
        {
          method: 'POST',
          headers: functionHeaders,
          body: requestBody,
        }
      ),
      // Process email queue (sends all pending emails)
      fetch(
        `${supabaseUrl}/functions/v1/process-email-queue`,
        {
          method: 'POST',
          headers: functionHeaders,
        }
      ),
    ])

    const emailRemindersResponse = emailRemindersResult.response
    const emailRemindersFunction = emailRemindersResult.functionName

    if (!emailRemindersResponse) {
      throw new Error('Could not reach any email reminder function endpoint')
    }

    const emailRemindersData = await parseJsonSafely(emailRemindersResponse)
    const reminderNotifData = await parseJsonSafely(reminderNotifResponse)
    const emailQueueData = await parseJsonSafely(emailQueueResponse)

    console.log(`✅ Email reminders response (${emailRemindersFunction}):`, emailRemindersData)
    console.log('✅ Reminder notifications response:', reminderNotifData)
    console.log('✅ Email queue response:', emailQueueData)

    return NextResponse.json({
      success: true,
      message: 'Reminders and email queue processed successfully',
      emailReminders: {
        function: emailRemindersFunction,
        status: emailRemindersResponse.status,
        data: emailRemindersData,
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
      { error: getApiError(error) },
      { status: 500 }
    )
  }
}
