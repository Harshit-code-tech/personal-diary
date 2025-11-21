# 🎯 Quick Start - Personal Diary

Get started in **5 minutes**! Follow these steps:

---

## ⚡ Fast Track Setup

### 1️⃣ Install Dependencies (2 min)

```bash
npm install
```

Wait for all packages to download and install.

---

### 2️⃣ Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) → Sign up/Login
2. Click **"New Project"**
3. Fill in:
   - Name: `personal-diary`
   - Database Password: (create a strong one)
   - Region: (closest to you)
4. Click **"Create new project"**
5. Wait ~2 minutes for setup

---

### 3️⃣ Setup Database (1 min)

In Supabase dashboard:

1. Go to **SQL Editor** (sidebar)
2. Click **"New query"**
3. Copy/paste content from `supabase/migrations/001_initial_schema.sql`
4. Click **"Run"** → Wait for success ✅
5. Repeat for `supabase/migrations/002_rls_policies.sql`

---

### 4️⃣ Create Storage Bucket (30 sec)

1. Go to **Storage** (sidebar)
2. Click **"Create a new bucket"**
3. Name: `diary-images`
4. Privacy: **Private**
5. Click **"Create bucket"**

---

### 5️⃣ Get API Keys (30 sec)

1. Go to **Settings** → **API** (sidebar)
2. Copy:
   - **Project URL**
   - **anon public** key

---

### 6️⃣ Configure Environment (30 sec)

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Replace the values with your keys from step 5.

---

### 7️⃣ Run Development Server (10 sec)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## ✅ Verify It Works

1. Click **"Start Writing Today"**
2. Create account with email + password
3. Check email for confirmation
4. Login and you should see the dashboard
5. Click **"+ New Entry"** to test editor

---

## 📱 Want PWA (Mobile App)?

Skip for now - it only works in production (HTTPS).

Deploy to Vercel first (see `SETUP.md` for full guide).

---

## 📧 Want Email Reminders?

Skip for now - setup later after you test the app.

See `SETUP.md` Step 7 for detailed instructions.

---

## 🚨 Troubleshooting

### "Module not found" errors?
```bash
npm install
```

### Can't connect to Supabase?
- Double-check `.env.local` values
- Make sure URL has no trailing slash
- Verify you used the **anon** key, not service role

### Build errors?
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 What's Next?

Once you've tested locally:

1. **Deploy to production** - See `SETUP.md` Step 8
2. **Generate PWA icons** - See `SETUP.md` Step 9
3. **Setup email reminders** - See `SETUP.md` Step 7
4. **Customize themes** - Edit `tailwind.config.ts`
5. **Add more features** - Check `CHECKLIST.md`

---

## 📚 Full Documentation

- **SETUP.md** - Complete step-by-step guide
- **CHECKLIST.md** - Development progress tracker
- **README.md** - Project overview and features

---

## 🎉 That's It!

You now have a working personal diary app running locally!

Start writing your first entry and explore the features. 💙

---

**Need help?** Check the full `SETUP.md` guide for detailed instructions.
