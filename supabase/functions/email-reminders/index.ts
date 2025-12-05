import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { generateDailyReminderEmail, generateWeeklySummaryEmail, generateStreakMilestoneEmail } from './templates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') 
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') 
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') 
const APP_URL = Deno.env.get('APP_URL') 

interface EmailJob {
  user_id: string
  email: string
  email_type: 'daily_reminder' | 'weekly_summary'
}

// Configure Gmail SMTP client
const smtpClient = new SMTPClient({
  connection: {
    hostname: 'smtp.gmail.com',
    port: 465,
    tls: true,
    auth: {
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    },
  },
})

serve(async (req) => {
  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get current time
    const now = new Date()

    // Fetch pending emails that are due
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select(`
        id,
        user_id,
        email_type,
        email
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50) // Process 50 at a time to avoid timeouts

    if (fetchError) {
      throw fetchError
    }

    // Process each email
    const results = await Promise.all(
      (pendingEmails || []).map(async (emailJob: any) => {
        try {
          // Get user settings and profile
          const { data: settings } = await supabase
            .from('user_settings')
            .select('email_reminders_enabled, email_frequency')
            .eq('user_id', emailJob.user_id)
            .single()

          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', emailJob.user_id)
            .single()

          // Skip if user disabled reminders
          if (!settings?.email_reminders_enabled) {
            await supabase
              .from('email_queue')
              .update({ status: 'failed', error_message: 'User disabled reminders' })
              .eq('id', emailJob.id)
            return { success: false, reason: 'disabled' }
          }

          // Get user's streak data
          const { data: streak } = await supabase
            .from('streaks')
            .select('current_streak, total_entries')
            .eq('user_id', emailJob.user_id)
            .single()

          // Generate beautiful HTML email content
          let emailHtml = ''
          let emailSubject = ''
          
          const templateProps = {
            userName: profile?.name,
            currentStreak: streak?.current_streak || 0,
            totalEntries: streak?.total_entries || 0,
            appUrl: APP_URL,
          }
          
          if (emailJob.email_type === 'daily_reminder') {
            emailHtml = generateDailyReminderEmail(templateProps)
            emailSubject = '📝 Daily Journaling Reminder'
          } else if (emailJob.email_type === 'weekly_summary') {
            emailHtml = generateWeeklySummaryEmail(templateProps)
            emailSubject = '📊 Your Weekly Journaling Summary'
          } else if (emailJob.email_type === 'streak_milestone') {
            emailHtml = generateStreakMilestoneEmail(templateProps)
            emailSubject = `🎉 ${streak?.current_streak}-Day Streak Milestone!`
          }

          // Send email via Gmail SMTP
          await smtpClient.send({
            from: GMAIL_USER,
            to: emailJob.email || '',
            subject: emailSubject,
            html: emailHtml,
          })
          
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: now.toISOString() })
            .eq('id', emailJob.id)

          return { success: true, email: emailJob.email }
        } catch (error: any) {
          // Mark as failed
          await supabase
            .from('email_queue')
            .update({ 
              status: 'failed', 
              error_message: error.message 
            })
            .eq('id', emailJob.id)

          return { success: false, error: error.message }
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})