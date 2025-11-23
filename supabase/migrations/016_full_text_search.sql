-- Full-text search implementation for entries
-- Adds search functionality with PostgreSQL full-text search

-- Add search vector column to entries table (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE entries ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_entries_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS entries_search_vector_update ON entries;
CREATE TRIGGER entries_search_vector_update
BEFORE INSERT OR UPDATE ON entries
FOR EACH ROW
EXECUTE FUNCTION update_entries_search_vector();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS entries_search_vector_idx ON entries USING GIN(search_vector);

-- Populate search vector for existing entries
UPDATE entries SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C');

-- Drop existing search_entries function if it exists (with all overloads)
DROP FUNCTION IF EXISTS search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, INTEGER, INTEGER);

-- Create search function with filters
CREATE FUNCTION search_entries(
  search_query TEXT,
  user_id_param UUID,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL,
  mood_filter TEXT DEFAULT NULL,
  folder_id_param UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  entry_date DATE,
  mood TEXT,
  word_count INTEGER,
  cover_image_url TEXT,
  folder_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
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
    e.cover_image_url,
    e.folder_id,
    e.created_at,
    e.updated_at,
    ts_rank(e.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM entries e
  WHERE e.user_id = user_id_param
    AND e.search_vector @@ websearch_to_tsquery('english', search_query)
    AND (date_from IS NULL OR e.entry_date >= date_from)
    AND (date_to IS NULL OR e.entry_date <= date_to)
    AND (mood_filter IS NULL OR e.mood = mood_filter)
    AND (folder_id_param IS NULL OR e.folder_id = folder_id_param)
  ORDER BY rank DESC, e.entry_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, INTEGER, INTEGER) TO authenticated;

-- Drop existing search_suggestions function if it exists
DROP FUNCTION IF EXISTS search_suggestions(TEXT, UUID, INTEGER);

-- Create search suggestions function (for autocomplete)
CREATE FUNCTION search_suggestions(
  search_query TEXT,
  user_id_param UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH unique_words AS (
    SELECT DISTINCT unnest(string_to_array(lower(title), ' ')) AS word
    FROM entries
    WHERE user_id = user_id_param
      AND title ILIKE search_query || '%'
    LIMIT 100
  )
  SELECT word AS suggestion, 1 AS count
  FROM unique_words
  WHERE length(word) > 2
  ORDER BY word
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_suggestions(TEXT, UUID, INTEGER) TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, INTEGER, INTEGER) IS 'Full-text search for entries with filters';
COMMENT ON FUNCTION search_suggestions(TEXT, UUID, INTEGER) IS 'Provides autocomplete suggestions for search';
