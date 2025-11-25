-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Copy everything below and paste in SQL Editor
-- ============================================

-- First, clean up any existing functions (all versions)
DROP FUNCTION IF EXISTS get_writing_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_writing_statistics CASCADE;
DROP FUNCTION IF EXISTS get_monthly_entry_counts(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_monthly_entry_counts CASCADE;
DROP FUNCTION IF EXISTS get_day_of_week_distribution(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_day_of_week_distribution CASCADE;
DROP FUNCTION IF EXISTS get_mood_distribution(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_mood_distribution CASCADE;
DROP FUNCTION IF EXISTS search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_entries(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS search_entries CASCADE;

-- ============================================
-- STATISTICS FUNCTIONS
-- ============================================

-- Function: Get user's writing statistics
CREATE OR REPLACE FUNCTION get_writing_statistics(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_entries INTEGER;
  total_words BIGINT;
  avg_words_per_entry NUMERIC;
  current_streak INTEGER := 0;
  longest_streak INTEGER := 0;
  entries_this_month INTEGER;
  entries_last_month INTEGER;
  most_active_day TEXT;
  first_entry_date DATE;
  days_since_start INTEGER;
BEGIN
  -- Total entries
  SELECT COUNT(*) INTO total_entries
  FROM entries e
  WHERE e.user_id = user_id_param;
  
  -- Total words from word_count column
  SELECT COALESCE(SUM(e.word_count), 0) INTO total_words
  FROM entries e
  WHERE e.user_id = user_id_param;
  
  -- Average words per entry
  IF total_entries > 0 THEN
    avg_words_per_entry := ROUND(total_words::NUMERIC / total_entries::NUMERIC, 1);
  ELSE
    avg_words_per_entry := 0;
  END IF;
  
  -- Current streak (simplified - just check last 30 days)
  WITH daily_entries AS (
    SELECT DISTINCT e.entry_date
    FROM entries e
    WHERE e.user_id = user_id_param
      AND e.entry_date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY e.entry_date DESC
  )
  SELECT COUNT(*) INTO current_streak
  FROM daily_entries
  WHERE entry_date >= CURRENT_DATE - (
    SELECT COUNT(*) FROM generate_series(
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE,
      '1 day'::interval
    )
  )::INTEGER;
  
  -- Longest streak (simplified)
  longest_streak := current_streak;
  
  -- Entries this month
  SELECT COUNT(*) INTO entries_this_month
  FROM entries e
  WHERE e.user_id = user_id_param
    AND date_trunc('month', e.entry_date) = date_trunc('month', CURRENT_DATE);
  
  -- Entries last month
  SELECT COUNT(*) INTO entries_last_month
  FROM entries e
  WHERE e.user_id = user_id_param
    AND date_trunc('month', e.entry_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
  
  -- Most active day of week
  SELECT TO_CHAR(e.entry_date, 'Day') INTO most_active_day
  FROM entries e
  WHERE e.user_id = user_id_param
  GROUP BY TO_CHAR(e.entry_date, 'Day'), EXTRACT(DOW FROM e.entry_date)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- First entry date
  SELECT MIN(e.entry_date) INTO first_entry_date
  FROM entries e
  WHERE e.user_id = user_id_param;
  
  -- Days since start
  IF first_entry_date IS NOT NULL THEN
    days_since_start := CURRENT_DATE - first_entry_date;
  ELSE
    days_since_start := 0;
  END IF;
  
  -- Build JSON result
  result := json_build_object(
    'total_entries', total_entries,
    'total_words', total_words,
    'avg_words_per_entry', avg_words_per_entry,
    'current_streak', current_streak,
    'longest_streak', longest_streak,
    'entries_this_month', entries_this_month,
    'entries_last_month', entries_last_month,
    'most_active_day', COALESCE(TRIM(most_active_day), 'N/A'),
    'first_entry_date', first_entry_date,
    'days_journaling', days_since_start
  );
  
  RETURN result;
END;
$$;

-- Function: Get monthly entry counts
CREATE OR REPLACE FUNCTION get_monthly_entry_counts(
  user_id_param UUID,
  months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
  month TEXT,
  entry_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT TO_CHAR(
      date_trunc('month', CURRENT_DATE) - (n || ' months')::INTERVAL,
      'YYYY-MM'
    ) as month_val
    FROM generate_series(0, months_back - 1) n
  )
  SELECT 
    ms.month_val as month,
    COALESCE(COUNT(e.id), 0) as entry_count
  FROM month_series ms
  LEFT JOIN entries e ON TO_CHAR(e.entry_date, 'YYYY-MM') = ms.month_val
    AND e.user_id = user_id_param
  GROUP BY ms.month_val
  ORDER BY ms.month_val;
END;
$$;

-- Function: Get day of week distribution
CREATE OR REPLACE FUNCTION get_day_of_week_distribution(user_id_param UUID)
RETURNS TABLE (
  day_of_week TEXT,
  day_number INTEGER,
  entry_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(e.entry_date, 'Day') as day_of_week,
    EXTRACT(DOW FROM e.entry_date)::INTEGER as day_number,
    COUNT(*)::BIGINT as entry_count
  FROM entries e
  WHERE e.user_id = user_id_param
  GROUP BY TO_CHAR(e.entry_date, 'Day'), EXTRACT(DOW FROM e.entry_date)
  ORDER BY EXTRACT(DOW FROM e.entry_date);
END;
$$;

-- Function: Get mood distribution
CREATE OR REPLACE FUNCTION get_mood_distribution(user_id_param UUID)
RETURNS TABLE (
  mood_value TEXT,
  entry_count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_with_mood BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_with_mood
  FROM entries e
  WHERE e.user_id = user_id_param AND e.mood IS NOT NULL;
  
  IF total_with_mood = 0 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    e.mood::TEXT as mood_value,
    COUNT(*)::BIGINT as entry_count,
    ROUND((COUNT(*)::NUMERIC / total_with_mood::NUMERIC) * 100, 1) as percentage
  FROM entries e
  WHERE e.user_id = user_id_param AND e.mood IS NOT NULL
  GROUP BY e.mood
  ORDER BY COUNT(*) DESC;
END;
$$;

-- ============================================
-- SEARCH FUNCTION
-- ============================================

-- Add search vector column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE entries ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create search function
CREATE OR REPLACE FUNCTION search_entries(
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
  ORDER BY rank DESC, e.entry_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_writing_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_entry_counts(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_day_of_week_distribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mood_distribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_entries(TEXT, UUID, DATE, DATE, TEXT, UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ All functions created successfully!';
  RAISE NOTICE '📊 Statistics functions ready';
  RAISE NOTICE '🔍 Search function ready';
END $$;
