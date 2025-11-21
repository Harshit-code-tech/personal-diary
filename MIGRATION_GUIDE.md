# 🗄️ Database Migration Guide

## ⚠️ IMPORTANT: Run in This Exact Order!

### **Step 1: Open Supabase SQL Editor**
```
https://supabase.com/dashboard/project/blmmcdqlipcrpsfodrww/sql
```

---

## 📋 **Migration 1: Initial Schema**

**File:** `supabase/migrations/001_initial_schema.sql`

**What it creates:**
- ✅ 12 database tables
- ✅ 7 pre-built templates
- ✅ Indexes for fast queries
- ✅ Triggers for auto-updates

**How to run:**
1. Open `001_initial_schema.sql` in VS Code
2. Press `Ctrl+A` (select all)
3. Press `Ctrl+C` (copy)
4. Go to Supabase SQL Editor
5. Click **"New Query"**
6. Press `Ctrl+V` (paste)
7. Click **"Run"** button (or F5)

**Expected output:**
```
Success. No rows returned
```

**Time:** ~2 seconds

---

## 🔒 **Migration 2: Security Policies (RLS)**

**File:** `supabase/migrations/002_rls_policies.sql`

**What it creates:**
- ✅ Row Level Security (users only see their data)
- ✅ 40+ security policies
- ✅ Privacy protection

**How to run:**
1. Open `002_rls_policies.sql`
2. Select all → Copy
3. New Query in Supabase
4. Paste → Run

**Expected output:**
```
Success. No rows returned
```

**Time:** ~1 second

---

## 🖼️ **Migration 3: Storage Bucket Policies**

**Run this SQL directly in Supabase:**

```sql
-- Allow users to view their own images
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'diary-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload images
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'diary-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'diary-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Expected output:**
```
Success. No rows returned
```

---

## ⏰ **Migration 4: Cron Jobs (SKIP FOR NOW)**

**File:** `003_setup_cron.sql`

**What it does:**
- Scheduled email reminders (hourly checks)

**Status:** ❌ Requires `pg_cron` extension (not in free tier)

**Alternative:** Use Supabase Edge Functions with Deno.cron (free!)

**Action:** Skip this file for now. Email reminders work via Edge Functions instead.

---

## ✅ **Verification**

**After migrations, run this SQL:**

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see 12 tables:**
1. email_queue
2. entries
3. entry_attachments
4. entry_tags
5. entry_templates
6. exported_data
7. images
8. notifications
9. streak_tracking
10. tags
11. user_activity_log
12. user_settings

---

## 🔍 **Check Templates Work:**

```sql
-- See the 7 pre-built templates
SELECT name, icon, description 
FROM entry_templates 
WHERE is_system_template = true;
```

**Expected output:** 7 rows with templates like:
- 📝 Daily Reflection
- 🙏 Gratitude Journal
- 💭 Dream Log
- etc.

---

## 🐛 **Common Errors**

### **Error: "relation does not exist"**
**Cause:** Tables created in wrong order  
**Fix:** Run `001_initial_schema.sql` again (it's safe)

### **Error: "permission denied"**
**Cause:** Not using service role key  
**Fix:** You're in SQL Editor, it auto-uses service role ✅

### **Error: "duplicate key value"**
**Cause:** Running migration twice  
**Fix:** Drop tables first:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
Then re-run migrations.

---

## 🚀 **After Migration**

1. **Test signup:** Create account at `http://localhost:3000/signup`
2. **Test login:** Sign in
3. **Test entry:** Write first diary entry
4. **Test template:** Click template button
5. **Check database:** See your data in Supabase table editor

---

## 🎯 **Quick Reference**

| Migration | Purpose | Required? |
|-----------|---------|-----------|
| 001 | Create tables | ✅ YES |
| 002 | Security rules | ✅ YES |
| Storage | Bucket policies | ✅ YES |
| 003 | Cron jobs | ❌ SKIP |

---

## 💡 **Why SQL Instead of Django?**

**Django approach:**
```python
# models.py
class Entry(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
```

**Supabase approach:**
```sql
CREATE TABLE entries (
  title VARCHAR(255),
  content TEXT
);
```

**Why SQL?**
- ✅ No backend needed (Next.js talks directly to Postgres)
- ✅ 100% FREE (no Django hosting costs)
- ✅ Full control over indexes, triggers, RLS
- ✅ Supabase = Postgres database (not Django)

**Want Django?**
You'd need:
1. Separate Django backend ($5-10/month hosting)
2. Django models + migrations
3. API to connect Next.js
4. More complexity

**Current setup:**
- Next.js → Supabase (direct connection)
- Postgres with RLS (built-in auth)
- $0/month ✅

---

## 📖 **Next Steps**

After successful migration:
1. ✅ Start dev server: `npm run dev`
2. ✅ Sign up at `http://localhost:3000/signup`
3. ✅ Write your first entry
4. ✅ Test templates
5. ✅ Check calendar view

**Need help?** Check the error messages and troubleshooting section above!
