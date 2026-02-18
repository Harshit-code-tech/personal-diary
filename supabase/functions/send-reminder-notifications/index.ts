// Supabase Edge Function for sending reminder notifications
// This function should be scheduled to run daily (e.g., via cron job or Supabase pg_cron)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Reminder {
  id: string
  user_id: string
  title: string
  description: string | null
  next_reminder_at: string
  reminder_type: 'once' | 'daily' | 'weekly' | 'custom'
  custom_days: string[] | null
  repeat_until: string | null
  is_active: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Unauthorized: Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time
    const now = new Date()

    // Fetch reminders that are due (past or current time)
    // This catches any reminders that were missed or are currently due
    const { data: reminders, error } = await supabaseClient
      .from('reminders')
      .select('id, user_id, title, description, next_reminder_at, reminder_type, custom_days, repeat_until, is_active')
      .eq('is_active', true)
      .lte('next_reminder_at', now.toISOString())

    if (error) {
      throw error
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No due reminders found',
          processed: 0,
          checkedAt: now.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${reminders.length} due reminder(s) to process...`)

    // Fetch user emails AND timezones for all reminders
    const userIds = [...new Set(reminders.map(r => r.user_id))]
    const { data: users, error: userError } = await supabaseClient
      .auth.admin.listUsers()
    
    if (userError) {
      console.error('Error fetching users:', userError)
      throw userError
    }

    const userEmailMap = new Map(
      users.users.map(u => [u.id, u.email])
    )
    
    // Fetch user timezones from user_settings
    const { data: userSettings } = await supabaseClient
      .from('user_settings')
      .select('user_id, timezone')
      .in('user_id', userIds)
    
    const userTimezoneMap = new Map(
      userSettings?.map(s => [s.user_id, s.timezone || 'UTC']) || []
    )

    let queuedCount = 0
    let skippedCount = 0
    const notifications = await Promise.all(
      reminders.map(async (reminder: any) => {
        try {
          const userEmail = userEmailMap.get(reminder.user_id)
          const userTimezone: string = (userTimezoneMap.get(reminder.user_id) as string) || 'UTC'
          
          if (!userEmail) {
            console.error(`No email found for user ${reminder.user_id}`)
            skippedCount += 1
            return {
              success: false,
              reminderId: reminder.id,
              error: 'User email not found'
            }
          }
          
          // Add reminder to email queue for processing
          const { error: queueError } = await supabaseClient
            .from('email_queue')
            .insert({
              user_id: reminder.user_id,
              recipient_email: userEmail,
              email_type: 'reminder_notification',
              subject: `🔔 Reminder: ${reminder.title}`,
              html_body: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <title>Reminder</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background-color: #ffffff;">
                  <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2C3E50; margin: 0 0 16px 0;">🔔 Reminder: ${reminder.title}</h2>
                    <p style="color: #2C3E50; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">Hi there,</p>
                    <p style="color: #2C3E50; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">This is your reminder:</p>
                    <p style="color: #2C3E50; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0; font-weight: 600;">${reminder.title}</p>
                    ${reminder.description ? `<p style="color: #546E7A; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">${reminder.description}</p>` : ''}
                    <p style="color: #90A4AE; font-size: 14px; margin: 0 0 24px 0;">
                      Set for: ${new Date(reminder.next_reminder_at).toLocaleString('en-US', { 
                        timeZone: userTimezone,
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })} (${userTimezone})
                    </p>
                    <p style="color: #90A4AE; font-size: 12px; margin: 40px 0 0 0;">
                      Sent from Noted - Your Personal Diary
                    </p>
                  </div>
                </body>
                </html>
              `,
              status: 'pending',
              scheduled_for: new Date().toISOString(),
            })
          
          if (queueError) {
            console.error('Error adding to email queue:', queueError)
            throw queueError
          }
          
            queuedCount += 1
          console.log(`✅ Added reminder notification to email queue for ${userEmail}:`, {
            title: reminder.title,
            description: reminder.description,
            date: reminder.next_reminder_at,
          })
          
          // Handle recurring reminders vs one-time reminders
          if (reminder.reminder_type === 'once') {
            // Deactivate one-time reminders after sending
            await supabaseClient
              .from('reminders')
              .update({ 
                is_active: false,
              })
              .eq('id', reminder.id)
            
            console.log(`Deactivated one-time reminder: ${reminder.id}`)
          } else {
            // For recurring reminders (daily, weekly, custom), calculate next occurrence
            const nextDate = new Date(reminder.next_reminder_at)
            
            switch (reminder.reminder_type) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1)
                break
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7)
                break
              case 'custom': {
                // Find the next selected weekday from custom_days
                if (reminder.custom_days && reminder.custom_days.length > 0) {
                  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                  const currentDayIndex = nextDate.getDay() // 0=Sun through 6=Sat
                  const selectedIndices = reminder.custom_days
                    .map(d => dayNames.indexOf(d.toLowerCase()))
                    .filter(i => i >= 0)
                    .sort((a, b) => a - b)
                  
                  if (selectedIndices.length > 0) {
                    // Find next selected day AFTER current day
                    const nextIndex = selectedIndices.find(i => i > currentDayIndex)
                    const daysToAdd = nextIndex !== undefined
                      ? nextIndex - currentDayIndex
                      : 7 - currentDayIndex + selectedIndices[0] // Wrap to next week
                    nextDate.setDate(nextDate.getDate() + daysToAdd)
                  } else {
                    // Fallback: treat as daily
                    nextDate.setDate(nextDate.getDate() + 1)
                  }
                } else {
                  // No days selected, treat as daily
                  nextDate.setDate(nextDate.getDate() + 1)
                }
                break
              }
            }

            // Check repeat_until before scheduling next occurrence
            if (reminder.repeat_until && nextDate > new Date(reminder.repeat_until)) {
              // Past the end date — deactivate instead of rescheduling
              await supabaseClient
                .from('reminders')
                .update({ is_active: false })
                .eq('id', reminder.id)
              console.log(`Deactivated expired recurring reminder: ${reminder.id} (repeat_until: ${reminder.repeat_until})`)
            } else {
              // Schedule next occurrence
              await supabaseClient
                .from('reminders')
                .update({ next_reminder_at: nextDate.toISOString() })
                .eq('id', reminder.id)
              console.log(`Updated recurring reminder ${reminder.id} (${reminder.reminder_type}) to ${nextDate.toISOString()}`)
            }
          }

          return {
            success: true,
            reminderId: reminder.id,
            email: userEmail,
          }
        } catch (err: any) {
          console.error(`Failed to send notification for reminder ${reminder.id}:`, err)
          skippedCount += 1
          return {
            success: false,
            reminderId: reminder.id,
            error: err?.message || 'Unknown error',
          }
        }
      })
    )

    console.log(`📧 Reminder run summary: queued=${queuedCount}, skipped=${skippedCount}, total=${reminders.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
        queued: queuedCount,
        skipped: skippedCount,
        results: notifications,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in send-reminder-notifications:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
