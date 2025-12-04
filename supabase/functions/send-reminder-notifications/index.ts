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
    // First get reminders, then fetch user emails separately to avoid join issues
    const { data: reminders, error } = await supabaseClient
      .from('reminders')
      .select('id, user_id, title, description, reminder_date, frequency, is_completed')
      .eq('is_completed', false)
      .gte('reminder_date', today.toISOString())
      .lt('reminder_date', tomorrow.toISOString())

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
