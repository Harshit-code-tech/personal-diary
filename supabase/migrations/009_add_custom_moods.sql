-- ============================================
-- ADD CUSTOM MOODS SYSTEM
-- Migration 012 - Allow users to create custom mood options
-- ============================================

-- Create custom_moods table
CREATE TABLE IF NOT EXISTS custom_moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Motivated", "Nostalgic"
  emoji TEXT NOT NULL, -- e.g., "💪", "🌅"
  color TEXT NOT NULL, -- hex color e.g., "#10B981"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique mood names per user
  CONSTRAINT unique_user_mood_name UNIQUE(user_id, name)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_moods_user_id ON custom_moods(user_id);

-- Enable RLS
ALTER TABLE custom_moods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own custom moods"
  ON custom_moods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom moods"
  ON custom_moods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom moods"
  ON custom_moods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom moods"
  ON custom_moods FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_moods_updated_at
  BEFORE UPDATE ON custom_moods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✨ Custom moods system added!';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Users can now create personalized mood options';
  RAISE NOTICE '🎨 Each custom mood has: name, emoji, and color';
  RAISE NOTICE '🔒 Moods are private to each user';
  RAISE NOTICE '';
  RAISE NOTICE 'Example: "Motivated" with 💪 emoji and #10B981 color';
END $$;
