-- ============================================
-- Personal Diary Database Schema
-- 100% FREE Supabase Implementation
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'grey')),
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(10) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  
  -- Email notification preferences
  email_reminders_enabled BOOLEAN DEFAULT false,
  email_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'weekly', 'never')),
  email_time TIME DEFAULT '20:00:00',
  email_day_of_week INTEGER DEFAULT 0 CHECK (email_day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  
  -- Privacy settings
  show_images_inline BOOLEAN DEFAULT true,
  auto_save_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================
-- 2. ENTRY TEMPLATES TABLE (Must be created BEFORE entries)
-- ============================================
CREATE TABLE entry_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  content_template TEXT NOT NULL,
  icon VARCHAR(50), -- emoji or icon name
  is_system_template BOOLEAN DEFAULT false, -- true for pre-built templates
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON entry_templates(user_id);

-- ============================================
-- 3. ENTRIES TABLE (Enhanced)
-- ============================================
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Metadata
  mood VARCHAR(50),
  weather VARCHAR(50),
  location VARCHAR(255),
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- in seconds
  
  -- Template support
  template_id UUID REFERENCES entry_templates(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entry_date DATE DEFAULT CURRENT_DATE
);

-- Create index for faster queries
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_entry_date ON entries(entry_date);
CREATE INDEX idx_entries_created_at ON entries(created_at);

-- ============================================
-- 4. IMAGES TABLE (Enhanced)
-- ============================================
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Storage info
  storage_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  compressed BOOLEAN DEFAULT false,
  
  -- Display metadata
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_images_entry_id ON images(entry_id);
CREATE INDEX idx_images_user_id ON images(user_id);

-- ============================================
-- 5. TAGS TABLE (Enhanced)
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#D4A44F', -- hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- ============================================
-- 6. ENTRY TAGS (Join Table)
-- ============================================
CREATE TABLE entry_tags (
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE INDEX idx_entry_tags_entry ON entry_tags(entry_id);
CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);

-- ============================================
-- 7. STREAKS TABLE
-- ============================================
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_entries INTEGER DEFAULT 0,
  last_entry_date DATE,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_streaks_user_id ON streaks(user_id);

-- ============================================
-- 8. EMAIL QUEUE TABLE
-- ============================================
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('daily_reminder', 'weekly_summary')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_status ON email_queue(status);

-- ============================================
-- 9. HABITS TABLE (Optional Future Feature)
-- ============================================
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  target_frequency INTEGER DEFAULT 1, -- times per day/week
  frequency_unit VARCHAR(10) DEFAULT 'daily' CHECK (frequency_unit IN ('daily', 'weekly')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 10. HABIT LOGS (Optional Future Feature)
-- ============================================
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  log_date DATE DEFAULT CURRENT_DATE,
  
  UNIQUE(habit_id, log_date)
);

-- ============================================
-- 11. MOODS TABLE (Optional Future Feature)
-- ============================================
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  color VARCHAR(7) DEFAULT '#D4A44F',
  
  UNIQUE(user_id, mood_name)
);

-- ============================================
-- 12. TASKS TABLE (Optional Future Feature)
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Update user_settings.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entry_templates_updated_at
  BEFORE UPDATE ON entry_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update entries.last_edited_at
CREATE TRIGGER update_entries_last_edited_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR STREAK CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_last_entry_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total_entries INTEGER;
BEGIN
  v_user_id := NEW.user_id;
  
  -- Get current streak data
  SELECT last_entry_date, current_streak, longest_streak, total_entries
  INTO v_last_entry_date, v_current_streak, v_longest_streak, v_total_entries
  FROM streaks
  WHERE user_id = v_user_id;
  
  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, current_streak, longest_streak, total_entries, last_entry_date)
    VALUES (v_user_id, 1, 1, 1, NEW.entry_date);
    RETURN NEW;
  END IF;
  
  -- Calculate new streak
  IF v_last_entry_date IS NULL OR NEW.entry_date > v_last_entry_date THEN
    IF v_last_entry_date IS NULL OR NEW.entry_date = v_last_entry_date + INTERVAL '1 day' THEN
      -- Continue streak
      v_current_streak := v_current_streak + 1;
    ELSIF NEW.entry_date = v_last_entry_date THEN
      -- Same day, don't change streak
      v_current_streak := v_current_streak;
    ELSE
      -- Streak broken
      v_current_streak := 1;
    END IF;
    
    -- Update longest streak if needed
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    -- Update streak record
    UPDATE streaks
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        total_entries = v_total_entries + 1,
        last_entry_date = NEW.entry_date,
        updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_on_entry
  AFTER INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_streak();

-- ============================================
-- INSERT SYSTEM TEMPLATES
-- ============================================

INSERT INTO entry_templates (id, name, description, content_template, icon, is_system_template) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Gratitude Journal', 'Daily gratitude practice', '# Three Things I''m Grateful For Today\n\n1. \n2. \n3. \n\n## Why These Matter\n\n', '🙏', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Dream Log', 'Record your dreams', '# Last Night''s Dream\n\n**Date:** \n**Time I Woke Up:** \n\n## What Happened\n\n\n## Emotions I Felt\n\n\n## Symbols & Themes\n\n', '🌙', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Work Reflection', 'Daily work journal', '# Work Day Reflection\n\n## Accomplishments\n- \n\n## Challenges\n- \n\n## Tomorrow''s Goals\n- \n', '💼', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Morning Pages', 'Stream of consciousness', '# Morning Pages\n\nWrite whatever comes to mind. No editing, no judgment.\n\n', '☀️', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Weekly Review', 'Weekly reflection', '# Week of [DATE]\n\n## Wins This Week\n\n## Challenges Faced\n\n## Lessons Learned\n\n## Next Week''s Focus\n\n', '📊', true),
  ('550e8400-e29b-41d4-a716-446655440006', 'Travel Log', 'Document your adventures', '# Travel Entry\n\n**Location:** \n**Date:** \n\n## What I Did Today\n\n\n## Favorite Moments\n\n\n## Photos\n\n', '✈️', true),
  ('550e8400-e29b-41d4-a716-446655440007', 'Blank Canvas', 'Start from scratch', '# \n\n', '📝', true);

-- ============================================
-- STORAGE BUCKET SETUP (Run in Supabase Dashboard)
-- ============================================

-- Create storage bucket for images
-- This must be run in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('diary-images', 'diary-images', false);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage bucket "diary-images" in Supabase Dashboard';
  RAISE NOTICE '2. Run the RLS policies migration (002_rls_policies.sql)';
  RAISE NOTICE '3. Setup pg_cron for email reminders';
END $$;
