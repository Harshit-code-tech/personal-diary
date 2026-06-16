import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { generateDailyReminderEmail, generateWeeklySummaryEmail, generateStreakMilestoneEmail } from './templates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') 
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? 'smtp-relay.brevo.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') ?? '587', 10)
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') ?? ''
const SMTP_FROM = Deno.env.get('SMTP_FROM') ?? ''
const APP_URL = Deno.env.get('APP_URL') 

// Log environment check on startup
console.log('🔍 Environment check:', {
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
  hasSmtpUser: !!SMTP_USER,
  hasSmtpPassword: !!SMTP_PASSWORD,
  hasSmtpFrom: !!SMTP_FROM,
  hasAppUrl: !!APP_URL,
})

interface EmailJob {
  user_id: string
  email: string
  email_type: 'daily_reminder' | 'weekly_summary' | 'inactive_user' | 'streak_milestone' | 'reminder_notification'
}

// Don't create SMTP client globally - create on demand to avoid startup crashes
// const smtpClient = new SMTPClient({...})  // REMOVED


serve(async (req) => {
  console.log('📧 Email reminders function called')
  
  // Validate authorization
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Unauthorized: Missing or invalid Authorization header')
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    // Validate environment variables first
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase credentials')
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error('❌ Missing SMTP credentials')
      throw new Error('Missing SMTP_USER or SMTP_PASSWORD - please set these secrets in Supabase dashboard')
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
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: false,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASSWORD,
        },
      },
    })

    console.log('✅ SMTP client created')


    // Process each email
    const results = await Promise.all(
      (pendingEmails || []).map(async (emailJob: any) => {
        try {
          // Get user settings to check notification preferences
          const { data: settings } = await supabase
            .from('user_settings')
            .select('email_reminders_enabled, weekly_summary_enabled, inactivity_emails_enabled, milestone_notifications_enabled')
            .eq('user_id', emailJob.user_id)
            .single()

          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', emailJob.user_id)
            .single()

          const { data: userSettings } = await supabase
            .from('user_settings')
            .select('username')
            .eq('user_id', emailJob.user_id)
            .single()

          // Skip if no email found
          if (!profile?.email) {
            await supabase
              .from('email_queue')
              .update({ status: 'failed', error_message: 'User email not found' })
              .eq('id', emailJob.id)
            return { success: false, reason: 'no_email' }
          }

          // Check the correct toggle based on the email type
          const isEnabled = (() => {
            switch (emailJob.email_type) {
              case 'daily_reminder': return settings?.email_reminders_enabled !== false
              case 'weekly_summary': return settings?.weekly_summary_enabled !== false
              case 'inactive_user': return settings?.inactivity_emails_enabled !== false
              case 'streak_milestone': return settings?.milestone_notifications_enabled !== false
              case 'reminder_notification': return true // custom reminders are always sent if active
              default: return true // unknown types pass through
            }
          })()

          if (!isEnabled) {
            await supabase
              .from('email_queue')
              .update({ status: 'failed', error_message: `User disabled ${emailJob.email_type} notifications` })
              .eq('id', emailJob.id)
            return { success: false, reason: 'disabled' }
          }

          // Get user's streak data
          const { data: streak } = await supabase
            .from('streaks')
            .select('current_streak')
            .eq('user_id', emailJob.user_id)
            .single()

          const { count: totalEntriesCount } = await supabase
            .from('entries')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', emailJob.user_id)
            .is('deleted_at', null)

          // Generate beautiful HTML email content
          let emailHtml = ''
          let emailSubject = ''
          
          const templateProps = {
            userName: userSettings?.username || profile?.name || profile?.email?.split('@')[0],
            currentStreak: streak?.current_streak || 0,
            totalEntries: totalEntriesCount || 0,
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
            from: `Noted <${SMTP_FROM}>`, // Display name with valid email
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