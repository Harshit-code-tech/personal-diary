import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? 'smtp-relay.brevo.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') ?? '587', 10)
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') ?? ''
const SMTP_FROM = Deno.env.get('SMTP_FROM') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://personal-diary-three.vercel.app'

// Days of inactivity thresholds
const INACTIVITY_THRESHOLDS = {
  GENTLE_REMINDER: 3,    // 3 days
  ENCOURAGEMENT: 7,       // 1 week
  RE_ENGAGEMENT: 14,      // 2 weeks
  FINAL_CHECK_IN: 30      // 1 month
}

// SMTP client created per-request inside handler to avoid module-level boot failures

function generateInactiveUserEmail(userName: string, daysSinceLastEntry: number, appUrl: string): { subject: string; html: string } {
  let subject = ''
  let message = ''
  let emoji = ''

  if (daysSinceLastEntry >= INACTIVITY_THRESHOLDS.FINAL_CHECK_IN) {
    subject = "We miss you! 🌟 Come back to your diary"
    emoji = "🌟"
    message = `It's been ${daysSinceLastEntry} days since your last entry. Your thoughts and experiences are valuable - we'd love to have you back!`
  } else if (daysSinceLastEntry >= INACTIVITY_THRESHOLDS.RE_ENGAGEMENT) {
    subject = "Your diary is waiting for you 📖"
    emoji = "📖"
    message = `It's been ${daysSinceLastEntry} days since you last journaled. Life moves fast - capture these moments before they fade.`
  } else if (daysSinceLastEntry >= INACTIVITY_THRESHOLDS.ENCOURAGEMENT) {
    subject = "Keep your journaling streak alive! ✨"
    emoji = "✨"
    message = `You haven't written in ${daysSinceLastEntry} days. Even a few words can make a difference in preserving your memories.`
  } else {
    subject = "Time to check in 📝"
    emoji = "📝"
    message = `It's been ${daysSinceLastEntry} days since your last entry. Take a moment to reflect on your day.`
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #F4E8D1 0%, #E8D5B8 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #F4E8D1 0%, #E8D5B8 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5E3C 0%, #A67B5B 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 48px;">${emoji}</h1>
              <h2 style="margin: 20px 0 0 0; color: white; font-size: 28px; font-weight: 600;">${subject}</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #2C3E50; margin: 0 0 20px 0; line-height: 1.6;">
                Hi <strong>${userName || 'there'}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555; margin: 0 0 30px 0; line-height: 1.8;">
                ${message}
              </p>

              <div style="background: #FAF3E8; border-left: 4px solid #8B5E3C; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #2C3E50; font-size: 15px; line-height: 1.6;">
                  💡 <strong>Quick Tip:</strong> Even 5 minutes of journaling can help you process your day, reduce stress, and preserve memories that would otherwise be forgotten.
                </p>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${appUrl}/app/new" style="display: inline-block; background: linear-gradient(135deg, #8B5E3C 0%, #A67B5B 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(139, 94, 60, 0.3); transition: transform 0.2s;">
                  ✍️ Write an Entry
                </a>
              </div>

              <p style="font-size: 14px; color: #777; margin: 30px 0 0 0; line-height: 1.6; text-align: center;">
                Your entries are private and secure. Only you can see them.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #F8F9FA; padding: 30px; text-align: center; border-top: 1px solid #E9ECEF;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #6C757D;">
                <a href="${appUrl}/app" style="color: #8B5E3C; text-decoration: none; margin: 0 10px;">Dashboard</a> •
                <a href="${appUrl}/app/settings" style="color: #8B5E3C; text-decoration: none; margin: 0 10px;">Settings</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #ADB5BD;">
                Don't want these emails? <a href="${appUrl}/app/settings" style="color: #8B5E3C; text-decoration: none;">Update your preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return { subject, html }
}

serve(async (req) => {
  console.log('🔍 Detect inactive users function called')

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()

    // Create SMTP client per-request (avoids module-level boot failures)
    const smtpClient = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASSWORD,
        },
      },
    })

    // Calculate dates for different thresholds
    const dates = {
      gentle: new Date(now.getTime() - INACTIVITY_THRESHOLDS.GENTLE_REMINDER * 24 * 60 * 60 * 1000),
      encouragement: new Date(now.getTime() - INACTIVITY_THRESHOLDS.ENCOURAGEMENT * 24 * 60 * 60 * 1000),
      reengagement: new Date(now.getTime() - INACTIVITY_THRESHOLDS.RE_ENGAGEMENT * 24 * 60 * 60 * 1000),
      final: new Date(now.getTime() - INACTIVITY_THRESHOLDS.FINAL_CHECK_IN * 24 * 60 * 60 * 1000)
    }

    console.log('📅 Checking for inactive users since:', dates.gentle.toISOString())

    // Get all entries and build a last-entry map.
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('user_id, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (entriesError) {
      console.error('❌ Error fetching entries:', entriesError)
      throw entriesError
    }

    console.log(`📊 Found ${entries?.length || 0} total entries`)

    // Group by user and get last entry date
    const userLastEntry = new Map()
    entries?.forEach(entry => {
      if (!userLastEntry.has(entry.user_id)) {
        userLastEntry.set(entry.user_id, entry.created_at)
      }
    })

    // Include users with zero entries as well.
    const { data: authUsers, error: listUsersError } = await supabase.auth.admin.listUsers()
    if (listUsersError) {
      console.error('❌ Error fetching auth users:', listUsersError)
      throw listUsersError
    }

    const users = (authUsers?.users || []).map((u) => ({
      id: u.id,
      email: u.email || null,
      created_at: u.created_at,
      last_entry_date: userLastEntry.get(u.id) || null,
    }))

    console.log(`👥 Tracking ${users.length} users total (${userLastEntry.size} with entries)`)

    const emailsSent = []
    const errors = []

    for (const user of users || []) {
      try {
        // Check if user has inactivity/streak notifications enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('inactivity_emails_enabled')
          .eq('user_id', user.id)
          .single()

        if (settings && settings.inactivity_emails_enabled === false) {
          continue
        }

        // Get profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single()

        const recipientEmail = profile?.email || user.email
        if (!recipientEmail) {
          continue
        }

        // Calculate days since last entry
        const lastEntryDate = user.last_entry_date ? new Date(user.last_entry_date) : null
        const daysSinceLastEntry = lastEntryDate
          ? Math.floor((now.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))

        // Only send if they cross a threshold
        if (daysSinceLastEntry < INACTIVITY_THRESHOLDS.GENTLE_REMINDER) {
          continue
        }

        // Check if we already sent an email recently for this threshold
        let recentEmail = null
        try {
          const { data } = await supabase
            .from('email_logs')
            .select('sent_at, email_type')
            .eq('user_id', user.id)
            .eq('email_type', 'inactive_user')
            .gte('sent_at', new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()) // Last 2 days
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          recentEmail = data
        } catch (e) {
          // email_logs table may not exist yet - proceed without dedup check
          console.warn('⚠️ Could not check email_logs for recent sends:', e)
        }

        if (recentEmail) {
          continue // Already sent recently
        }

        // Generate email
        const { subject, html } = generateInactiveUserEmail(
          profile.name,
          daysSinceLastEntry,
          APP_URL
        )

        // Send email
        await smtpClient.send({
          from: `Noted <${SMTP_FROM}>`, // Display name "Noted"
          to: recipientEmail,
          subject: subject,
          html: html,
        })

        // Log the email (non-critical, don't fail if table doesn't exist)
        try {
          await supabase.from('email_logs').insert({
            user_id: user.id,
            email_type: 'inactive_user',
            recipient: recipientEmail,
            subject: subject,
            sent_at: now.toISOString(),
            status: 'sent'
          })
        } catch (e) {
          console.warn('⚠️ Could not log email to email_logs:', e)
        }

        emailsSent.push({ userId: user.id, email: recipientEmail, daysSince: daysSinceLastEntry })

      } catch (error: any) {
        console.error(`Error sending email to user ${user.id}:`, error)
        errors.push({ userId: user.id, error: error.message })
      }
    }

    console.log(`✅ Process complete: ${emailsSent.length} emails sent, ${errors.length} errors`)

    // Close SMTP connection
    try { await smtpClient.close() } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: emailsSent.length,
        errors: errors.length,
        details: { emailsSent, errors }
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ FATAL ERROR in detect-inactive-users:')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Full error:', JSON.stringify(error, null, 2))

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
