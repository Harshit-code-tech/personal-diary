-- ============================================
-- ADD TAGS SYSTEM FOR FLEXIBLE ORGANIZATION
-- ============================================

-- Add tags column to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_entries_tags ON entries USING GIN(tags);

-- Function to search entries by tag
CREATE OR REPLACE FUNCTION search_entries_by_tag(
  p_user_id UUID,
  p_tag TEXT
) RETURNS TABLE(entry_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id
  FROM entries
  WHERE user_id = p_user_id
    AND p_tag = ANY(tags);
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM entries WHERE id IN (SELECT entry_id FROM search_entries_by_tag('user_id', 'work'));
