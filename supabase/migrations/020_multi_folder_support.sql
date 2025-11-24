-- Phase 6: Multi-Folder Support
-- Enable entries to belong to multiple folders (many-to-many relationship)

-- ==================================================
-- PART 1: Create Junction Table
-- ==================================================

-- Create the entry_folders junction table
CREATE TABLE IF NOT EXISTS entry_folders (
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (entry_id, folder_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_entry_folders_entry ON entry_folders(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_folders_folder ON entry_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_entry_folders_added_at ON entry_folders(added_at);

-- Add comment
COMMENT ON TABLE entry_folders IS 'Junction table enabling many-to-many relationship between entries and folders';

-- ==================================================
-- PART 2: Migrate Existing Data
-- ==================================================

-- Copy existing single-folder assignments to new junction table
INSERT INTO entry_folders (entry_id, folder_id, added_at)
SELECT id, folder_id, created_at
FROM entries 
WHERE folder_id IS NOT NULL
ON CONFLICT (entry_id, folder_id) DO NOTHING;

-- ==================================================
-- PART 3: RLS Policies for Junction Table
-- ==================================================

-- Enable RLS
ALTER TABLE entry_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their entry-folder links
CREATE POLICY "Users can view their entry folders"
  ON entry_folders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = entry_folders.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- Policy: Users can create entry-folder links
CREATE POLICY "Users can create entry folders"
  ON entry_folders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = entry_folders.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their entry-folder links
CREATE POLICY "Users can delete entry folders"
  ON entry_folders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = entry_folders.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- ==================================================
-- PART 4: Folder Metadata Enhancements
-- ==================================================

-- Add new columns for better folder organization
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_expanded BOOLEAN DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for sorting
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON folders(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_pinned ON folders(user_id, is_pinned) WHERE is_pinned = true;

-- ==================================================
-- PART 5: Helper Functions
-- ==================================================

-- Function: Get all folders for an entry
CREATE OR REPLACE FUNCTION get_entry_folders(entry_id_param UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  icon VARCHAR(10),
  color VARCHAR(7),
  folder_type VARCHAR(50),
  parent_id UUID,
  added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id, 
    f.name, 
    f.icon, 
    f.color, 
    f.folder_type,
    f.parent_id,
    ef.added_at
  FROM folders f
  JOIN entry_folders ef ON f.id = ef.folder_id
  WHERE ef.entry_id = entry_id_param
  ORDER BY ef.added_at DESC;
END;
$$;

-- Function: Get all entries in a folder with pagination
CREATE OR REPLACE FUNCTION get_folder_entries(
  folder_id_param UUID,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  entry_date DATE,
  mood VARCHAR(50),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  folder_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.content,
    e.entry_date,
    e.mood,
    e.created_at,
    e.updated_at,
    (SELECT COUNT(*) FROM entry_folders WHERE entry_id = e.id) as folder_count
  FROM entries e
  JOIN entry_folders ef ON e.id = ef.entry_id
  WHERE ef.folder_id = folder_id_param
    AND e.user_id = auth.uid()
  ORDER BY e.entry_date DESC, e.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Function: Get folder hierarchy path (breadcrumb)
CREATE OR REPLACE FUNCTION get_folder_path(folder_id_param UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  icon VARCHAR(10),
  level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_path AS (
    -- Start with the target folder
    SELECT 
      f.id,
      f.name,
      f.icon,
      f.parent_id,
      1 as level
    FROM folders f
    WHERE f.id = folder_id_param
    
    UNION ALL
    
    -- Recursively get parent folders
    SELECT 
      f.id,
      f.name,
      f.icon,
      f.parent_id,
      fp.level + 1
    FROM folders f
    JOIN folder_path fp ON f.id = fp.parent_id
  )
  SELECT 
    folder_path.id,
    folder_path.name,
    folder_path.icon,
    folder_path.level
  FROM folder_path
  ORDER BY level DESC;
END;
$$;

-- Function: Get entry count for all folders (optimized)
CREATE OR REPLACE FUNCTION get_folder_entry_counts(user_id_param UUID)
RETURNS TABLE (
  folder_id UUID,
  entry_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ef.folder_id,
    COUNT(DISTINCT ef.entry_id) as entry_count
  FROM entry_folders ef
  JOIN entries e ON ef.entry_id = e.id
  WHERE e.user_id = user_id_param
  GROUP BY ef.folder_id;
END;
$$;

-- Function: Prevent circular folder references
CREATE OR REPLACE FUNCTION prevent_circular_folders()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ancestor_id UUID;
  depth INTEGER := 0;
  max_depth INTEGER := 10;
BEGIN
  -- Only check if parent_id is being set
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  ancestor_id := NEW.parent_id;
  
  -- Walk up the tree to detect circular references
  WHILE ancestor_id IS NOT NULL AND depth < max_depth LOOP
    -- Check if we've reached the current folder (circular reference)
    IF ancestor_id = NEW.id THEN
      RAISE EXCEPTION 'Circular folder reference detected: folder cannot be its own ancestor';
    END IF;
    
    -- Get the next parent
    SELECT parent_id INTO ancestor_id
    FROM folders
    WHERE id = ancestor_id;
    
    depth := depth + 1;
  END LOOP;
  
  -- Check if max depth exceeded
  IF depth >= max_depth THEN
    RAISE EXCEPTION 'Folder hierarchy too deep (max % levels)', max_depth;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent circular references
DROP TRIGGER IF EXISTS check_circular_folders ON folders;
CREATE TRIGGER check_circular_folders
  BEFORE INSERT OR UPDATE OF parent_id ON folders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_folders();

-- ==================================================
-- PART 6: Update auto_assign_entry_folder Function
-- ==================================================

-- Update the trigger function to work with new system
DROP FUNCTION IF EXISTS auto_assign_entry_folder() CASCADE;

CREATE FUNCTION auto_assign_entry_folder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  default_folder_id UUID;
BEGIN
  -- Get or create the date-based folder
  default_folder_id := get_or_create_date_folder(NEW.user_id, NEW.entry_date);
  
  -- Insert into junction table (ignore if already exists)
  INSERT INTO entry_folders (entry_id, folder_id)
  VALUES (NEW.id, default_folder_id)
  ON CONFLICT (entry_id, folder_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER auto_assign_folder_trigger
  AFTER INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_entry_folder();

-- ==================================================
-- PART 7: Grant Permissions
-- ==================================================

GRANT SELECT ON entry_folders TO authenticated;
GRANT INSERT ON entry_folders TO authenticated;
GRANT DELETE ON entry_folders TO authenticated;

GRANT EXECUTE ON FUNCTION get_entry_folders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_folder_entries(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_folder_path(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_folder_entry_counts(UUID) TO authenticated;

-- ==================================================
-- PART 8: Verification & Stats
-- ==================================================

DO $$
DECLARE
  junction_count BIGINT;
  folder_count BIGINT;
  entry_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO junction_count FROM entry_folders;
  SELECT COUNT(*) INTO folder_count FROM folders;
  SELECT COUNT(*) INTO entry_count FROM entries;
  
  RAISE NOTICE '✅ Multi-folder support enabled!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Migration Statistics:';
  RAISE NOTICE '  • Folders: %', folder_count;
  RAISE NOTICE '  • Entries: %', entry_count;
  RAISE NOTICE '  • Entry-Folder Links: %', junction_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Junction table: entry_folders created';
  RAISE NOTICE '📁 New folder columns: is_expanded, sort_order, is_pinned, description';
  RAISE NOTICE '🔒 RLS policies: Enabled with 3 policies';
  RAISE NOTICE '⚡ Functions: 4 new helper functions created';
  RAISE NOTICE '🛡️  Circular reference prevention: Active';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Entries can now belong to multiple folders!';
END $$;
