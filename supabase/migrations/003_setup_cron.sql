-- ============================================
-- Setup pg_cron for Email Reminders
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pg_cron extension (may require superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule email reminder function to run every hour
-- This checks the email_queue table and processes pending emails
SELECT cron.schedule(
  'process-email-reminders',  -- Job name
  '0 * * * *',                -- Every hour at minute 0
  $$
  -- Call the Edge Function via HTTP
  -- Note: This requires setting up a webhook or using Supabase's built-in scheduler
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/email-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);

-- ============================================
-- Function to Schedule Daily Reminders
-- ============================================

CREATE OR REPLACE FUNCTION schedule_daily_reminders()
RETURNS void AS $$
BEGIN
  -- Insert daily reminder emails for users who have it enabled
  INSERT INTO email_queue (user_id, email_type, scheduled_for, status)
  SELECT 
    us.user_id,
    'daily_reminder'::text,
    (CURRENT_DATE + us.email_time)::timestamp with time zone,
    'pending'
  FROM user_settings us
  WHERE us.email_reminders_enabled = true
    AND us.email_frequency = 'daily'
    AND NOT EXISTS (
      SELECT 1 FROM email_queue eq
      WHERE eq.user_id = us.user_id
        AND eq.email_type = 'daily_reminder'
        AND eq.scheduled_for::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to Schedule Weekly Reminders
-- ============================================

CREATE OR REPLACE FUNCTION schedule_weekly_reminders()
RETURNS void AS $$
BEGIN
  -- Insert weekly reminder emails for users who have it enabled
  INSERT INTO email_queue (user_id, email_type, scheduled_for, status)
  SELECT 
    us.user_id,
    'weekly_summary'::text,
    (CURRENT_DATE + us.email_time)::timestamp with time zone,
    'pending'
  FROM user_settings us
  WHERE us.email_reminders_enabled = true
    AND us.email_frequency = 'weekly'
    AND EXTRACT(DOW FROM CURRENT_DATE) = us.email_day_of_week
    AND NOT EXISTS (
      SELECT 1 FROM email_queue eq
      WHERE eq.user_id = us.user_id
        AND eq.email_type = 'weekly_summary'
        AND eq.scheduled_for::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Schedule the reminder scheduling functions
-- ============================================

-- Run daily reminder scheduler at midnight every day
SELECT cron.schedule(
  'schedule-daily-reminders',
  '0 0 * * *',  -- Midnight every day
  'SELECT schedule_daily_reminders();'
);

-- Run weekly reminder scheduler at midnight every day (checks day of week)
SELECT cron.schedule(
  'schedule-weekly-reminders',
  '0 0 * * *',  -- Midnight every day
  'SELECT schedule_weekly_reminders();'
);

-- ============================================
-- View Scheduled Jobs
-- ============================================

-- To view all cron jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name');

-- ============================================
-- NOTES
-- ============================================

-- 1. pg_cron is available on Supabase Pro plan and above
-- 2. For FREE tier, use Supabase Edge Functions with external cron (like cron-job.org)
-- 3. Update 'your-project-ref' with your actual Supabase project reference
-- 4. Service role key should be stored securely, not hardcoded
