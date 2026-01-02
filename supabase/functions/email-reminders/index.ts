import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { generateDailyReminderEmail, generateWeeklySummaryEmail, generateStreakMilestoneEmail } from './templates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') 
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') 
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') 
const APP_URL = Deno.env.get('APP_URL') 

// Log environment check on startup
console.log('🔍 Environment check:', {
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
  hasGmailUser: !!GMAIL_USER,
  hasGmailPassword: !!GMAIL_APP_PASSWORD,
  hasAppUrl: !!APP_URL,
})

interface EmailJob {
  user_id: string
  email: string
  email_type: 'daily_reminder' | 'weekly_summary'
}

// Don't create SMTP client globally - create on demand to avoid startup crashes
// const smtpClient = new SMTPClient({...})  // REMOVED


serve(async (req) => {
  console.log('📧 Email reminders function called')
  
  try {
    // Validate environment variables first
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase credentials')
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('❌ Missing Gmail credentials')
      throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD - please set these secrets in Supabase dashboard')
    }

    console.log('✅ All environment variables present')

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get current time
    const now = new Date()
    console.log('⏰ Current time:', now.toISOString())

    // Fetch pending emails that are due
    console.log('🔍 Querying email_queue table...')
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select(`
        id,
        user_id,
        email_type
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50) // Process 50 at a time to avoid timeouts

    if (fetchError) {
      console.error('❌ Database query error:', fetchError)
      throw fetchError
    }

    console.log(`📬 Found ${pendingEmails?.length || 0} pending emails`)

    // If no emails, return success
    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('✅ No pending emails to process')
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No pending emails'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Create SMTP client on-demand
    console.log('📮 Creating SMTP client...')
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

    console.log('✅ SMTP client created')


    // Process each email
    const results = await Promise.all(
      (pendingEmails || []).map(async (emailJob: any) => {
        try {
          // Get user settings and profile (including email)
          const { data: settings } = await supabase
            .from('user_settings')
            .select('email_reminders_enabled, email_frequency')
            .eq('user_id', emailJob.user_id)
            .single()

          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', emailJob.user_id)
            .single()

          // Skip if no email found
          if (!profile?.email) {
            await supabase
              .from('email_queue')
              .update({ status: 'failed', error_message: 'User email not found' })
              .eq('id', emailJob.id)
            return { success: false, reason: 'no_email' }
          }

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
            to: profile.email,
            subject: emailSubject,
            html: emailHtml,
          })
          
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: now.toISOString() })
            .eq('id', emailJob.id)

          return { success: true, email: profile.email }
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
    console.error('❌ FATAL ERROR in email-reminders function:')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        type: error?.constructor?.name,
        details: error?.toString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})