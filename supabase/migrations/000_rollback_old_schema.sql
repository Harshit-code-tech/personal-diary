-- ============================================
-- ROLLBACK SCRIPT: Remove Old Schema (001 & 002)
-- Run this BEFORE running 003_diary_structure.sql
-- ============================================

-- This script safely removes all tables, policies, and functions
-- created by 001_initial_schema.sql and 002_rls_policies.sql

-- ============================================
-- Step 1: Drop all RLS policies from 002
-- ============================================

DO $$ 
BEGIN
    -- Drop user_settings policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
        DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
    END IF;

    -- Drop entries policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entries') THEN
        DROP POLICY IF EXISTS "Users can view own entries" ON entries;
        DROP POLICY IF EXISTS "Users can insert own entries" ON entries;
        DROP POLICY IF EXISTS "Users can update own entries" ON entries;
        DROP POLICY IF EXISTS "Users can delete own entries" ON entries;
    END IF;

    -- Drop images policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'images') THEN
        DROP POLICY IF EXISTS "Users can view own images" ON images;
        DROP POLICY IF EXISTS "Users can insert own images" ON images;
        DROP POLICY IF EXISTS "Users can update own images" ON images;
        DROP POLICY IF EXISTS "Users can delete own images" ON images;
    END IF;

    -- Drop tags policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
        DROP POLICY IF EXISTS "Users can view own tags" ON tags;
        DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
        DROP POLICY IF EXISTS "Users can update own tags" ON tags;
        DROP POLICY IF EXISTS "Users can delete own tags" ON tags;
    END IF;

    -- Drop entry_tags policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entry_tags') THEN
        DROP POLICY IF EXISTS "Users can view own entry_tags" ON entry_tags;
        DROP POLICY IF EXISTS "Users can insert own entry_tags" ON entry_tags;
        DROP POLICY IF EXISTS "Users can delete own entry_tags" ON entry_tags;
    END IF;

    -- Drop entry_templates policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entry_templates') THEN
        DROP POLICY IF EXISTS "Users can view own entry_templates" ON entry_templates;
        DROP POLICY IF EXISTS "Everyone can view system templates" ON entry_templates;
        DROP POLICY IF EXISTS "Users can insert own templates" ON entry_templates;
        DROP POLICY IF EXISTS "Users can update own templates" ON entry_templates;
        DROP POLICY IF EXISTS "Users can delete own templates" ON entry_templates;
    END IF;

    -- Drop streaks policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'streaks') THEN
        DROP POLICY IF EXISTS "Users can view own streaks" ON streaks;
        DROP POLICY IF EXISTS "Users can insert own streaks" ON streaks;
        DROP POLICY IF EXISTS "Users can update own streaks" ON streaks;
    END IF;

    -- Drop email_queue policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue') THEN
        DROP POLICY IF EXISTS "Users can view own email_queue" ON email_queue;
    END IF;
END $$;

-- ============================================
-- Step 2: Drop all triggers and functions
-- ============================================

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_entry_templates_updated_at ON entry_templates;
DROP TRIGGER IF EXISTS update_entries_last_edited_at ON entries;
DROP TRIGGER IF EXISTS update_streak_on_entry ON entries;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_streak() CASCADE;

-- ============================================
-- Step 3: Drop all tables (in reverse dependency order)
-- ============================================

-- Disable RLS first
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entry_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entry_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS habit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS moods DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;

-- Drop junction/dependent tables first
DROP TABLE IF EXISTS entry_tags CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS moods CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS entry_templates CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- ============================================
-- Step 4: Drop indexes (if they still exist)
-- ============================================

DROP INDEX IF EXISTS idx_templates_user_id;
DROP INDEX IF EXISTS idx_entries_user_id;
DROP INDEX IF EXISTS idx_entries_entry_date;
DROP INDEX IF EXISTS idx_entries_created_at;
DROP INDEX IF EXISTS idx_images_entry_id;
DROP INDEX IF EXISTS idx_images_user_id;
DROP INDEX IF EXISTS idx_tags_user_id;
DROP INDEX IF EXISTS idx_entry_tags_entry;
DROP INDEX IF EXISTS idx_entry_tags_tag;
DROP INDEX IF EXISTS idx_streaks_user_id;
DROP INDEX IF EXISTS idx_email_queue_user_id;
DROP INDEX IF EXISTS idx_email_queue_scheduled;
DROP INDEX IF EXISTS idx_email_queue_status;

-- ============================================
-- Verification: Check what's left
-- ============================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- DONE! Now you can run:
-- 1. 003_diary_structure.sql (new schema)
-- 2. 004_diary_rls.sql (new RLS policies)
-- ============================================
