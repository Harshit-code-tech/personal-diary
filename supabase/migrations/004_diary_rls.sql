-- ============================================
-- RLS POLICIES FOR NEW DIARY STRUCTURE
-- Run this AFTER 003_diary_structure.sql
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ENTRIES POLICIES
-- ============================================

-- Users can view their own entries
CREATE POLICY IF NOT EXISTS "Users can view own entries"
ON entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own entries
CREATE POLICY IF NOT EXISTS "Users can create own entries"
ON entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY IF NOT EXISTS "Users can update own entries"
ON entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY IF NOT EXISTS "Users can delete own entries"
ON entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FOLDERS POLICIES
-- ============================================

-- Users can view their own folders
CREATE POLICY IF NOT EXISTS "Users can view own folders"
ON folders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own folders
CREATE POLICY IF NOT EXISTS "Users can create own folders"
ON folders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY IF NOT EXISTS "Users can update own folders"
ON folders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY IF NOT EXISTS "Users can delete own folders"
ON folders FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PEOPLE POLICIES
-- ============================================

-- Users can view their own people
CREATE POLICY IF NOT EXISTS "Users can view own people"
ON people FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own people
CREATE POLICY IF NOT EXISTS "Users can create own people"
ON people FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own people
CREATE POLICY IF NOT EXISTS "Users can update own people"
ON people FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own people
CREATE POLICY IF NOT EXISTS "Users can delete own people"
ON people FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- ENTRY IMAGES POLICIES
-- ============================================

-- Users can view images from their own entries
CREATE POLICY IF NOT EXISTS "Users can view own entry images"
ON entry_images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM entries
    WHERE entries.id = entry_images.entry_id
    AND entries.user_id = auth.uid()
  )
);

-- Users can add images to their own entries
CREATE POLICY IF NOT EXISTS "Users can add images to own entries"
ON entry_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entries
    WHERE entries.id = entry_images.entry_id
    AND entries.user_id = auth.uid()
  )
);

-- Users can delete images from their own entries
CREATE POLICY IF NOT EXISTS "Users can delete own entry images"
ON entry_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM entries
    WHERE entries.id = entry_images.entry_id
    AND entries.user_id = auth.uid()
  )
);

-- ============================================
-- MEMORIES POLICIES
-- ============================================

-- Users can view their own memories
CREATE POLICY IF NOT EXISTS "Users can view own memories"
ON memories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own memories
CREATE POLICY IF NOT EXISTS "Users can create own memories"
ON memories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own memories
CREATE POLICY IF NOT EXISTS "Users can update own memories"
ON memories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own memories
CREATE POLICY IF NOT EXISTS "Users can delete own memories"
ON memories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for diary structure created successfully!';
  RAISE NOTICE 'All new tables are now secured with Row Level Security';
END $$;
