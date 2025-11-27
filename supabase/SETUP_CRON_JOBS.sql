-- ⚠️ CRITICAL: Run this SQL in Supabase SQL Editor to enable all automations
-- This sets up all cron jobs for the Personal Diary app

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- 1. DAILY EMAIL REMINDERS (8 AM UTC)
-- ============================================================================
SELECT cron.schedule(
  'daily-email-reminders',
  '0 8 * * *',  -- Every day at 8 AM UTC
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "daily_reminder"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- 2. WEEKLY SUMMARY EMAILS (Sunday at 6 PM UTC)
-- ============================================================================
SELECT cron.schedule(
  'weekly-summary',
  '0 18 * * 0',  -- Every Sunday at 6 PM UTC
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "weekly_summary"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- 3. REMINDER NOTIFICATIONS (Every hour)
-- ============================================================================
SELECT cron.schedule(
  'check-reminders',
  '0 * * * *',  -- Every hour at :00
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminder-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- 4. INACTIVE USER DETECTION (Daily at 10 AM UTC)
-- ============================================================================
SELECT cron.schedule(
  'detect-inactive-users',
  '0 10 * * *',  -- Every day at 10 AM UTC
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/detect-inactive-users',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- 5. PROCESS EMAIL QUEUE (Every 5 minutes)
-- ============================================================================
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- 6. REFRESH ADMIN DASHBOARD STATS (Every hour)
-- ============================================================================
SELECT cron.schedule(
  'refresh-admin-stats',
  '0 * * * *',  -- Every hour at :00
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  $$
);

-- ============================================================================
-- 7. UPDATE STREAKS (Daily at midnight UTC)
-- ============================================================================
SELECT cron.schedule(
  'update-streaks',
  '0 0 * * *',  -- Every day at midnight UTC
  $$
  -- Reset streaks for users who haven't written in over 24 hours
  UPDATE streaks 
  SET current_streak = 0 
  WHERE last_entry_date < CURRENT_DATE - INTERVAL '1 day'
    AND current_streak > 0;
  $$
);

-- ============================================================================
-- 8. DATABASE CLEANUP (Weekly on Sunday at 3 AM UTC)
-- ============================================================================
SELECT cron.schedule(
  'database-cleanup',
  '0 3 * * 0',  -- Every Sunday at 3 AM UTC
  $$
  -- Delete old email logs (>90 days)
  DELETE FROM email_logs WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old error logs (>30 days)
  DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete processed email queue items (>90 days)
  DELETE FROM email_queue 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('sent', 'failed');
  
  -- Vacuum and analyze
  VACUUM ANALYZE;
  $$
);

-- ============================================================================
-- VERIFY SCHEDULED JOBS
-- ============================================================================
-- Run this query to see all scheduled jobs:
-- SELECT * FROM cron.job ORDER BY schedule;

-- ============================================================================
-- UNSCHEDULE JOBS (if needed)
-- ============================================================================
-- To remove a job, use:
-- SELECT cron.unschedule('job-name');
--
-- Examples:
-- SELECT cron.unschedule('daily-email-reminders');
-- SELECT cron.unschedule('weekly-summary');
-- SELECT cron.unschedule('check-reminders');
-- SELECT cron.unschedule('detect-inactive-users');
-- SELECT cron.unschedule('process-email-queue');
-- SELECT cron.unschedule('refresh-admin-stats');
-- SELECT cron.unschedule('update-streaks');
-- SELECT cron.unschedule('database-cleanup');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- 2. Replace YOUR_ANON_KEY with your actual Supabase anon key
-- 3. All times are in UTC - adjust as needed for your timezone
-- 4. Make sure all Edge Functions are deployed before running this
-- 5. Verify that pg_cron extension is enabled in your Supabase project

-- To get your project URL and anon key:
-- 1. Go to Supabase Dashboard
-- 2. Project Settings → API
-- 3. Copy "Project URL" and "anon public" key

-- Example values:
-- URL: https://abcdefghijklmnop.supabase.co/functions/v1/email-reminders
-- Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

-- ============================================================================
-- MONITORING CRON JOBS
-- ============================================================================
-- Check job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Check for failed jobs:
-- SELECT * FROM cron.job_run_details 
-- WHERE status = 'failed' 
-- ORDER BY start_time DESC 
-- LIMIT 10;
