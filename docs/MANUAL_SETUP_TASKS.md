# Manual Setup Tasks (Tumko Krna Hoga)

## 📋 Overview
This document lists all the things you need to do **manually** that can't be automated through code or migrations.

**Status**: 🔴 Pending Manual Work  
**Time Required**: ~30-45 minutes total

---

## 1️⃣ Supabase Email Templates Setup

**Why Manual?**: Supabase Auth is a separate service that doesn't have access to your project files. You must configure email templates through the dashboard.

**Time Required**: ~10 minutes

### Step-by-Step Guide

#### A. Access Email Templates

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project from the list
3. **Left sidebar** → Click **"Authentication"** (🔐 icon)
4. **Sub-menu** → Click **"Email Templates"**

**Alternative**: Direct URL
```
https://app.supabase.com/project/[YOUR-PROJECT-ID]/auth/templates
```

#### B. Find Your Project ID

If you don't know your project ID:
1. Dashboard → Click on your project
2. **Settings** → **General**
3. Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

#### C. Configure Verification Email

1. In Email Templates, click **"Confirm signup"**
2. You'll see default boring template
3. **Delete all the existing HTML**
4. **Copy HTML** from your file:
   - Open: `supabase/migrations/017_custom_email_templates.sql`
   - Find the HTML section (it's commented in the SQL file)
   - Copy everything from `<!DOCTYPE html>` to `</html>`
5. **Paste** into the Supabase template editor
6. **Optional**: Customize colors, logo, text
7. Click **"Save"**

#### D. Test the Email Template

1. Go to your app: http://localhost:3000/signup
2. Create a test account with real email
3. Check your inbox
4. Verify email looks beautiful ✨
5. Click verification link to confirm it works

### 📸 What You'll See

**Before (Default Template)**:
```
Plain text email:
"Confirm your signup

Follow this link to confirm your user:
[Confirm your mail]"
```

**After (Your Custom Template)**:
```
Beautiful branded email with:
- Gold gradient header
- 📖 Diary logo
- "Verify Email Address" button
- Features grid with icons
- Professional footer
```

### ⚠️ Common Issues

**Problem**: Can't find "Email Templates" option
- **Solution**: Make sure you're in **Authentication** section, not Database
- **Solution**: Check if you're project owner (not just member)
- **Solution**: Update Supabase CLI: `npm install -g supabase`

**Problem**: HTML doesn't render correctly
- **Solution**: Make sure you copied **complete** HTML (from `<!DOCTYPE>` to `</html>`)
- **Solution**: Check for any special characters that got corrupted
- **Solution**: Re-copy from the SQL file

**Problem**: Variables like `{{ .ConfirmationURL }}` don't work
- **Solution**: These are Supabase variables - make sure you're using **exact** syntax with spaces: `{{ .ConfirmationURL }}`
- **Solution**: Don't change variable names

---

## 2️⃣ Enable Leaked Password Protection

**Why Manual?**: Security feature that requires dashboard access

**Time Required**: ~2 minutes

### Step-by-Step Guide

1. Go to **Supabase Dashboard**
2. Select your project
3. **Authentication** → **Settings** (scroll down in left menu)
4. Find **"Leaked Password Protection"** section
5. **Toggle ON** the switch
6. Click **"Save"** if prompted

### What It Does

- Checks user passwords against **HaveIBeenPwned** database
- Prevents users from using compromised passwords
- Examples of blocked passwords:
  - "password123" (used in millions of breaches)
  - "qwerty" (too common)
  - Any password found in data breaches

### ⚠️ User Impact

- When enabled, if user tries to sign up with compromised password:
  - Supabase will reject it
  - Show error: "Password has been compromised in a data breach"
  - User must choose different password

---

## 3️⃣ Run Database Migrations

**Why Manual?**: Migrations need to be executed against your Supabase database

**Time Required**: ~5 minutes

### Option A: Using Supabase CLI (Recommended)

#### Prerequisites
```powershell
# Check if Supabase CLI is installed
supabase --version

# If not installed:
npm install -g supabase
```

#### Steps

1. **Login to Supabase**
```powershell
supabase login
```
- Opens browser for authentication
- Log in with your Supabase account
- Returns to terminal

2. **Link to your project**
```powershell
supabase link --project-ref [YOUR-PROJECT-ID]
```
- Replace `[YOUR-PROJECT-ID]` with your project reference ID
- Find it in: Dashboard → Settings → General → Reference ID

3. **Push migrations**
```powershell
cd "d:\CODE\Project_Idea\personal diary"
supabase db push
```
- Uploads all migration files from `supabase/migrations/`
- Executes them in order (001, 002, 003... 019)
- Shows success/error for each migration

### Option B: Manual Copy-Paste (If CLI doesn't work)

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Open migration files** in VS Code
3. **For each migration** (001 to 019):
   - Copy entire SQL content
   - Paste in SQL Editor
   - Click **"Run"**
   - Wait for success message
   - Move to next migration

**Order Matters!** Run in sequence: 001 → 002 → 003... → 019

### 🚨 Migration 018 & 019 Important

**Migration 018**: Removes duplicate "Blank Canvas" template
- Only run if you've already run migration 010
- Safe to run multiple times (idempotent)

**Migration 019**: Fixes all security warnings
- This is critical for production
- Fixes 16 security issues
- Safe to run (drops and recreates functions properly)

### ⚠️ Common Migration Errors

**Error**: "relation already exists"
- **Cause**: Migration already ran before
- **Solution**: Skip to next migration (it's okay)

**Error**: "function does not exist"
- **Cause**: Migration order is wrong
- **Solution**: Run migrations in order (001, 002, 003...)

**Error**: "syntax error near..."
- **Cause**: SQL got corrupted during copy-paste
- **Solution**: Re-copy from original file, don't modify

---

## 4️⃣ Configure Environment Variables

**Why Manual?**: Sensitive credentials shouldn't be in code

**Time Required**: ~3 minutes

### Local Development (.env.local)

1. **Create file** in project root:
```powershell
cd "d:\CODE\Project_Idea\personal diary"
New-Item -Path ".env.local" -ItemType File
```

2. **Add Supabase credentials**:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: If using AI features in future
# OPENAI_API_KEY=sk-...
```

3. **Find your credentials**:
   - Dashboard → **Settings** → **API**
   - Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public key** → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Production Deployment (Vercel/Netlify)

When you deploy, add these as **environment variables**:

#### Vercel
1. Go to Vercel dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Redeploy

#### Netlify
1. Go to Netlify dashboard
2. Select your site
3. **Site settings** → **Environment variables**
4. Add same variables
5. Redeploy

---

## 5️⃣ Set Up Custom Domain (Optional)

**Why Manual?**: DNS configuration requires domain provider access

**Time Required**: ~10 minutes (+ 24 hours for DNS propagation)

### Prerequisites
- Own a domain (e.g., from Namecheap, GoDaddy, Google Domains)
- Deployed app on Vercel/Netlify

### For Vercel

1. **Vercel Dashboard** → Your project → **Settings** → **Domains**
2. Enter your domain: `mydiary.com`
3. Vercel shows DNS records to add
4. **Go to your domain provider** (Namecheap, etc.)
5. Add DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
6. Wait 24-48 hours for DNS propagation
7. Vercel automatically generates SSL certificate

### For Netlify

1. **Netlify Dashboard** → Your site → **Domain settings**
2. **Add custom domain**
3. Enter: `mydiary.com`
4. Netlify shows DNS records
5. Add to your domain provider:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```

---

## 6️⃣ Test Everything After Setup

**Time Required**: ~15 minutes

### Checklist

- [ ] **Signup Flow**
  - Create new account
  - Receive email (check spam folder)
  - Email looks beautiful with custom template
  - Click verification link
  - Successfully verified

- [ ] **Login Flow**
  - Log in with verified account
  - Redirected to `/app` page
  - See dashboard

- [ ] **Create Entry**
  - Click "New Entry"
  - Write content
  - Add image (optional)
  - Save successfully
  - Entry appears in list

- [ ] **Folders**
  - New entry auto-assigned to month folder
  - Can see "2025" → "November" folder hierarchy
  - Can create custom folder
  - Can move entry to different folder

- [ ] **Search**
  - Type in search bar
  - Results appear instantly
  - Click result opens entry

- [ ] **Templates**
  - Click "Templates" button
  - See 6 system templates + Blank
  - Select template
  - Content fills in editor

- [ ] **Dark Mode**
  - Toggle theme switcher
  - All pages switch properly
  - No broken colors

- [ ] **People Feature**
  - Create a person
  - Mention in entry
  - Link appears

- [ ] **Stories/Collections**
  - Create a story
  - Add entries to story
  - View story page

- [ ] **Timeline**
  - Add life event
  - Test "Other" category with custom text
  - Verify it saves

- [ ] **Keyboard Shortcuts**
  - Press `?` to see shortcuts modal
  - Press `Ctrl+N` (Windows) or `Cmd+N` (Mac)
  - New entry page opens

---

## 7️⃣ Production Checklist (Before Launch)

### Security
- [ ] Leaked Password Protection enabled
- [ ] Environment variables set in hosting platform
- [ ] `.env.local` in `.gitignore` (never commit secrets!)
- [ ] All migrations run successfully (001-019)
- [ ] No security warnings in Supabase dashboard

### Performance
- [ ] Images optimized (use Next.js Image component)
- [ ] Database indexes created (migrations handle this)
- [ ] RLS policies tested (can't access other users' data)

### SEO & Meta
- [ ] Update `app/layout.tsx` with proper metadata
- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Test Open Graph images (for social sharing)

### Monitoring
- [ ] Set up error tracking (optional: Sentry)
- [ ] Configure analytics (optional: Vercel Analytics)
- [ ] Enable Supabase database backups

---

## 8️⃣ Known Issues & Workarounds

### Issue: "Email templates not showing"
**Workaround**: 
1. Check if you're on latest Supabase version
2. Try different browser
3. Clear cache and retry

### Issue: "Migrations fail with permission error"
**Workaround**:
1. Make sure you're project owner
2. Run: `supabase link --project-ref [ID]` again
3. Check your internet connection

### Issue: "Can't upload images"
**Workaround**:
1. Check Supabase Storage settings
2. Verify RLS policies on storage buckets
3. Increase file size limit if needed

---

## 📞 Support Resources

### Supabase Issues
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

### Next.js Issues
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Discord](https://nextjs.org/discord)

### Project-Specific Issues
- Check `docs/` folder for guides
- Review `README.md`
- Check migration files for SQL comments

---

## ✅ Completion Checklist

Print this and check off as you complete:

- [ ] 1. Email templates configured and tested
- [ ] 2. Leaked password protection enabled
- [ ] 3. All migrations run successfully (001-019)
- [ ] 4. Environment variables set (local + production)
- [ ] 5. Custom domain configured (if applicable)
- [ ] 6. Full app tested with test account
- [ ] 7. Production checklist completed
- [ ] 8. Backup created of database

**When all checked** → Ready for production! 🚀

---

**Last Updated**: November 23, 2025  
**Estimated Total Time**: 30-45 minutes  
**Difficulty**: Easy (just follow steps)  
**Status**: Must be done before deployment
