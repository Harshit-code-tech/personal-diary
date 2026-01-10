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

// Create SMTP client on-demand with timeout
async function sendEmailWithTimeout(
  recipient: string,
  subject: string,
  htmlBody: string,
  timeoutMs = 8000 // 8 second timeout
): Promise<void> {
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
    const sendPromise = smtpClient.send({
      from: `Noted`, // Display name "Noted" with email
      to: recipient,
      subject: subject,
      html: htmlBody,
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

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (emailItem: EmailQueueItem) => {
        try {
          // Send email with timeout protection
          await sendEmailWithTimeout(
            emailItem.recipient_email,
            emailItem.subject,
            emailItem.html_body
          )

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
