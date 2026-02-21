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
          
          // Format date for display
          const formattedDate = new Date(reminder.next_reminder_at).toLocaleString('en-US', {
            timeZone: userTimezone,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })

          // Build description HTML if present
          const descriptionHtml = reminder.description
            ? `<p style="margin:8px 0 0 0;color:#546E7A;font-size:15px;line-height:1.6;">${reminder.description}</p>`
            : ''

          // Build the reminder notification email HTML
          const appUrl = Deno.env.get('APP_URL') || 'https://personal-diary-three.vercel.app'
          const reminderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: ${reminder.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF8C42 0%, #FFD166 100%); padding: 36px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">🔔</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600;">Reminder: ${reminder.title}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px 20px 30px;">
              <p style="margin: 0 0 16px; color: #2C3E50; font-size: 17px; line-height: 1.6;">Hi there,</p>
              <p style="margin: 0 0 20px; color: #546E7A; font-size: 16px; line-height: 1.6;">This is your reminder:</p>
              <div style="background: #F8F9FA; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0; border-left: 4px solid #FF8C42;">
                <p style="margin: 0; color: #2C3E50; font-size: 17px; font-weight: 600; line-height: 1.5;">${reminder.title}</p>${descriptionHtml}
              </div>
              <p style="margin: 0 0 24px; color: #90A4AE; font-size: 14px;">Set for: ${formattedDate}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 32px 30px; text-align: center;">
              <a href="${appUrl}/app" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFD166 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
                Open Diary &rarr;
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 20px 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0 0 8px; color: #90A4AE; font-size: 13px;">
                Sent from <span style="color: #FF8C42; font-weight: 600;">Noted</span> - Your Personal Diary
              </p>
              <p style="margin: 0; color: #90A4AE; font-size: 12px;">
                <a href="${appUrl}/app/settings" style="color: #FF8C42; text-decoration: none;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

          // Add reminder to email queue for processing
          const { error: queueError } = await supabaseClient
            .from('email_queue')
            .insert({
              user_id: reminder.user_id,
              recipient_email: userEmail,
              email_type: 'reminder_notification',
              subject: `🔔 Reminder: ${reminder.title}`,
              html_body: reminderHtml,
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
