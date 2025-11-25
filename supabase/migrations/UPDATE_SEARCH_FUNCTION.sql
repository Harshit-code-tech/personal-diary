-- ============================================
-- UPDATE SEARCH FUNCTION - Add Person & Story Filtering
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old version of search_entries function
DROP FUNCTION IF EXISTS search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, UUID, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_entries(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS search_entries CASCADE;

-- Create updated search function with person and story filtering
CREATE OR REPLACE FUNCTION search_entries(
  search_query TEXT,
  user_id_param UUID,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL,
  mood_filter TEXT DEFAULT NULL,
  folder_id_param UUID DEFAULT NULL,
  person_id_param UUID DEFAULT NULL,
  story_id_param UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  entry_date DATE,
  mood TEXT,
  word_count INTEGER,
  folder_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If search vector is null, update it
  UPDATE entries e
  SET search_vector = to_tsvector('english', COALESCE(e.title, '') || ' ' || COALESCE(e.content, ''))
  WHERE e.user_id = user_id_param AND e.search_vector IS NULL;

  RETURN QUERY
  SELECT 
    e.id,
    e.title::TEXT,
    e.content::TEXT,
    e.entry_date::DATE,
    e.mood::TEXT,
    e.word_count,
    e.folder_id,
    e.created_at,
    e.updated_at,
    COALESCE(
      ts_rank(
        COALESCE(e.search_vector, to_tsvector('english', COALESCE(e.title, '') || ' ' || COALESCE(e.content, ''))),
        plainto_tsquery('english', search_query)
      ),
      0
    )::REAL AS rank
  FROM entries e
  WHERE e.user_id = user_id_param
    AND (
      search_query = '' 
      OR e.title ILIKE '%' || search_query || '%'
      OR e.content ILIKE '%' || search_query || '%'
    )
    AND (date_from IS NULL OR e.entry_date::DATE >= date_from)
    AND (date_to IS NULL OR e.entry_date::DATE <= date_to)
    AND (mood_filter IS NULL OR e.mood = mood_filter)
    AND (folder_id_param IS NULL OR e.folder_id = folder_id_param)
    AND (
      person_id_param IS NULL 
      OR EXISTS (
        SELECT 1 FROM entry_people ep 
        WHERE ep.entry_id = e.id AND ep.person_id = person_id_param
      )
    )
    AND (
      story_id_param IS NULL 
      OR EXISTS (
        SELECT 1 FROM story_entries se 
        WHERE se.entry_id = e.id AND se.story_id = story_id_param
      )
    )
  ORDER BY rank DESC, e.entry_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- Verification query
DO $$
BEGIN
  RAISE NOTICE '✅ Search function updated successfully!';
  RAISE NOTICE '🔍 Now supports person_id and story_id filtering';
  RAISE NOTICE '📋 Function signature: search_entries(search_query, user_id, date_from, date_to, mood_filter, folder_id, person_id, story_id, limit, offset)';
END $$;

-- Verify function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'search_entries';
