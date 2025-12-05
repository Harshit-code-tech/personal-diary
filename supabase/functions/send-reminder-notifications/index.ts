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

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch reminders due today that are not completed
    // First get reminders, then fetch user emails separately to avoid join issues
    const { data: reminders, error } = await supabaseClient
      .from('reminders')
      .select('id, user_id, title, description, next_reminder_at, reminder_type, is_active')
      .eq('is_active', true)
      .lte('next_reminder_at', tomorrow.toISOString())
      .gte('next_reminder_at', today.toISOString())

    if (error) {
      throw error
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No reminders due today',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
          
          // Here you would integrate with your email service (e.g., SendGrid, Resend, etc.)
          // For now, we'll just log and create an in-app notification
          
          console.log(`Sending reminder notification to ${userEmail}:`, {
            title: reminder.title,
            description: reminder.description,
            date: reminder.next_reminder_at,
          })

          // Optional: Create an in-app notification record
          // You could add a 'notifications' table to store these
          
          // For recurring reminders, calculate next occurrence
          if (reminder.reminder_type !== 'custom') {
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
