-- ============================================
-- AUTO-CREATE DATE FOLDERS (PREVENTS DUPLICATES)
-- This function finds existing date folders or creates them
-- Ensures only ONE folder per date
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_date_folder(
  p_user_id UUID,
  p_date DATE
) RETURNS UUID AS $$
DECLARE
  v_year_id UUID;
  v_month_id UUID;
  v_day_id UUID;
  v_year_num INTEGER;
  v_month_num INTEGER;
  v_day_num INTEGER;
  v_month_name TEXT;
BEGIN
  v_year_num := EXTRACT(YEAR FROM p_date);
  v_month_num := EXTRACT(MONTH FROM p_date);
  v_day_num := EXTRACT(DAY FROM p_date);
  v_month_name := TO_CHAR(p_date, 'Month');
  
  -- ============================================
  -- STEP 1: Find or create YEAR folder
  -- ============================================
  SELECT id INTO v_year_id
  FROM folders
  WHERE user_id = p_user_id
    AND folder_type = 'year'
    AND year = v_year_num
    AND parent_id IS NULL;
  
  IF v_year_id IS NULL THEN
    INSERT INTO folders (user_id, name, folder_type, year, icon, color, sort_order, parent_id)
    VALUES (
      p_user_id, 
      v_year_num::TEXT, 
      'year', 
      v_year_num,
      '📅',
      '#3B82F6',
      v_year_num,
      NULL
    )
    RETURNING id INTO v_year_id;
  END IF;
  
  -- ============================================
  -- STEP 2: Find or create MONTH folder
  -- ============================================
  SELECT id INTO v_month_id
  FROM folders
  WHERE user_id = p_user_id
    AND folder_type = 'month'
    AND parent_id = v_year_id
    AND year = v_year_num
    AND month = v_month_num;
  
  IF v_month_id IS NULL THEN
    INSERT INTO folders (user_id, name, folder_type, parent_id, year, month, icon, color, sort_order)
    VALUES (
      p_user_id,
      TRIM(v_month_name),
      'month',
      v_year_id,
      v_year_num,
      v_month_num,
      '📆',
      '#10B981',
      v_month_num
    )
    RETURNING id INTO v_month_id;
  END IF;
  
  -- ============================================
  -- STEP 3: Find or create DAY folder
  -- ============================================
  SELECT id INTO v_day_id
  FROM folders
  WHERE user_id = p_user_id
    AND folder_type = 'day'
    AND parent_id = v_month_id
    AND year = v_year_num
    AND month = v_month_num
    AND day = v_day_num;
  
  IF v_day_id IS NULL THEN
    INSERT INTO folders (user_id, name, folder_type, parent_id, year, month, day, icon, color, sort_order)
    VALUES (
      p_user_id,
      'Day ' || v_day_num::TEXT,
      'day',
      v_month_id,
      v_year_num,
      v_month_num,
      v_day_num,
      '📝',
      '#8B5CF6',
      v_day_num
    )
    RETURNING id INTO v_day_id;
  END IF;
  
  RETURN v_day_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO GET ALL CHILD FOLDER IDs
-- Used when clicking on year/month to show all entries
-- ============================================

CREATE OR REPLACE FUNCTION get_folder_descendants(p_folder_id UUID)
RETURNS TABLE(folder_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    -- Start with the selected folder
    SELECT id FROM folders WHERE id = p_folder_id
    
    UNION ALL
    
    -- Get all children recursively
    SELECT f.id
    FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
  )
  SELECT id FROM folder_tree;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TEST THE FUNCTIONS (Optional - can delete after testing)
-- ============================================

-- Example: Get or create folder for today
-- SELECT get_or_create_date_folder(
--   'YOUR_USER_ID_HERE'::UUID,
--   CURRENT_DATE
-- );

-- Example: Get all descendants of a year folder
-- SELECT * FROM get_folder_descendants('YEAR_FOLDER_ID_HERE'::UUID);
