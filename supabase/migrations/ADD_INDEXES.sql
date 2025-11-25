-- Performance Optimization Indexes
-- Run this in Supabase SQL Editor to improve query performance

-- ============================================
-- ENTRIES TABLE INDEXES
-- ============================================

-- User + Date queries (for timeline, calendar, stats)
CREATE INDEX IF NOT EXISTS idx_entries_user_date_desc 
ON entries(user_id, entry_date DESC);

-- User + Folder queries (for folder navigation)
CREATE INDEX IF NOT EXISTS idx_entries_user_folder 
ON entries(user_id, folder_id) 
WHERE folder_id IS NOT NULL;

-- User + Person queries (for person filtering)
CREATE INDEX IF NOT EXISTS idx_entries_user_person 
ON entries(user_id, person_id) 
WHERE person_id IS NOT NULL;

-- User + Mood queries (for mood filtering and statistics)
CREATE INDEX IF NOT EXISTS idx_entries_user_mood 
ON entries(user_id, mood) 
WHERE mood IS NOT NULL;

-- Full-text search optimization
CREATE INDEX IF NOT EXISTS idx_entries_search_vector 
ON entries USING GIN(search_vector);

-- Trigram indexes for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_entries_title_trgm 
ON entries USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_entries_content_trgm 
ON entries USING gin(content gin_trgm_ops);

-- ============================================
-- FOLDERS TABLE INDEXES
-- ============================================

-- User + Parent folder queries (for folder tree navigation)
CREATE INDEX IF NOT EXISTS idx_folders_user_parent 
ON folders(user_id, parent_id);

-- User + Folder type queries (for filtering system vs custom folders)
CREATE INDEX IF NOT EXISTS idx_folders_user_type 
ON folders(user_id, folder_type);

-- ============================================
-- PEOPLE TABLE INDEXES
-- ============================================

-- User queries
CREATE INDEX IF NOT EXISTS idx_people_user 
ON people(user_id);

-- User + Folder queries (for people in folders)
CREATE INDEX IF NOT EXISTS idx_people_user_folder 
ON people(user_id, folder_id) 
WHERE folder_id IS NOT NULL;

-- ============================================
-- STORIES TABLE INDEXES
-- ============================================

-- User queries
CREATE INDEX IF NOT EXISTS idx_stories_user 
ON stories(user_id);

-- User + Status queries (for filtering ongoing/completed stories)
CREATE INDEX IF NOT EXISTS idx_stories_user_status 
ON stories(user_id, status);

-- User + Favorite stories
CREATE INDEX IF NOT EXISTS idx_stories_user_favorite 
ON stories(user_id, is_favorite) 
WHERE is_favorite = true;

-- ============================================
-- GOALS TABLE INDEXES
-- ============================================

-- User queries
CREATE INDEX IF NOT EXISTS idx_goals_user 
ON goals(user_id);

-- User + Completion status
CREATE INDEX IF NOT EXISTS idx_goals_user_completed 
ON goals(user_id, is_completed);

-- User + Category queries
CREATE INDEX IF NOT EXISTS idx_goals_user_category 
ON goals(user_id, category);

-- ============================================
-- REMINDERS TABLE INDEXES
-- ============================================

-- User + Reminder date queries (for upcoming reminders)
CREATE INDEX IF NOT EXISTS idx_reminders_user_date 
ON reminders(user_id, reminder_date);

-- Completed reminders
CREATE INDEX IF NOT EXISTS idx_reminders_user_completed 
ON reminders(user_id, is_completed, reminder_date);

-- ============================================
-- JUNCTION TABLES INDEXES
-- ============================================

-- Entry-People relationships (already exists, but verify)
CREATE INDEX IF NOT EXISTS idx_entry_people_entry_id 
ON entry_people(entry_id);

CREATE INDEX IF NOT EXISTS idx_entry_people_person_id 
ON entry_people(person_id);

-- Story-Entries relationships
CREATE INDEX IF NOT EXISTS idx_story_entries_story_id 
ON story_entries(story_id);

CREATE INDEX IF NOT EXISTS idx_story_entries_entry_id 
ON story_entries(entry_id);

-- ============================================
-- ANALYZE TABLES FOR BETTER QUERY PLANNING
-- ============================================

ANALYZE entries;
ANALYZE folders;
ANALYZE people;
ANALYZE stories;
ANALYZE goals;
ANALYZE reminders;
ANALYZE entry_people;
ANALYZE story_entries;

-- ============================================
-- VACUUM TABLES (optional, for maintenance)
-- ============================================

-- Uncomment and run periodically to reclaim storage and update statistics
-- VACUUM ANALYZE entries;
-- VACUUM ANALYZE folders;
-- VACUUM ANALYZE people;
-- VACUUM ANALYZE stories;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('entries', 'folders', 'people', 'stories', 'goals', 'reminders', 'entry_people', 'story_entries')
ORDER BY tablename, indexname;
