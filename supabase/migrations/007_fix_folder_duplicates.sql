-- ============================================
-- FIX DUPLICATE FOLDER ISSUE
-- Add proper unique constraint for date folders
-- ============================================

-- Drop old constraint first
ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_user_id_parent_id_name_key;

-- STEP 1: Clean up any existing duplicate date folders (keep oldest, delete rest)
-- This must happen BEFORE creating the unique index
DELETE FROM folders a USING folders b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.folder_type = b.folder_type
  AND a.folder_type IN ('year', 'month', 'day')
  AND COALESCE(a.year, 0) = COALESCE(b.year, 0)
  AND COALESCE(a.month, 0) = COALESCE(b.month, 0)
  AND COALESCE(a.day, 0) = COALESCE(b.day, 0);

-- STEP 2: Now add better unique constraint for date-based folders
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_date_folders 
ON folders(user_id, folder_type, year, month, day) 
WHERE folder_type IN ('year', 'month', 'day');

-- STEP 3: Keep constraint for custom folders (by name within same parent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_custom_folders
ON folders(user_id, parent_id, name)
WHERE folder_type = 'custom';
