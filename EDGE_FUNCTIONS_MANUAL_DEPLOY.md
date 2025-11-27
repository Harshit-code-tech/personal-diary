# 📝 EXACT STEPS: Deploy Edge Functions via Supabase Editor

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Open: https://supabase.com/dashboard
- Select your **personal-diary** project

---

### 2. Navigate to Edge Functions
- Click **"Edge Functions"** in the left sidebar
- Click **"Create a new function"** button

---

### 3. Deploy Function #1: email-reminders

**Function Name:** `email-reminders`

**Click "Create function"**, then:

**⚠️ IMPORTANT:** You must create TWO files for this function:
1. `index.ts` (main file)
2. `templates.ts` (imported by index.ts)

If you only create `index.ts`, you'll get: **"Module not found templates.ts"** error!

#### Main File (index.ts):
Copy and paste this ENTIRE code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { generateDailyReminderEmail, generateWeeklySummaryEmail, generateStreakMilestoneEmail } from './templates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://yourapp.com'

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
          const email = emailJob.users?.email
          if (!email) return { success: false, error: 'No email found' }

          // Fetch user profile and streak data
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', emailJob.user_id)
            .single()

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
            to: email,
            subject: emailSubject,
            html: emailHtml,
          })

          // Update email status
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: now.toISOString() })
            .eq('id', emailJob.id)

          return { success: true, email }
        } catch (error) {
          console.error('Failed to send email:', error)
          
          // Update with error
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

    await smtpClient.close()

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in email-reminders:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### Create New File: templates.ts
- In the editor, click **"+ Add file"** or **"New file"**
- Name it: `templates.ts`
- Paste this code:

```typescript
// Beautiful HTML Email Templates for Personal Diary App

interface EmailTemplateProps {
  userName?: string
  currentStreak?: number
  totalEntries?: number
  appUrl: string
}

export function generateDailyReminderEmail({ userName, currentStreak, appUrl }: EmailTemplateProps): string {
  const displayName = userName || 'there'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Journaling Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4C1 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px; font-weight: 600;">Daily Journaling Reminder</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #2C3E50; font-size: 18px; line-height: 1.6;">
                Hi ${displayName}! 👋
              </p>
              
              <p style="margin: 0 0 24px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                It's time to reflect on your day and capture your thoughts. Taking a few minutes to journal can help you process your experiences and track your personal growth.
              </p>
              
              ${currentStreak && currentStreak > 0 ? `
              <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
                <p style="margin: 0; color: #2C3E50; font-size: 20px; font-weight: 600;">
                  ${currentStreak}-day streak!
                </p>
                <p style="margin: 8px 0 0; color: #2C3E50; font-size: 14px;">
                  Keep the momentum going!
                </p>
              </div>
              ` : ''}
              
              <div style="background-color: #F8F9FA; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                <p style="margin: 0 0 16px; color: #2C3E50; font-size: 16px; font-weight: 600;">
                  Reflection prompts for today:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #546E7A; font-size: 15px; line-height: 1.8;">
                  <li>What went well today?</li>
                  <li>What challenges did you face?</li>
                  <li>What did you learn?</li>
                  <li>How are you feeling right now?</li>
                </ul>
              </div>
              
              <table role="presentation" style="width: 100%; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/app/new" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941A 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">
                      Start Writing →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #90A4AE; font-size: 14px; text-align: center;">
                Take a moment for yourself today 💙
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #F8F9FA; padding: 24px 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0 0 12px; color: #90A4AE; font-size: 13px;">
                You're receiving this because you enabled daily reminders
              </p>
              <p style="margin: 0; color: #90A4AE; font-size: 13px;">
                <a href="${appUrl}/app/settings" style="color: #D4AF37; text-decoration: none;">Manage preferences</a>
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
}

export function generateWeeklySummaryEmail({ userName, currentStreak, totalEntries, appUrl }: EmailTemplateProps): string {
  const displayName = userName || 'there'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Your Weekly Summary</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px; color: #2C3E50; font-size: 18px;">Hi ${displayName}!</p>
              
              <p style="margin: 0 0 32px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                Here's a summary of your journaling activity this week:
              </p>
              
              <div style="display: grid; gap: 16px; margin-bottom: 32px;">
                <div style="background-color: #F8F9FA; border-radius: 12px; padding: 20px; text-align: center;">
                  <div style="font-size: 36px; font-weight: 700; color: #D4AF37; margin-bottom: 8px;">${totalEntries || 0}</div>
                  <div style="color: #546E7A; font-size: 14px;">Total Entries</div>
                </div>
                
                <div style="background-color: #F8F9FA; border-radius: 12px; padding: 20px; text-align: center;">
                  <div style="font-size: 36px; font-weight: 700; color: #FF6B6B; margin-bottom: 8px;">${currentStreak || 0}</div>
                  <div style="color: #546E7A; font-size: 14px;">Current Streak</div>
                </div>
              </div>
              
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View Your Entries →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateStreakMilestoneEmail({ userName, currentStreak, appUrl }: EmailTemplateProps): string {
  const displayName = userName || 'there'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
  <title>Streak Milestone</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px; font-weight: 600;">Congratulations!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="margin: 0 0 24px; color: #2C3E50; font-size: 18px;">Amazing work, ${displayName}!</p>
              
              <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); border-radius: 50%; width: 120px; height: 120px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <p style="margin: 0; color: #2C3E50; font-size: 48px; font-weight: 700;">${currentStreak}</p>
              </div>
              
              <p style="margin: 0 0 32px; color: #2C3E50; font-size: 20px; font-weight: 600;">Days Strong!</p>
              
              <p style="margin: 0 0 32px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                You've built an incredible journaling habit. Keep up the amazing work!
              </p>
              
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/app" style="display: inline-block; background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); color: #2C3E50; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Continue Your Journey →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
```

Click **"Deploy"** when done.

---

### 4. Deploy Function #2: send-reminder-notifications

Click **"Create a new function"**

**Function Name:** `send-reminder-notifications`

Paste this ENTIRE code in index.ts:

```typescript
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
  reminder_date: string
  frequency: 'once' | 'daily' | 'weekly' | 'monthly'
  is_completed: boolean
  users: {
    email: string
  }
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

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch reminders due today that are not completed
    const { data: reminders, error } = await supabaseClient
      .from('reminders')
      .select(`
        id,
        user_id,
        title,
        description,
        reminder_date,
        frequency,
        is_completed,
        users!inner (
          email
        )
      `)
      .eq('is_completed', false)
      .gte('reminder_date', today.toISOString())
      .lt('reminder_date', tomorrow.toISOString())

    if (error) {
      throw error
    }

    const typedReminders = reminders as unknown as Reminder[]

    // Send notifications for each reminder
    const notifications = await Promise.all(
      typedReminders.map(async (reminder) => {
        try {
          // Here you would integrate with your email service (e.g., SendGrid, Resend, etc.)
          // For now, we'll just log and create an in-app notification
          
          console.log(`Sending reminder notification to ${reminder.users.email}:`, {
            title: reminder.title,
            description: reminder.description,
            date: reminder.reminder_date,
          })

          // Optional: Create an in-app notification record
          // You could add a 'notifications' table to store these
          
          // For recurring reminders, create the next occurrence
          if (reminder.frequency !== 'once') {
            const nextDate = new Date(reminder.reminder_date)
            
            switch (reminder.frequency) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1)
                break
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7)
                break
              case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1)
                break
            }

            // Create next occurrence
            await supabaseClient
              .from('reminders')
              .insert({
                user_id: reminder.user_id,
                title: reminder.title,
                description: reminder.description,
                reminder_date: nextDate.toISOString(),
                frequency: reminder.frequency,
                is_completed: false,
              })

            // Mark current reminder as completed
            await supabaseClient
              .from('reminders')
              .update({ is_completed: true })
              .eq('id', reminder.id)
          }

          return {
            success: true,
            reminderId: reminder.id,
            email: reminder.users.email,
          }
        } catch (err) {
          console.error(`Failed to send notification for reminder ${reminder.id}:`, err)
          return {
            success: false,
            reminderId: reminder.id,
            error: err.message,
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
  } catch (error) {
    console.error('Error in send-reminder-notifications:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

Click **"Deploy"**.

---

### 5. Deploy Function #3: detect-inactive-users

Click **"Create a new function"**

**Function Name:** `detect-inactive-users`

Paste this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://personal-diary-three.vercel.app'

// Days of inactivity thresholds
const INACTIVITY_THRESHOLDS = {
  GENTLE_REMINDER: 3,    // 3 days
  ENCOURAGEMENT: 7,       // 1 week
  RE_ENGAGEMENT: 14,      // 2 weeks
  FINAL_NUDGE: 30,        // 1 month
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configure Gmail SMTP
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

function generateInactiveUserEmail(daysSinceLastEntry: number, userName: string, appUrl: string): { subject: string, html: string } {
  let subject = ''
  let message = ''
  let emoji = ''
  
  if (daysSinceLastEntry >= INACTIVITY_THRESHOLDS.FINAL_NUDGE) {
    emoji = '💙'
    subject = 'We Miss You!'
    message = `It's been ${daysSinceLastEntry} days since your last entry. Your journal is waiting for you.`
  } else if (daysSinceLastEntry >= INACTIVITY_THRESHOLDS.RE_ENGAGEMENT) {
    emoji = '✨'
    subject = 'Come Back to Your Journal'
    message = `${daysSinceLastEntry} days without journaling. Your thoughts matter—let's capture them!`
  } else if (daysSinceLastEntry >= INACTIVITY_THRESHOLDS.ENCOURAGEMENT) {
    emoji = '📝'
    subject = 'Time to Journal Again'
    message = `You haven't written in ${daysSinceLastEntry} days. A quick reflection can brighten your day!`
  } else {
    emoji = '👋'
    subject = 'Keep Your Streak Going!'
    message = `It's been ${daysSinceLastEntry} days. Don't break your momentum!`
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">${emoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${subject}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #2C3E50; font-size: 18px;">Hi ${userName}!</p>
              <p style="margin: 0 0 24px; color: #546E7A; font-size: 16px; line-height: 1.6;">${message}</p>
              <table role="presentation" style="width: 100%; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/app/new" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Start Writing Now →
                    </a>
                  </td>
                </tr>
              </table>
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get inactive users
    const { data: inactiveUsers, error } = await supabase
      .rpc('get_inactive_users')

    if (error) throw error

    const results = await Promise.all(
      (inactiveUsers || []).map(async (user: any) => {
        try {
          // Check user email preferences
          const { data: settings } = await supabase
            .from('user_settings')
            .select('email_reminders_enabled')
            .eq('user_id', user.user_id)
            .single()

          if (settings && !settings.email_reminders_enabled) {
            return { success: true, skipped: true, reason: 'email_disabled' }
          }

          // Check if we already sent an email recently
          const { data: recentEmail } = await supabase
            .from('email_logs')
            .select('created_at')
            .eq('user_id', user.user_id)
            .eq('email_type', 'inactive_user')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (recentEmail) {
            return { success: true, skipped: true, reason: 'already_sent_today' }
          }

          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', user.user_id)
            .single()

          const { subject, html } = generateInactiveUserEmail(
            user.days_since_last_entry,
            profile?.name || 'there',
            APP_URL
          )

          // Send email
          await smtpClient.send({
            from: GMAIL_USER,
            to: user.email,
            subject,
            html,
          })

          // Log the email
          await supabase
            .from('email_logs')
            .insert({
              user_id: user.user_id,
              email_type: 'inactive_user',
              recipient: user.email,
              status: 'sent',
              subject,
            })

          return { success: true, email: user.email, days: user.days_since_last_entry }
        } catch (error) {
          console.error(`Failed for user ${user.user_id}:`, error)
          return { success: false, error: error.message }
        }
      })
    )

    await smtpClient.close()

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

Click **"Deploy"**.

---

### 6. Deploy Function #4: process-email-queue

Click **"Create a new function"**

**Function Name:** `process-email-queue`

Paste this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://personal-diary-three.vercel.app'

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()

    // Fetch pending emails that are due (max 50 per batch to avoid timeouts)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .lt('retry_count', 3) // Max 3 retry attempts
      .order('scheduled_for', { ascending: true })
      .limit(50)

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

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (emailItem: EmailQueueItem) => {
        try {
          // Send email via Gmail SMTP
          await smtpClient.send({
            from: GMAIL_USER,
            to: emailItem.recipient_email,
            subject: emailItem.subject,
            html: emailItem.html_body,
          })

          console.log(`✅ Email sent successfully to ${emailItem.recipient_email}`)

          // Update email status to 'sent'
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: now.toISOString(),
              last_error: null,
            })
            .eq('id', emailItem.id)

          // Log successful delivery
          await supabase
            .from('email_logs')
            .insert({
              user_id: emailItem.user_id,
              email_type: emailItem.email_type,
              recipient: emailItem.recipient_email,
              status: 'sent',
              subject: emailItem.subject,
            })

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

          // Log failed delivery
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

    console.log(`📊 Email processing complete: ${successful} sent, ${failed} failed`)

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
  } finally {
    await smtpClient.close()
  }
})
```

Click **"Deploy"**.

---

### 7. Set Secrets (Environment Variables)

After deploying all functions:

1. In Supabase Dashboard, go to **Edge Functions**
2. Click **"Manage secrets"** or find **"Secrets"** section
3. Add these 3 secrets (**IMPORTANT: Do NOT add secrets starting with SUPABASE_**):

**Secret 1:**
- Name: `GMAIL_USER`
- Value: `your-email@gmail.com` (your actual Gmail)

**Secret 2:**
- Name: `GMAIL_APP_PASSWORD`
- Value: `abcdefghijklmnop` (the 16-char password from Gmail, NO SPACES!)

**Secret 3:**
- Name: `APP_URL`
- Value: `https://personal-diary-three.vercel.app`

**⚠️ IMPORTANT NOTES:**
- **DO NOT** add `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` as secrets - they are automatically available to Edge Functions
- Supabase will reject any secret name starting with `SUPABASE_`
- Only add the 3 secrets listed above

---

## ✅ Done!

All 4 Edge Functions are deployed and configured. Your cron jobs will now call these functions automatically!

**Verify they're working:**
- Go to Edge Functions in dashboard
- You should see all 4 functions listed
- They'll start running according to the cron schedule you already set up

🎉 Everything is automated now!
