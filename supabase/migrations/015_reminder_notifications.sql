-- Enable pg_cron extension for scheduled jobs
-- This allows automatic execution of reminder notifications

-- Enable the pg_cron extension (requires superuser or rds_superuser role)
-- NOTE: On Supabase, this extension is already enabled by default
-- If self-hosting, uncomment the line below:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_reminder_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
  anon_key text;
BEGIN
  -- Get Supabase URL and anon key from vault or environment
  -- These should be configured in your Supabase dashboard under Settings > API
  function_url := current_setting('app.supabase_url', true) || '/functions/v1/send-reminder-notifications';
  anon_key := current_setting('app.supabase_anon_key', true);
  
  -- Call the Edge Function using http extension
  -- NOTE: This requires the pg_net extension which is available on Supabase
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Alternative: Create a simplified notification trigger that doesn't require Edge Functions
-- This creates an in-app notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'reminder',
  is_read boolean DEFAULT false,
  related_id uuid, -- Can reference reminder, goal, or event ID
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Function to generate notifications for due reminders
CREATE OR REPLACE FUNCTION generate_reminder_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_count integer := 0;
  reminder_record record;
  next_date timestamptz;
BEGIN
  -- Get reminders due today (not completed)
  FOR reminder_record IN
    SELECT 
      id,
      user_id,
      title,
      description,
      reminder_date,
      frequency
    FROM reminders
    WHERE 
      is_completed = false
      AND DATE(reminder_date) = CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 
        FROM notifications 
        WHERE 
          type = 'reminder' 
          AND related_id = reminders.id 
          AND DATE(created_at) = CURRENT_DATE
      )
  LOOP
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      reminder_record.user_id,
      '🔔 Reminder: ' || reminder_record.title,
      reminder_record.description,
      'reminder',
      reminder_record.id
    );
    
    notification_count := notification_count + 1;
    
    -- For recurring reminders, create next occurrence
    IF reminder_record.frequency != 'once' THEN
      next_date := reminder_record.reminder_date;
      
      CASE reminder_record.frequency
        WHEN 'daily' THEN
          next_date := next_date + interval '1 day';
        WHEN 'weekly' THEN
          next_date := next_date + interval '7 days';
        WHEN 'monthly' THEN
          next_date := next_date + interval '1 month';
      END CASE;
      
      -- Insert next occurrence
      INSERT INTO reminders (user_id, title, description, reminder_date, frequency, is_completed)
      SELECT 
        user_id,
        title,
        description,
        next_date,
        frequency,
        false
      FROM reminders
      WHERE id = reminder_record.id;
      
      -- Mark current reminder as completed
      UPDATE reminders
      SET is_completed = true
      WHERE id = reminder_record.id;
    END IF;
  END LOOP;
  
  RETURN notification_count;
END;
$$;

-- Schedule the notification function to run daily at 8 AM
-- NOTE: This requires pg_cron extension and appropriate permissions
-- Uncomment the following line when pg_cron is available:
/*
SELECT cron.schedule(
  'daily-reminder-notifications',
  '0 8 * * *', -- Every day at 8:00 AM
  $$SELECT generate_reminder_notifications();$$
);
*/

-- Alternative: Create a manual trigger for testing
-- Call this function manually to generate notifications:
-- SELECT generate_reminder_notifications();

-- Comment: To enable automatic notifications on Supabase:
-- 1. Enable pg_cron in your Supabase dashboard (Database > Extensions)
-- 2. Uncomment and run the cron.schedule command above
-- 3. Or use Supabase's built-in cron jobs feature
-- 4. Or set up a webhook/serverless function that calls generate_reminder_notifications() daily
