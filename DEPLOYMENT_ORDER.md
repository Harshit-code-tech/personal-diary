# 🚀 Deployment Order

## Step-by-Step Deployment Instructions

### 1️⃣ Run SQL Migrations in Supabase (REQUIRED)

Open Supabase Dashboard → SQL Editor, then run these files **in order**:

#### Migration 1: Update Search Function
**File**: `supabase/migrations/UPDATE_SEARCH_FUNCTION.sql`

**What it does**:
- Drops old search_entries function (8 parameters)
- Creates new version with 10 parameters
- Adds `person_id_param` and `story_id_param` filtering

**How to run**:
1. Open `UPDATE_SEARCH_FUNCTION.sql`
2. Copy entire file contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter
5. ✅ Should see: "Search function updated successfully!"

---

#### Migration 2: Add Performance Indexes
**File**: `supabase/migrations/ADD_INDEXES.sql`

**What it does**:
- Creates 15+ indexes on critical tables
- Enables pg_trgm extension for fuzzy search
- Runs ANALYZE on all tables

**How to run**:
1. Open `ADD_INDEXES.sql`
2. Copy entire file contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter
5. ⏳ Wait ~10-30 seconds
6. ✅ Should complete without errors

---

### 2️⃣ Test Search Filters (REQUIRED)

Before pushing to git, verify everything works:

#### Test 1: Person Filter
1. Go to `/app/search`
2. Select a person from dropdown
3. Click "Search"
4. ✅ Should show only entries linked to that person

#### Test 2: Story Filter
1. Select a story from dropdown
2. Click "Search"
3. ✅ Should show only entries in that story

#### Test 3: Folder Filter
1. Select a folder from dropdown
2. Click "Search"
3. ✅ Should show only entries in that folder

#### Test 4: Combined Filters
1. Select person + story + folder
2. Click "Search"
3. ✅ Should show entries matching ALL filters

---

### 3️⃣ Git Push (AFTER testing)

Once SQL migrations are run and tested:

```powershell
# Check what's changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: enhanced grey theme, fixed search filters, added toast system, improved accessibility"

# Push to master
git push origin master
```

---

## 📋 Quick Checklist

- [ ] Run `UPDATE_SEARCH_FUNCTION.sql` in Supabase
- [ ] Verify: "Search function updated successfully!" message
- [ ] Run `ADD_INDEXES.sql` in Supabase
- [ ] Wait for indexes to be created (~10-30 seconds)
- [ ] Test person filter in search
- [ ] Test story filter in search
- [ ] Test folder filter in search
- [ ] Test combined filters
- [ ] Git add all changes
- [ ] Git commit
- [ ] Git push origin master

---

## 🐛 Troubleshooting

### Error: "function search_entries already exists"
**Solution**: The DROP statements at the top should handle this. If not:
```sql
DROP FUNCTION IF EXISTS search_entries CASCADE;
```
Then re-run the migration.

### Error: "relation entry_people does not exist"
**Solution**: Run the migration that creates junction tables:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('entry_people', 'story_entries');
```

### Search filters not working
**Solution**: 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify function was updated:
```sql
SELECT pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'search_entries';
```
Should show 10 parameters.

---

## ✅ Success Indicators

After deployment, you should see:
- ✅ Search with person filter works
- ✅ Search with story filter works
- ✅ Search with folder filter works
- ✅ Faster page loads (from indexes)
- ✅ Grey theme looks warmer
- ✅ No console errors
- ✅ Git push successful

---

Ready to deploy! 🚀
