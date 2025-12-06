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
  is_active: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
      .select('id, user_id, title, description, next_reminder_at, reminder_type, is_active')
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

    // Fetch user emails for all reminders
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

    // Send notifications for each reminder
    const notifications = await Promise.all(
      reminders.map(async (reminder: any) => {
        try {
          const userEmail = userEmailMap.get(reminder.user_id)
          
          if (!userEmail) {
            console.error(`No email found for user ${reminder.user_id}`)
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
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #D4AF37; margin-top: 0;">🔔 Reminder</h2>
                    <h3 style="color: #2C3E50; margin-bottom: 16px;">${reminder.title}</h3>
                    ${reminder.description ? `<p style="color: #546E7A; line-height: 1.6; margin-bottom: 24px;">${reminder.description}</p>` : ''}
                    <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; border-left: 4px solid #D4AF37;">
                      <p style="margin: 0; color: #90A4AE; font-size: 14px;">
                        <strong>Scheduled for:</strong> ${new Date(reminder.next_reminder_at).toLocaleString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div style="margin-top: 24px; text-align: center;">
                      <a href="${Deno.env.get('APP_URL') || 'https://personal-diary-three.vercel.app'}/app" 
                         style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941A 100%); 
                                color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; 
                                font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">
                        Open Diary →
                      </a>
                    </div>
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E0E0E0; text-align: center;">
                      <p style="margin: 0; color: #90A4AE; font-size: 13px;">
                        <a href="${Deno.env.get('APP_URL') || 'https://personal-diary-three.vercel.app'}/app/reminders" 
                           style="color: #D4AF37; text-decoration: none;">Manage reminders</a>
                      </p>
                    </div>
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
          } else if (reminder.reminder_type !== 'custom') {
            // For recurring reminders, calculate next occurrence
            const nextDate = new Date(reminder.next_reminder_at)
            
            switch (reminder.reminder_type) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1)
                break
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7)
                break
            }

            // Update next occurrence
            await supabaseClient
              .from('reminders')
              .update({ 
                next_reminder_at: nextDate.toISOString(),
              })
              .eq('id', reminder.id)
            
            console.log(`Updated recurring reminder ${reminder.id} to ${nextDate.toISOString()}`)
          }

          return {
            success: true,
            reminderId: reminder.id,
            email: userEmail,
          }
        } catch (err: any) {
          console.error(`Failed to send notification for reminder ${reminder.id}:`, err)
          return {
            success: false,
            reminderId: reminder.id,
            error: err?.message || 'Unknown error',
          }
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
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
