-- Add full-text search to entries table
-- This enables fast searching across titles and content

-- Add tsvector column for search
ALTER TABLE entries ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_entries_search 
ON entries USING gin(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_entries_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(regexp_replace(NEW.content, '<[^>]+>', '', 'g'), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.mood, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
DROP TRIGGER IF EXISTS entries_search_vector_update ON entries;
CREATE TRIGGER entries_search_vector_update
BEFORE INSERT OR UPDATE ON entries
FOR EACH ROW
EXECUTE FUNCTION update_entries_search_vector();

-- Update existing entries with search vectors
UPDATE entries SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(regexp_replace(content, '<[^>]+>', '', 'g'), '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(mood, '')), 'C');

-- Create search function with filters
CREATE OR REPLACE FUNCTION search_entries(
  p_user_id UUID,
  search_query TEXT,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL,
  mood_filter TEXT DEFAULT NULL,
  folder_filter UUID DEFAULT NULL,
  person_filter UUID DEFAULT NULL,
  story_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  content TEXT,
  entry_date DATE,
  mood VARCHAR,
  word_count INTEGER,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.content,
    e.entry_date,
    e.mood,
    e.word_count,
    e.created_at,
    ts_rank(e.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM entries e
  LEFT JOIN entry_people ep ON e.id = ep.entry_id
  LEFT JOIN story_entries se ON e.id = se.entry_id
  WHERE 
    e.user_id = p_user_id
    AND (
      search_query IS NULL 
      OR search_query = '' 
      OR e.search_vector @@ websearch_to_tsquery('english', search_query)
    )
    AND (date_from IS NULL OR e.entry_date >= date_from)
    AND (date_to IS NULL OR e.entry_date <= date_to)
    AND (mood_filter IS NULL OR e.mood = mood_filter)
    AND (folder_filter IS NULL OR e.folder_id = folder_filter)
    AND (person_filter IS NULL OR ep.person_id = person_filter)
    AND (story_filter IS NULL OR se.story_id = story_filter)
  GROUP BY e.id, e.title, e.content, e.entry_date, e.mood, e.word_count, e.created_at, e.search_vector
  ORDER BY rank DESC, e.entry_date DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_entries TO authenticated;
