-- Update auto_assign_entry_folder to also set folder_id for backward compatibility
-- This ensures entries show up in the main list

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
  
  -- Set folder_id on entry for backward compatibility
  NEW.folder_id := default_folder_id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger as BEFORE INSERT to set folder_id
DROP TRIGGER IF EXISTS auto_assign_folder_trigger ON entries;
CREATE TRIGGER auto_assign_folder_trigger
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_entry_folder();

-- Create separate AFTER INSERT trigger for junction table
DROP FUNCTION IF EXISTS auto_assign_entry_folder_junction() CASCADE;

CREATE FUNCTION auto_assign_entry_folder_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert into junction table (entry now exists)
  INSERT INTO entry_folders (entry_id, folder_id)
  VALUES (NEW.id, NEW.folder_id)
  ON CONFLICT (entry_id, folder_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_assign_folder_junction_trigger ON entries;
CREATE TRIGGER auto_assign_folder_junction_trigger
  AFTER INSERT ON entries
  FOR EACH ROW
  WHEN (NEW.folder_id IS NOT NULL)
  EXECUTE FUNCTION auto_assign_entry_folder_junction();

-- Update existing entries without folder_id to have one
UPDATE entries e
SET folder_id = (
  SELECT ef.folder_id 
  FROM entry_folders ef 
  WHERE ef.entry_id = e.id 
  LIMIT 1
)
WHERE e.folder_id IS NULL
  AND EXISTS (SELECT 1 FROM entry_folders WHERE entry_id = e.id);

DO $$
BEGIN
  RAISE NOTICE '✅ Updated entry folder triggers';
  RAISE NOTICE '  • BEFORE INSERT: Sets folder_id on entry';
  RAISE NOTICE '  • AFTER INSERT: Inserts into entry_folders junction table';
  RAISE NOTICE '  • Backward compatible with folder_id column';
  RAISE NOTICE '  • Updated existing entries to have folder_id';
END $$;
