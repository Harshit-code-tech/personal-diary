import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''

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
        users:user_id (
          email
        )
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
          // Get user settings
          const { data: settings } = await supabase
            .from('user_settings')
            .select('email_reminders_enabled, email_frequency')
            .eq('user_id', emailJob.user_id)
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

          // Generate email content
          const emailContent = generateEmailContent(
            emailJob.email_type,
            streak?.current_streak || 0,
            streak?.total_entries || 0
          )

          // Send email via Gmail SMTP
          await smtpClient.send({
            from: GMAIL_USER,
            to: emailJob.users?.email || '',
            subject: emailJob.email_type === 'daily_reminder' 
              ? '📝 Daily Journaling Reminder' 
              : '📊 Your Weekly Journaling Summary',
            content: emailContent,
            html: emailContent.replace(/\n/g, '<br>'),
          })
          
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: now.toISOString() })
            .eq('id', emailJob.id)

          return { success: true, email: emailJob.users?.email }
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

function generateEmailContent(
  type: 'daily_reminder' | 'weekly_summary',
  currentStreak: number,
  totalEntries: number
): string {
  if (type === 'daily_reminder') {
    return `
      📝 Daily Journaling Reminder
      
      Hi there! 👋
      
      It's time to reflect on your day and add a new entry to your journal.
      
      ${currentStreak > 0 ? `🔥 You're on a ${currentStreak}-day streak! Keep it going!` : ''}
      
      Take a few minutes to write about:
      • What went well today?
      • What did you learn?
      • How are you feeling?
      
      Click here to start writing: [Your App URL]/app/new
      
      Keep journaling! 💙
    `
  } else {
    return `
      📊 Your Weekly Journaling Summary
      
      Hi there! 👋
      
      Here's your journaling progress this week:
      
      📝 Total Entries: ${totalEntries}
      🔥 Current Streak: ${currentStreak} days
      
      ${currentStreak >= 7 ? '🎉 Amazing! You journaled every day this week!' : 'Keep up the great work!'}
      
      Reflection is a powerful tool for personal growth. Keep it up!
      
      View your calendar: [Your App URL]/app/calendar
      
      Happy journaling! 💙
    `
  }
}
