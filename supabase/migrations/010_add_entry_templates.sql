-- ============================================
-- ADD ENTRY TEMPLATES TABLE
-- Migration 010 - Create templates system
-- ============================================

-- Create entry_templates table
CREATE TABLE IF NOT EXISTS entry_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_template TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '📝',
  is_system_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON entry_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_system ON entry_templates(is_system_template);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_entry_templates_updated_at
  BEFORE UPDATE ON entry_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE entry_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view templates"
  ON entry_templates FOR SELECT
  USING (
    is_system_template = true OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert own templates"
  ON entry_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON entry_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON entry_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default system templates
INSERT INTO entry_templates (id, name, description, content_template, icon, is_system_template) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Gratitude Journal', 'Daily gratitude practice', '# Three Things I''m Grateful For Today\n\n1. \n2. \n3. \n\n## Why These Matter\n\n', '🙏', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Dream Log', 'Record your dreams', '# Last Night''s Dream\n\n**Date:** \n**Time I Woke Up:** \n\n## What Happened\n\n\n## Emotions I Felt\n\n\n## Symbols & Themes\n\n', '🌙', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Work Reflection', 'Daily work journal', '# Work Day Reflection\n\n## Accomplishments\n- \n\n## Challenges\n- \n\n## Tomorrow''s Goals\n- \n', '💼', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Morning Pages', 'Stream of consciousness', '# Morning Pages\n\nWrite whatever comes to mind. No editing, no judgment.\n\n', '☀️', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Weekly Review', 'Weekly reflection', '# Week of [DATE]\n\n## Wins This Week\n\n## Challenges Faced\n\n## Lessons Learned\n\n## Next Week''s Focus\n\n', '📊', true),
  ('550e8400-e29b-41d4-a716-446655440006', 'Travel Log', 'Document your adventures', '# Travel Entry\n\n**Location:** \n**Date:** \n\n## What I Did Today\n\n\n## Favorite Moments\n\n\n## Photos\n\n', '✈️', true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✨ Entry templates system added!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Created entry_templates table with RLS';
  RAISE NOTICE '✅ Added 6 default system templates';
  RAISE NOTICE '🔒 Users can create their own custom templates';
END $$;
