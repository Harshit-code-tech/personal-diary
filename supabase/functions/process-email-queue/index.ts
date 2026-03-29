import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://personal-diary-three.vercel.app'

// Batch size - process fewer emails per invocation to avoid timeouts
const BATCH_SIZE = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailQueueItem {
  id: string
  user_id: string
  email_type: 'daily_reminder' | 'weekly_summary' | 'inactive_user' | 'reminder_notification'
  recipient_email: string
  subject: string
  html_body: string
  scheduled_for: string
  status: 'pending' | 'sent' | 'failed'
  retry_count: number
  last_error: string | null
}

// Generate HTML content by querying database directly (when database function fails)
async function generateHTMLContent(
  supabase: any,
  userId: string,
  emailType: string,
  recipientEmail: string
): Promise<string> {
  // Get user's actual name from profiles + settings fallback
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single()

  const { data: settingsData } = await supabase
    .from('user_settings')
    .select('username')
    .eq('user_id', userId)
    .single()
  
  const userName = settingsData?.username || profileData?.name || recipientEmail.split('@')[0]
  
  if (emailType === 'weekly_summary') {
    // Query actual user data
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single()
    
    // Get actual count of entries this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: entriesData } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())
      .is('deleted_at', null)
    
    const currentStreak = streakData?.current_streak || 0
    const entriesThisWeek = entriesData?.length || 0
    
    const streakMessage = currentStreak >= 7 
      ? `<tr>
          <td style="padding: 0 40px 20px 40px;">
            <div style="background: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; color: #E65100; font-size: 15px; line-height: 1.6;">
                🔥 <strong>Amazing!</strong> You're on a ${currentStreak}-day streak! Keep the momentum going!
              </p>
            </div>
          </td>
        </tr>`
      : ''
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f2f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f2f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center;">
              <div style="font-size: 56px; margin-bottom: 16px;">📊</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Your Weekly Summary</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 12px 0; font-weight: 500;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="font-size: 16px; color: #666; margin: 0 0 32px 0; line-height: 1.6;">
                Here's how your journaling week went. Keep up the great work!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="padding: 24px; background: #f8f9ff; border-radius: 12px; text-align: center;">
                    <div style="font-size: 48px; color: #667eea; font-weight: 700; margin-bottom: 8px;">${entriesThisWeek}</div>
                    <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Entries This Week</div>
                  </td>
                  <td width="16"></td>
                  <td width="50%" style="padding: 24px; background: #faf8ff; border-radius: 12px; text-align: center;">
                    <div style="font-size: 48px; color: #764ba2; font-weight: 700; margin-bottom: 8px;">🔥 ${currentStreak}</div>
                    <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Day Streak</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${streakMessage}
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${APP_URL}/app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                📝 Continue Journaling →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: #f8f9fa; padding: 24px 40px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #999; font-size: 13px; text-align: center;">
                You're receiving this because you enabled weekly summaries.
              </p>
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                Sent from Noted - Your Personal Diary
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
  
  if (emailType === 'streak_milestone') {
    // Get streak data
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single()
    
    const currentStreak = streakData?.current_streak || 0
    
    let emoji = '🔥'
    let title = 'Streak Milestone!'
    let message = 'Keep the fire burning!'
    let color = '#FF6B35'
    
    if (currentStreak >= 365) {
      emoji = '🎉'
      title = 'ONE YEAR STREAK!'
      message = 'An entire year of journaling! You\'re a legend!'
      color = '#FFD700'
    } else if (currentStreak >= 90) {
      emoji = '👑'
      title = '90-Day Streak!'
      message = 'Three months of dedication! You\'re a journaling champion!'
      color = '#9b59b6'
    } else if (currentStreak >= 30) {
      emoji = '🏆'
      title = '30-Day Streak!'
      message = 'A full month! This is becoming second nature!'
      color = '#e67e22'
    } else if (currentStreak >= 14) {
      emoji = '💎'
      title = '2-Week Streak!'
      message = 'Two weeks strong! You\'re building a great habit!'
      color = '#3498db'
    } else if (currentStreak >= 7) {
      emoji = '🌟'
      title = '7-Day Streak!'
      message = 'One week of consistent journaling!'
      color = '#2ecc71'
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f2f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f2f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: ${color}; padding: 48px 40px; text-align: center;">
              <div style="font-size: 72px; margin-bottom: 16px;">${emoji}</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 12px 0; font-weight: 500;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="font-size: 16px; color: #666; margin: 0 0 32px 0; line-height: 1.6;">
                ${message}
              </p>
              <div style="text-align: center; padding: 32px; background: #f8f9ff; border-radius: 12px;">
                <div style="font-size: 64px; color: ${color}; font-weight: 700; margin-bottom: 8px;">${currentStreak}</div>
                <div style="font-size: 18px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Days in a Row!</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${APP_URL}/app" style="display: inline-block; background: ${color}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Keep Going! →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: #f8f9fa; padding: 24px 40px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                Sent from Noted - Your Personal Diary
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
  
  if (emailType === 'daily_reminder') {
    // Random writing prompt
    const prompts = [
      'What was the highlight of your day? What are you grateful for?',
      'What are three things you\'re grateful for today?',
      'What went well today? Celebrate your wins, big or small.',
      'What did you learn about yourself today?',
      'What are your intentions for tomorrow?',
      'How do you want to feel by the end of the week?',
      'What\'s one small thing that brought you joy recently?',
      'What challenges did you face, and how did you overcome them?',
      'Describe a moment today that made you smile.',
      'What would you tell your future self about today?'
    ]
    const prompt = prompts[Math.floor(Math.random() * prompts.length)]

    // Get streak data
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single()
    
    const currentStreak = streakData?.current_streak || 0
    
    const streakHtml = currentStreak > 0
      ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); border-radius: 12px; padding: 20px; text-align: center;">
                <span style="font-size: 28px;">🔥</span>
                <p style="margin: 8px 0 0 0; color: #2C3E50; font-size: 18px; font-weight: 600;">${currentStreak}-day streak!</p>
                <p style="margin: 4px 0 0 0; color: #2C3E50; font-size: 13px;">Keep the momentum going!</p>
              </div>
            </td>
          </tr>`
      : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Journal Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4C1 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px; font-weight: 600;">Daily Journal Reminder</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <p style="margin: 0 0 20px; color: #2C3E50; font-size: 18px; line-height: 1.6;">Hi ${userName}! 👋</p>
              <p style="margin: 0 0 24px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                It's time to reflect on your day and write in your journal.
                Taking a few moments to document your thoughts, feelings, and experiences can help you:
              </p>
              <ul style="color: #546E7A; line-height: 2; font-size: 15px; padding-left: 20px; margin: 0 0 24px 0;">
                <li>Process your emotions and gain clarity</li>
                <li>Track your personal growth over time</li>
                <li>Preserve memories and important moments</li>
                <li>Reduce stress and improve mental wellbeing</li>
              </ul>
            </td>
          </tr>${streakHtml}
          <!-- Writing Prompt -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background: #FFF9E6; border-left: 4px solid #D4AF37; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #7A6A2E; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Writing Prompt:</strong> ${prompt}
                </p>
              </div>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="${APP_URL}/app/new" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941A 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">
                Start Writing &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 20px 32px; text-align: center;">
              <p style="margin: 0; color: #90A4AE; font-size: 14px;">Take a moment for yourself today 💙</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 24px 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0 0 8px; color: #90A4AE; font-size: 13px;">You're receiving this because you enabled daily reminders</p>
              <p style="margin: 0; color: #90A4AE; font-size: 13px;">
                <a href="${APP_URL}/app/settings" style="color: #D4AF37; text-decoration: none;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
  
  // Simple fallback for other email types
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f2f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f2f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Notification from Noted</h2>
              <p style="font-size: 16px; color: #666; margin: 0 0 24px 0; line-height: 1.6;">
                Hi <strong>${userName}</strong>, you have a new notification from your personal diary.
              </p>
              <a href="${APP_URL}/app" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
                View Your Diary →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Create SMTP client on-demand with timeout
async function sendEmailWithTimeout(
  recipient: string,
  subject: string,
  htmlBody: string,
  timeoutMs = 8000 // 8 second timeout
): Promise<void> {
  // Validate inputs before creating SMTP client
  if (!recipient || !recipient.includes('@')) {
    throw new Error(`Invalid recipient email: ${recipient}`)
  }
  
  if (!subject || subject.trim() === '') {
    throw new Error('Email subject is empty')
  }
  
  if (!htmlBody || htmlBody.trim() === '') {
    throw new Error('Email HTML body is empty or null')
  }

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error('SMTP credentials not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing)')
  }

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

  try {
    // Strip trailing whitespace from all lines to prevent =20 in quoted-printable encoding
    const cleanedHtml = htmlBody.replace(/ +$/gm, '').replace(/\t+$/gm, '')
    
    const sendPromise = smtpClient.send({
      from: `Noted <${GMAIL_USER}>`,
      to: recipient,
      subject: subject,
      content: `${subject}\n\nPlease view this email in an HTML-capable email client.`,
      html: cleanedHtml,
    })

    // Race between send and timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout after 8s')), timeoutMs)
    )

    await Promise.race([sendPromise, timeoutPromise])
  } finally {
    try {
      await smtpClient.close()
    } catch {
      // Ignore close errors
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Simple auth check - just ensure a Bearer token is present
    // This function is internal and should only be called by:
    // 1. Vercel cron job (with service role key)
    // 2. Supabase pg_cron (internal)
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Unauthorized: Missing Authorization header')
      console.error('Headers received:', {
        hasAuth: !!authHeader,
        authPrefix: authHeader?.substring(0, 10),
        hasApiKey: !!req.headers.get('apikey'),
      })
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    console.log('✅ Authorization header present')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()

    // Fetch pending emails that are due (smaller batch to avoid timeouts)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .lt('retry_count', 3) // Max 3 retry attempts
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) {
      throw fetchError
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending emails to process',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${pendingEmails.length} pending emails...`)

    // Log what we received for debugging
    console.log('Sample email data:', {
      id: pendingEmails[0]?.id,
      email_type: pendingEmails[0]?.email_type,
      recipient: pendingEmails[0]?.recipient_email,
      subject: pendingEmails[0]?.subject,
      html_body_length: pendingEmails[0]?.html_body?.length || 0,
      html_body_is_null: pendingEmails[0]?.html_body === null,
      html_body_preview: pendingEmails[0]?.html_body?.substring(0, 100) || 'NULL',
    })

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (emailItem: EmailQueueItem) => {
        try {
          // Always regenerate weekly summary HTML from live data to avoid stale/default values.
          // For other email types, generate only when html_body is missing.
          let htmlToSend = emailItem.html_body
          let usedFallback = false

          if (emailItem.email_type === 'weekly_summary' || !htmlToSend || htmlToSend.trim() === '') {
            console.warn(`⚠️ Email ID ${emailItem.id} has NULL html_body. Generating HTML from database. Email type: ${emailItem.email_type}`)
            
            // Query database and generate real HTML content
            htmlToSend = await generateHTMLContent(
              supabase,
              emailItem.user_id,
              emailItem.email_type,
              emailItem.recipient_email
            )
            usedFallback = true
            
            // Update the email_queue with the generated HTML
            await supabase
              .from('email_queue')
              .update({ html_body: htmlToSend })
              .eq('id', emailItem.id)
          }

          if (!emailItem.recipient_email || !emailItem.subject) {
            throw new Error(`Email missing required fields (recipient or subject). ID: ${emailItem.id}`)
          }

          // Send email with timeout protection
          await sendEmailWithTimeout(
            emailItem.recipient_email,
            emailItem.subject,
            htmlToSend
          )

          console.log(`✅ Email sent successfully to ${emailItem.recipient_email}${usedFallback ? ' (generated HTML from database)' : ''}`)

          // Update email status to 'sent'
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: now.toISOString(),
              last_error: null,
            })
            .eq('id', emailItem.id)

          // Log successful delivery (non-critical)
          try {
            await supabase
              .from('email_logs')
              .insert({
                user_id: emailItem.user_id,
                email_type: emailItem.email_type,
                recipient: emailItem.recipient_email,
                status: 'sent',
                subject: emailItem.subject,
              })
          } catch (logErr) {
            console.warn('⚠️ Could not log email delivery:', logErr)
          }

          return { success: true, email: emailItem.recipient_email, id: emailItem.id }
        } catch (error) {
          console.error(`❌ Failed to send email to ${emailItem.recipient_email}:`, error)

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const newRetryCount = emailItem.retry_count + 1

          // Update email with error and increment retry count
          await supabase
            .from('email_queue')
            .update({
              status: newRetryCount >= 3 ? 'failed' : 'pending',
              retry_count: newRetryCount,
              last_error: errorMessage,
              updated_at: now.toISOString(),
            })
            .eq('id', emailItem.id)

          // Log failed delivery (non-critical)
          try {
            await supabase
              .from('email_logs')
              .insert({
                user_id: emailItem.user_id,
                email_type: emailItem.email_type,
                recipient: emailItem.recipient_email,
                status: 'failed',
                subject: emailItem.subject,
                error_message: errorMessage,
              })
          } catch (logErr) {
            console.warn('⚠️ Could not log email failure:', logErr)
          }

          return { 
            success: false, 
            email: emailItem.recipient_email, 
            id: emailItem.id,
            error: errorMessage,
            retryCount: newRetryCount 
          }
        }
      })
    )

    // Summarize results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

    console.log(`📊 Email processing complete: pending=${pendingEmails.length}, sent=${successful}, failed=${failed}`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingEmails.length,
        successful,
        failed,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' }),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing email queue:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
  // No finally block - we close connections per-email now
})
