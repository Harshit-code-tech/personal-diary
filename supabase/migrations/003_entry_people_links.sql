-- Add person_id to entries table for linking (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'person_id'
  ) THEN
    ALTER TABLE entries ADD COLUMN person_id UUID REFERENCES people(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_entries_person_id ON entries(person_id);

-- Update RLS policies to include person filtering
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
CREATE POLICY "Users can view their own entries"
ON entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Create junction table for many-to-many relationship (one entry can mention multiple people)
CREATE TABLE IF NOT EXISTS entry_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id, person_id)
);

-- RLS for entry_people
ALTER TABLE entry_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their entry_people links"
ON entry_people FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM entries
    WHERE entries.id = entry_people.entry_id
    AND entries.user_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_entry_people_entry_id ON entry_people(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_people_person_id ON entry_people(person_id);
