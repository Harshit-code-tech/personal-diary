-- Statistics Dashboard Functions
-- Provides writing statistics and analytics for the dashboard

-- ==================================================
-- PART 1: Writing Statistics
-- ==================================================

-- Function: Get user's writing statistics
CREATE OR REPLACE FUNCTION get_writing_statistics(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSON;
  total_entries INTEGER;
  total_words BIGINT;
  avg_words_per_entry NUMERIC;
  current_streak INTEGER;
  longest_streak INTEGER;
  entries_this_month INTEGER;
  entries_last_month INTEGER;
  most_active_day VARCHAR(10);
  first_entry_date DATE;
BEGIN
  -- Total entries
  SELECT COUNT(*) INTO total_entries
  FROM entries
  WHERE user_id = user_id_param;
  
  -- Total words (approximate from content length)
  SELECT COALESCE(SUM(array_length(regexp_split_to_array(content, '\s+'), 1)), 0) INTO total_words
  FROM entries
  WHERE user_id = user_id_param AND content IS NOT NULL;
  
  -- Average words per entry
  IF total_entries > 0 THEN
    avg_words_per_entry := ROUND(total_words::NUMERIC / total_entries::NUMERIC, 1);
  ELSE
    avg_words_per_entry := 0;
  END IF;
  
  -- Current streak (consecutive days with entries)
  WITH RECURSIVE date_series AS (
    SELECT CURRENT_DATE as check_date, 0 as streak
    UNION ALL
    SELECT 
      (check_date - INTERVAL '1 day')::DATE,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM entries 
          WHERE user_id = user_id_param 
          AND entry_date = (check_date - INTERVAL '1 day')::DATE
        ) THEN streak + 1
        ELSE streak
      END
    FROM date_series
    WHERE streak = (SELECT MAX(streak) FROM date_series)
      AND streak < 365  -- Limit to 1 year
      AND EXISTS (
        SELECT 1 FROM entries 
        WHERE user_id = user_id_param 
        AND entry_date = (check_date - INTERVAL '1 day')::DATE
      )
  )
  SELECT COALESCE(MAX(streak), 0) INTO current_streak FROM date_series;
  
  -- Longest streak ever (simplified version)
  SELECT COALESCE(MAX(streak_length), 0) INTO longest_streak
  FROM (
    SELECT 
      entry_date,
      entry_date - (ROW_NUMBER() OVER (ORDER BY entry_date))::INTEGER as streak_group
    FROM entries
    WHERE user_id = user_id_param
  ) grouped
  CROSS JOIN LATERAL (
    SELECT COUNT(*) as streak_length
    FROM entries
    WHERE user_id = user_id_param
      AND entry_date - (ROW_NUMBER() OVER (ORDER BY entry_date))::INTEGER = grouped.streak_group
  ) streak_calc;
  
  -- Entries this month
  SELECT COUNT(*) INTO entries_this_month
  FROM entries
  WHERE user_id = user_id_param
    AND EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM entry_date) = EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Entries last month
  SELECT COUNT(*) INTO entries_last_month
  FROM entries
  WHERE user_id = user_id_param
    AND EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
    AND EXTRACT(MONTH FROM entry_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month');
  
  -- Most active day of week
  SELECT TO_CHAR(entry_date, 'Day') INTO most_active_day
  FROM entries
  WHERE user_id = user_id_param
  GROUP BY TO_CHAR(entry_date, 'Day'), EXTRACT(DOW FROM entry_date)
  ORDER BY COUNT(*) DESC, EXTRACT(DOW FROM entry_date)
  LIMIT 1;
  
  -- First entry date
  SELECT MIN(entry_date) INTO first_entry_date
  FROM entries
  WHERE user_id = user_id_param;
  
  -- Build JSON result
  result := json_build_object(
    'total_entries', total_entries,
    'total_words', total_words,
    'avg_words_per_entry', avg_words_per_entry,
    'current_streak', current_streak,
    'longest_streak', longest_streak,
    'entries_this_month', entries_this_month,
    'entries_last_month', entries_last_month,
    'most_active_day', TRIM(most_active_day),
    'first_entry_date', first_entry_date,
    'days_journaling', CASE 
      WHEN first_entry_date IS NOT NULL 
      THEN CURRENT_DATE - first_entry_date 
      ELSE 0 
    END
  );
  
  RETURN result;
END;
$$;

-- Function: Get monthly entry counts for chart
CREATE OR REPLACE FUNCTION get_monthly_entry_counts(
  user_id_param UUID,
  months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
  month VARCHAR(7),
  entry_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT 
      TO_CHAR(
        CURRENT_DATE - (generate_series(0, months_back - 1) || ' months')::INTERVAL,
        'YYYY-MM'
      ) as month
  )
  SELECT 
    ms.month,
    COALESCE(COUNT(e.id), 0) as entry_count
  FROM month_series ms
  LEFT JOIN entries e ON TO_CHAR(e.entry_date, 'YYYY-MM') = ms.month
    AND e.user_id = user_id_param
  GROUP BY ms.month
  ORDER BY ms.month;
END;
$$;

-- Function: Get day of week distribution
CREATE OR REPLACE FUNCTION get_day_of_week_distribution(user_id_param UUID)
RETURNS TABLE (
  day_of_week VARCHAR(10),
  day_number INTEGER,
  entry_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(entry_date, 'Day') as day_of_week,
    EXTRACT(DOW FROM entry_date)::INTEGER as day_number,
    COUNT(*) as entry_count
  FROM entries
  WHERE user_id = user_id_param
  GROUP BY TO_CHAR(entry_date, 'Day'), EXTRACT(DOW FROM entry_date)
  ORDER BY EXTRACT(DOW FROM entry_date);
END;
$$;

-- Function: Get mood distribution
CREATE OR REPLACE FUNCTION get_mood_distribution(user_id_param UUID)
RETURNS TABLE (
  mood VARCHAR(50),
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  total_with_mood BIGINT;
BEGIN
  -- Get total entries with mood
  SELECT COUNT(*) INTO total_with_mood
  FROM entries
  WHERE user_id = user_id_param AND mood IS NOT NULL;
  
  IF total_with_mood = 0 THEN
    total_with_mood := 1;  -- Avoid division by zero
  END IF;
  
  RETURN QUERY
  SELECT 
    e.mood,
    COUNT(*) as count,
    ROUND((COUNT(*)::NUMERIC / total_with_mood::NUMERIC) * 100, 1) as percentage
  FROM entries e
  WHERE e.user_id = user_id_param AND e.mood IS NOT NULL
  GROUP BY e.mood
  ORDER BY count DESC;
END;
$$;

-- ==================================================
-- PART 2: Grant Permissions
-- ==================================================

GRANT EXECUTE ON FUNCTION get_writing_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_entry_counts(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_day_of_week_distribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mood_distribution(UUID) TO authenticated;

-- ==================================================
-- Success Message
-- ==================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Statistics functions created!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Available Functions:';
  RAISE NOTICE '  • get_writing_statistics(user_id)';
  RAISE NOTICE '  • get_monthly_entry_counts(user_id, months_back)';
  RAISE NOTICE '  • get_day_of_week_distribution(user_id)';
  RAISE NOTICE '  • get_mood_distribution(user_id)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Ready for dashboard implementation!';
END $$;
