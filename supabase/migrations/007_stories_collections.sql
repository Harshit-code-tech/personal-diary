-- Phase 5: Stories & Collections Migration
-- Create stories table for organizing entries into narratives

-- Stories table (trips, projects, life events, etc.)
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  icon TEXT DEFAULT '📖',
  color VARCHAR(7) DEFAULT '#D4AF37', -- Gold color
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'archived')),
  category VARCHAR(100), -- Trip, Project, Life Event, etc.
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: link entries to stories (many-to-many)
CREATE TABLE IF NOT EXISTS story_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0, -- For custom ordering within story
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, entry_id)
);

-- Story tags for categorization
CREATE TABLE IF NOT EXISTS story_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, tag_name)
);

-- RLS Policies for stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories"
ON stories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories"
ON stories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
ON stories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON stories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for story_entries
ALTER TABLE story_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their story_entries"
ON story_entries FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_entries.story_id
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for story_tags
ALTER TABLE story_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their story_tags"
ON story_tags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_tags.story_id
    AND stories.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_start_date ON stories(start_date);
CREATE INDEX IF NOT EXISTS idx_story_entries_story_id ON story_entries(story_id);
CREATE INDEX IF NOT EXISTS idx_story_entries_entry_id ON story_entries(entry_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_story_id ON story_tags(story_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER stories_updated_at_trigger
BEFORE UPDATE ON stories
FOR EACH ROW
EXECUTE FUNCTION update_stories_updated_at();

-- View for story statistics
CREATE OR REPLACE VIEW story_stats AS
SELECT 
  s.id,
  s.user_id,
  s.title,
  COUNT(DISTINCT se.entry_id) as entry_count,
  MIN(e.entry_date) as first_entry_date,
  MAX(e.entry_date) as last_entry_date,
  SUM(e.word_count) as total_words
FROM stories s
LEFT JOIN story_entries se ON s.id = se.story_id
LEFT JOIN entries e ON se.entry_id = e.id
GROUP BY s.id, s.user_id, s.title;
