# 🚀 Personal Diary - Setup & Deployment Guide

Complete step-by-step guide to get your 100% FREE personal diary website up and running.

---

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Git** installed ([Download here](https://git-scm.com/))
- A **Supabase account** (FREE tier) - [Sign up here](https://supabase.com/)
- A **Vercel account** (FREE tier) - [Sign up here](https://vercel.com/) *(optional for deployment)*

---

## 🛠️ Step 1: Install Dependencies

```bash
cd "d:\CODE\Project_Idea\personal diary"
npm install
```

This will install all required packages including:
- Next.js 14
- Supabase client libraries
- Tailwind CSS
- React Calendar Heatmap
- PWA support
- Image compression utilities

---

## 🗄️ Step 2: Setup Supabase Database

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose a project name (e.g., "personal-diary")
4. Set a strong database password (save it!)
5. Select a region close to you (for better performance)
6. Click **"Create new project"** and wait ~2 minutes

### 2.2 Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
4. Paste and click **"Run"**
5. Wait for success message ✅

6. Repeat for `supabase/migrations/002_rls_policies.sql`

### 2.3 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **"Create a new bucket"**
3. Name it: `diary-images`
4. Set it to **Private** (not public)
5. Click **"Create bucket"**

### 2.4 Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abc123.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

---

## ⚙️ Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Personal Diary
```

**⚠️ Important:** Never commit `.env.local` to Git! It's already in `.gitignore`.

---

## 🏃‍♂️ Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the landing page! 🎉

---

## 🧪 Step 5: Test Authentication

1. Click **"Start Writing Today"** or **"Sign Up"**
2. Create an account with your email and password
3. Check your email for confirmation (Supabase sends it automatically)
4. Confirm your email and log in
5. You should be redirected to `/app` (the main dashboard)

---

## 📱 Step 6: Setup PWA (Progressive Web App)

PWA is already configured! To test installation:

### On Desktop (Chrome/Edge):
1. Run `npm run dev`
2. Open http://localhost:3000/app
3. Look for the install icon in the address bar
4. Click to install as desktop app

### On Mobile:
1. Deploy to production (see Step 8)
2. Open the site on your phone
3. Tap "Share" → "Add to Home Screen"
4. The app will work offline!

**Note:** PWA only works with HTTPS (production) or localhost (development).

---

## 📧 Step 7: Setup Email Reminders (Optional)

Email reminders use Supabase Edge Functions. This is **FREE** but requires a few extra steps:

### 7.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 7.2 Link Your Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

*(Find your project ref in Supabase dashboard URL)*

### 7.3 Deploy Edge Function

```bash
supabase functions deploy email-reminders
```

### 7.4 Setup Cron Job

**Option A: Supabase Pro (Paid)**
- Run `supabase/migrations/003_setup_cron.sql` in SQL Editor
- pg_cron is built-in on Pro plan

**Option B: FREE External Cron**
1. Go to [cron-job.org](https://cron-job.org/) (FREE)
2. Create account and add new cron job
3. URL: `https://your-project-ref.supabase.co/functions/v1/email-reminders`
4. Schedule: Every hour
5. Add header: `Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`

*(Get service role key from Settings → API in Supabase)*

---

## 🌐 Step 8: Deploy to Production (Vercel)

### 8.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Personal Diary"
git branch -M main
git remote add origin https://github.com/yourusername/personal-diary.git
git push -u origin main
```

### 8.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon key
   - `NEXT_PUBLIC_SITE_URL`: Your Vercel URL (e.g., `https://personal-diary.vercel.app`)
5. Click **"Deploy"**

Wait 2-3 minutes and your site will be live! 🎉

---

## 🎨 Step 9: Generate PWA Icons

You need icon files for PWA. Here's how to create them:

### Option 1: Use Favicon Generator (Easy)
1. Go to [favicon.io](https://favicon.io/)
2. Create a simple icon (e.g., 📝 emoji or text logo)
3. Download the icon pack
4. Rename files to match manifest.json:
   - `android-chrome-192x192.png` → `icon-192x192.png`
   - `android-chrome-512x512.png` → `icon-512x512.png`
5. Place in `public/icons/` folder

### Option 2: Use Existing Logo
If you have a logo image, use an online tool like [Real Favicon Generator](https://realfavicongenerator.net/) to generate all sizes.

---

## ✅ Step 10: Verify Everything Works

Test these features:

- [ ] Sign up with new account
- [ ] Sign in and sign out
- [ ] Create a new entry (with and without template)
- [ ] View calendar heatmap
- [ ] Check word count updates in real-time
- [ ] Test theme toggle (Settings page - to be implemented)
- [ ] Install PWA on mobile device
- [ ] Test offline mode (PWA)

---

## 📊 Free Tier Limits

### Supabase FREE Tier:
- ✅ **Database:** 500MB (plenty for thousands of entries)
- ✅ **Storage:** 1GB (compressed images ~200KB each = 5,000+ images)
- ✅ **Edge Functions:** 500,000 invocations/month
- ✅ **Auth Users:** Unlimited
- ✅ **Bandwidth:** 5GB/month

### Vercel FREE Tier:
- ✅ **Bandwidth:** 100GB/month
- ✅ **Builds:** Unlimited
- ✅ **Domains:** Unlimited custom domains

**Estimated Users:** With optimization, you can handle **100,000+ daily entries** within FREE tiers!

---

## 🔧 Troubleshooting

### Build Errors After `npm install`

The TypeScript/lint errors you see are **normal before dependencies are installed**. Run:

```bash
npm install
npm run dev
```

If errors persist:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues

1. Check `.env.local` has correct values
2. Verify URL doesn't have trailing slash
3. Make sure anon key is the **public anon key**, not service role key

### PWA Not Installing

- PWA requires HTTPS (production) or localhost (development)
- Clear browser cache and reload
- Check browser console for service worker errors

### Email Reminders Not Sending

- Verify Edge Function is deployed: `supabase functions list`
- Check cron job is running (cron-job.org dashboard)
- Look at logs: `supabase functions logs email-reminders`

---

## 🎯 Next Steps

Once everything is running, you can:

1. **Customize the theme** - Edit `tailwind.config.ts` colors
2. **Add more templates** - Insert into `entry_templates` table
3. **Enable email reminders** - Setup cron job (Step 7)
4. **Add custom domain** - Configure in Vercel settings
5. **Implement settings page** - Theme toggle, email preferences
6. **Add export feature** - JSON, Markdown, PDF exports

---

## 🙏 Support

If you encounter issues:

1. Check the [Supabase docs](https://supabase.com/docs)
2. Check the [Next.js docs](https://nextjs.org/docs)
3. Review error messages in browser console
4. Check Supabase logs in dashboard

---

## 🎉 Congratulations!

You now have a **100% FREE, secure, private personal diary** website! 

Keep journaling and track your personal growth. 💙

---

**Made with 💙 for mindful journaling**
