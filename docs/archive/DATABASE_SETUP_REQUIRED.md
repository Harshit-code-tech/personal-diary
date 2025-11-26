# 🗄️ Database Setup Required

## ⚠️ Important: Migration Required

The statistics and search features require database functions that need to be created in your Supabase instance.

## 🔧 How to Fix the Errors

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run these migration files in order:

**For Search Functionality:**
- Copy contents from: `supabase/migrations/016_full_text_search.sql`
- Paste and run in SQL Editor

**For Statistics Page:**
- Copy contents from: `supabase/migrations/021_statistics_functions.sql`
- Paste and run in SQL Editor

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd "d:\CODE\Project_Idea\personal diary"

# Run specific migrations
supabase db push
```

## 🐛 Current Errors

### Search Page Errors
```
Failed to load resource: the server responded with a status of 400
blmmcdqlipcrpsfodrww.supabase.co/rest/v1/rpc/search_entries:1
```

**Cause:** The `search_entries` RPC function doesn't exist in the database.

**Solution:** Run migration file `016_full_text_search.sql`

### Statistics Page Errors
```
Failed to load resource: the server responded with a status of 400
- get_writing_statistics
- get_monthly_entry_counts  
- get_day_of_week_distribution
- get_mood_distribution
```

**Cause:** The statistics RPC functions don't exist in the database.

**Solution:** Run migration file `021_statistics_functions.sql`

## ✅ Verification

After running the migrations, verify they work:

### Test Search Function
```sql
SELECT search_entries(
  'test',
  auth.uid(),
  null,
  null,
  null,
  null,
  10,
  0
);
```

### Test Statistics Function
```sql
SELECT get_writing_statistics(auth.uid());
```

## 📋 Required Functions

### Search Functions
- `search_entries(search_query, user_id_param, date_from, date_to, mood_filter, folder_id_param, limit_count, offset_count)`
- `search_suggestions(search_query, user_id_param, limit_count)`

### Statistics Functions
- `get_writing_statistics(user_id_param)` - Returns JSON with all stats
- `get_monthly_entry_counts(user_id_param, months_back)` - Returns monthly data
- `get_day_of_week_distribution(user_id_param)` - Returns day-wise counts
- `get_mood_distribution(user_id_param)` - Returns mood percentages

## 🔐 Security

All functions are created with:
- `SECURITY DEFINER` - Runs with creator's permissions
- `SET search_path = public, pg_temp` - Prevents schema hijacking
- Row Level Security (RLS) enforcement
- Proper permission grants for authenticated users

## 🆘 Troubleshooting

### "Function does not exist" Error
1. Check if migrations have been run
2. Verify function names match exactly
3. Check parameter types

### "Permission denied" Error
1. Ensure you're logged in
2. Check RLS policies on `entries` table
3. Verify GRANT statements in migration

### Functions Running Slow
1. Ensure GIN index exists: `entries_search_vector_idx`
2. Check entry count - large datasets may need optimization
3. Consider adding more indexes

## 📝 Migration Files Location

```
supabase/
  migrations/
    016_full_text_search.sql    ← Search functions
    021_statistics_functions.sql ← Statistics functions
```

## 🚀 After Setup

Once migrations are run, these features will work:

✅ **Search Page** - Full-text search with filters
✅ **Statistics Page** - Writing analytics and charts  
✅ **Insights Page** - Already working (uses different queries)
✅ **Calendar Page** - Already working
✅ **All other pages** - Already working

## ⏰ Estimated Time

- SQL Editor method: **5 minutes**
- CLI method: **2 minutes**

---

**Last Updated:** November 24, 2025  
**Status:** Required for Production 🚨
