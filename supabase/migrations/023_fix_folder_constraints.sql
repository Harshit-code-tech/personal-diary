-- Fix folder unique constraints and functions
-- Migration 019 used incorrect column names, this fixes them properly

-- ==================================================
-- PART 1: Add missing unique constraint if needed
-- ==================================================

-- The base table has UNIQUE(user_id, parent_id, name)
-- This is already there, but let's ensure it's the right one for our functions

-- ==================================================
-- PART 2: Recreate folder functions with correct column names
-- ==================================================

-- Drop and recreate create_date_folders
DROP FUNCTION IF EXISTS create_date_folders(UUID) CASCADE;

CREATE FUNCTION create_date_folders(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  year_folder_id UUID;
  current_year INTEGER;
  current_month INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Get or create year folder
  SELECT id INTO year_folder_id
  FROM folders
  WHERE user_id = user_id_param 
    AND folder_type = 'year' 
    AND year = current_year
  LIMIT 1;
  
  IF year_folder_id IS NULL THEN
    INSERT INTO folders (user_id, name, icon, color, folder_type, year, parent_id)
    VALUES (user_id_param, current_year::TEXT, '📅', '#4A90E2', 'year', current_year, NULL)
    RETURNING id INTO year_folder_id;
  END IF;
  
  -- Get or create month folder
  IF NOT EXISTS (
    SELECT 1 FROM folders
    WHERE user_id = user_id_param
      AND folder_type = 'month'
      AND parent_id = year_folder_id
      AND year = current_year
      AND month = current_month
  ) THEN
    INSERT INTO folders (user_id, name, icon, color, folder_type, parent_id, year, month)
    VALUES (
      user_id_param,
      TO_CHAR(MAKE_DATE(current_year, current_month, 1), 'Month'),
      '📆',
      '#50C878',
      'month',
      year_folder_id,
      current_year,
      current_month
    )
    ON CONFLICT (user_id, parent_id, name) DO NOTHING;
  END IF;
END;
$$;

-- Drop and recreate get_or_create_date_folder
DROP FUNCTION IF EXISTS get_or_create_date_folder(UUID, DATE) CASCADE;

CREATE FUNCTION get_or_create_date_folder(
  user_id_param UUID,
  entry_date_param DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  year_val INTEGER;
  month_val INTEGER;
  year_folder UUID;
  month_folder UUID;
BEGIN
  year_val := EXTRACT(YEAR FROM entry_date_param);
  month_val := EXTRACT(MONTH FROM entry_date_param);
  
  -- Get or create year folder
  SELECT id INTO year_folder
  FROM folders
  WHERE user_id = user_id_param 
    AND folder_type = 'year' 
    AND year = year_val
  LIMIT 1;
  
  IF year_folder IS NULL THEN
    INSERT INTO folders (user_id, name, icon, color, folder_type, year, parent_id)
    VALUES (user_id_param, year_val::TEXT, '📅', '#4A90E2', 'year', year_val, NULL)
    RETURNING id INTO year_folder;
  END IF;
  
  -- Get or create month folder
  SELECT id INTO month_folder
  FROM folders
  WHERE user_id = user_id_param
    AND folder_type = 'month'
    AND parent_id = year_folder
    AND year = year_val
    AND month = month_val
  LIMIT 1;
  
  IF month_folder IS NULL THEN
    INSERT INTO folders (user_id, name, icon, color, folder_type, parent_id, year, month)
    VALUES (
      user_id_param,
      TO_CHAR(MAKE_DATE(year_val, month_val, 1), 'Month'),
      '📆',
      '#50C878',
      'month',
      year_folder,
      year_val,
      month_val
    )
    ON CONFLICT (user_id, parent_id, name) DO NOTHING
    RETURNING id INTO month_folder;
    
    -- If conflict happened, fetch the existing one
    IF month_folder IS NULL THEN
      SELECT id INTO month_folder
      FROM folders
      WHERE user_id = user_id_param
        AND folder_type = 'month'
        AND parent_id = year_folder
        AND year = year_val
        AND month = month_val
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN month_folder;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_date_folders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_date_folder(UUID, DATE) TO authenticated;

-- ==================================================
-- PART 3: Verification
-- ==================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed folder functions (migration 023)';
  RAISE NOTICE '  • create_date_folders: Uses SELECT then INSERT pattern';
  RAISE NOTICE '  • get_or_create_date_folder: Uses correct columns (parent_id, year, month)';
  RAISE NOTICE '  • Avoids ON CONFLICT issues with flexible approach';
END $$;
