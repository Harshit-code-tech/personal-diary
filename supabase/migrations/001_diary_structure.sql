-- ============================================
-- NEW DATABASE SCHEMA FOR PROPER DIARY SYSTEM
-- Run this AFTER the main migrations
-- ============================================

-- ============================================
-- UTILITY FUNCTION: Update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. FOLDERS TABLE (Year/Month/Day hierarchy + Custom folders)
-- ============================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE, -- For nested folders
  
  name VARCHAR(255) NOT NULL,
  folder_type VARCHAR(50) DEFAULT 'custom' CHECK (folder_type IN ('year', 'month', 'day', 'custom', 'person', 'story')),
  icon VARCHAR(10) DEFAULT '📁',
  color VARCHAR(7) DEFAULT '#D4A574',
  
  -- For date-based folders
  year INTEGER,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  day INTEGER CHECK (day >= 1 AND day <= 31),
  
  -- Order and metadata
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, parent_id, name)
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_type ON folders(folder_type);
CREATE INDEX idx_folders_date ON folders(user_id, year, month, day) WHERE folder_type IN ('year', 'month', 'day');

-- ============================================
-- 2. PEOPLE TABLE (For relationship-based organization)
-- ============================================
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100), -- 'Mother', 'Friend', 'Partner', etc.
  avatar_url TEXT,
  birthday DATE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_folder_id ON people(folder_id);

-- ============================================
-- 3. ENTRIES TABLE (Complete recreation with new structure)
-- ============================================
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Metadata
  mood VARCHAR(50),
  story_category VARCHAR(100),
  emotions TEXT[],
  weather VARCHAR(50),
  location VARCHAR(255),
  word_count INTEGER DEFAULT 0,
  
  -- Dates
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_folder_id ON entries(folder_id);
CREATE INDEX idx_entries_person_id ON entries(person_id);
CREATE INDEX idx_entries_story_category ON entries(story_category);
CREATE INDEX idx_entries_entry_date ON entries(entry_date);
CREATE INDEX idx_entries_created_at ON entries(created_at);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ENTRY IMAGES TABLE (Proper image management)
-- ============================================
CREATE TABLE IF NOT EXISTS entry_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entry_images_entry_id ON entry_images(entry_id);

-- ============================================
-- 5. MEMORIES TABLE (Special memories about people/events)
-- ============================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  memory_date DATE,
  
  tags TEXT[],
  emotions TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_person_id ON memories(person_id);
CREATE INDEX idx_memories_folder_id ON memories(folder_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for folders
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for people
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for memories
CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto-create folder hierarchy
-- ============================================
CREATE OR REPLACE FUNCTION create_date_folders(p_user_id UUID, p_entry_date DATE)
RETURNS UUID AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM p_entry_date);
  v_month INTEGER := EXTRACT(MONTH FROM p_entry_date);
  v_day INTEGER := EXTRACT(DAY FROM p_entry_date);
  v_year_folder_id UUID;
  v_month_folder_id UUID;
  v_day_folder_id UUID;
  v_month_name TEXT;
BEGIN
  -- Create or get year folder
  INSERT INTO folders (user_id, name, folder_type, year, sort_order, icon)
  VALUES (p_user_id, v_year::TEXT, 'year', v_year, v_year, '📅')
  ON CONFLICT (user_id, parent_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_year_folder_id;
  
  -- Create or get month folder
  v_month_name := TO_CHAR(p_entry_date, 'Month');
  INSERT INTO folders (user_id, parent_id, name, folder_type, year, month, sort_order, icon)
  VALUES (p_user_id, v_year_folder_id, TRIM(v_month_name), 'month', v_year, v_month, v_month, '📆')
  ON CONFLICT (user_id, parent_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_month_folder_id;
  
  -- Create or get day folder
  INSERT INTO folders (user_id, parent_id, name, folder_type, year, month, day, sort_order, icon)
  VALUES (p_user_id, v_month_folder_id, 'Day ' || v_day, 'day', v_year, v_month, v_day, v_day, '📝')
  ON CONFLICT (user_id, parent_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_day_folder_id;
  
  RETURN v_day_folder_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-assign entry to date folder
-- ============================================
CREATE OR REPLACE FUNCTION auto_assign_entry_folder()
RETURNS TRIGGER AS $$
DECLARE
  v_folder_id UUID;
BEGIN
  -- Only auto-assign if no folder specified
  IF NEW.folder_id IS NULL THEN
    v_folder_id := create_date_folders(NEW.user_id, NEW.entry_date::DATE);
    NEW.folder_id := v_folder_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_entry_to_folder
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_entry_folder();

-- ============================================
-- SEED DEFAULT FOLDERS
-- ============================================
CREATE OR REPLACE FUNCTION seed_user_folders(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_people_folder_id UUID;
  v_stories_folder_id UUID;
BEGIN
  -- Create "People" root folder
  INSERT INTO folders (user_id, name, folder_type, icon, color, sort_order)
  VALUES (p_user_id, 'People', 'custom', '👥', '#E74C3C', 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_people_folder_id;
  
  -- Create "Stories" root folder
  INSERT INTO folders (user_id, name, folder_type, icon, color, sort_order)
  VALUES (p_user_id, 'Stories', 'story', '📚', '#3498DB', 2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_stories_folder_id;
  
  -- Create "My Diary" root folder (for date-based entries)
  INSERT INTO folders (user_id, name, folder_type, icon, color, sort_order)
  VALUES (p_user_id, 'My Diary', 'custom', '📔', '#D4A574', 0)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'New diary schema created successfully!';
  RAISE NOTICE 'Features added:';
  RAISE NOTICE '- Folder hierarchy (Year/Month/Day)';
  RAISE NOTICE '- People categorization';
  RAISE NOTICE '- Story collections';
  RAISE NOTICE '- Memory tracking';
  RAISE NOTICE '- Auto-folder assignment';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run seed_user_folders(user_id) for existing users';
END $$;
