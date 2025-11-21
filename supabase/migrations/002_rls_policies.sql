-- ============================================
-- Personal Diary Row-Level Security Policies
-- Ensures complete data isolation per user
-- ============================================

-- ============================================
-- 1. USER SETTINGS RLS
-- ============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. ENTRIES RLS
-- ============================================

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own entries
CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. ENTRY TEMPLATES RLS
-- ============================================

ALTER TABLE entry_templates ENABLE ROW LEVEL SECURITY;

-- Users can view system templates and their own templates
CREATE POLICY "Users can view templates"
  ON entry_templates FOR SELECT
  USING (
    is_system_template = true OR 
    auth.uid() = user_id
  );

-- Users can insert their own templates
CREATE POLICY "Users can insert own templates"
  ON entry_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system_template = false);

-- Users can update their own templates (not system templates)
CREATE POLICY "Users can update own templates"
  ON entry_templates FOR UPDATE
  USING (auth.uid() = user_id AND is_system_template = false)
  WITH CHECK (auth.uid() = user_id AND is_system_template = false);

-- Users can delete their own templates (not system templates)
CREATE POLICY "Users can delete own templates"
  ON entry_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system_template = false);

-- ============================================
-- 4. IMAGES RLS
-- ============================================

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Users can only view their own images
CREATE POLICY "Users can view own images"
  ON images FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images"
  ON images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own images
CREATE POLICY "Users can update own images"
  ON images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON images FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. TAGS RLS
-- ============================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Users can only view their own tags
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tags
CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. ENTRY TAGS RLS
-- ============================================

ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

-- Users can view entry_tags for their own entries
CREATE POLICY "Users can view own entry tags"
  ON entry_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- Users can insert entry_tags for their own entries
CREATE POLICY "Users can insert own entry tags"
  ON entry_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- Users can delete entry_tags for their own entries
CREATE POLICY "Users can delete own entry tags"
  ON entry_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. STREAKS RLS
-- ============================================

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Users can only view their own streaks
CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own streaks
CREATE POLICY "Users can insert own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own streaks
CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. EMAIL QUEUE RLS
-- ============================================

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Users can only view their own email queue
CREATE POLICY "Users can view own email queue"
  ON email_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert into email queue (for Edge Functions)
CREATE POLICY "Service role can insert email queue"
  ON email_queue FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- Users can delete their own email queue items
CREATE POLICY "Users can delete own email queue"
  ON email_queue FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. HABITS RLS (Optional Future Feature)
-- ============================================

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. HABIT LOGS RLS (Optional Future Feature)
-- ============================================

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs"
  ON habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs"
  ON habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
  ON habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 11. MOODS RLS (Optional Future Feature)
-- ============================================

ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moods"
  ON moods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moods"
  ON moods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods"
  ON moods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own moods"
  ON moods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 12. TASKS RLS (Optional Future Feature)
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET POLICIES (ALREADY CREATED)
-- ============================================

-- Note: Storage policies already exist for diary-images bucket
-- They were created earlier and are working correctly
-- DO NOT run the storage policy SQL again

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created successfully!';
  RAISE NOTICE '✅ All tables are now secured with row-level security.';
  RAISE NOTICE '✅ Storage bucket policies already active.';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '1. Test signup at http://localhost:3000/signup';
  RAISE NOTICE '2. Create your first diary entry';
  RAISE NOTICE '3. Verify only your data is visible';
END $$;
