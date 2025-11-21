-- ============================================
-- ADD MISSING ENTRIES RLS POLICIES
-- Run this if you already ran 004 without entries policies
-- ============================================

-- Drop entries policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own entries" ON entries;
DROP POLICY IF EXISTS "Users can create own entries" ON entries;
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;

-- Enable RLS on entries (in case it wasn't enabled)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create entries policies
CREATE POLICY "Users can view own entries"
ON entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries"
ON entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
ON entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
ON entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Success
DO $$
BEGIN
  RAISE NOTICE 'Entries RLS policies added successfully!';
END $$;
