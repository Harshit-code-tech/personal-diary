# 🎯 Quick Reference - Personal Diary

## ⚡ Common Commands

```bash
# Start development server
npm run dev

# Start with Turbopack (faster, experimental)
npm run dev -- --turbo

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `.env.local` | ⚠️ Secrets (gitignored) |
| `.env.example` | Template for environment variables |
| `app/layout.tsx` | Root layout + metadata |
| `app/page.tsx` | Landing page |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(app)/app/page.tsx` | Main dashboard |
| `middleware.ts` | Route protection |
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind theme |

---

## 🔑 Environment Variables

```env
# Supabase (from dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Gmail (from Google Account → App Passwords)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🗄️ Database Setup

### Run migrations in Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

### Create storage bucket:
- Name: `diary-images`
- Privacy: Private

---

## 🚀 Deployment

### Vercel (Frontend)
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main

# Then connect repo in Vercel dashboard
# Add environment variables
```

### Supabase (Backend)
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy email-reminders
```

---

## 📝 Development Workflow

1. **Make changes** to files
2. **Save** (Ctrl+S)
3. **Wait ~600ms** for hot-reload
4. **Refresh browser** if needed

First page load: 9-15s (normal)  
Subsequent pages: 3-4s  
Hot-reload: < 1s

---

## 🐛 Troubleshooting

### Dev server won't start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Can't connect to Supabase
- Check `.env.local` values
- Verify Supabase project is active
- Check dashboard for API keys

### TypeScript errors
```bash
npm install
# Restart VS Code
```

### Build fails
```bash
npm run lint
# Fix any ESLint errors
npm run build
```

---

## 📊 Performance Tips

### Development
- Accept 9-15s first load (it's normal)
- Use hot-reload for fast iteration
- Try `npm run dev -- --turbo` for 5x speed

### Production
```bash
npm run build
npm start
# Pages load in < 100ms
```

---

## 🔒 Security Checklist

- [ ] `.env.local` in `.gitignore` ✅
- [ ] No secrets in code ✅
- [ ] All keys in environment variables ✅
- [ ] RLS policies enabled ✅
- [ ] Storage bucket private ✅

---

## 📚 Documentation

- **README.md** - Project overview
- **SETUP.md** - Complete setup guide
- **QUICKSTART.md** - 5-minute guide
- **STATUS.md** - Current status
- **PERFORMANCE.md** - Speed optimization
- **SECURITY.md** - Security audit
- **FIXES.md** - Recent changes
- **COMMITS.md** - Git commit guide
- **CHECKLIST.md** - Dev progress

---

## 🎯 Features Status

| Feature | Status |
|---------|--------|
| Authentication | ✅ Done |
| Entry Editor | ✅ Done |
| Templates | ✅ Done |
| Calendar | ✅ Done |
| PWA | ✅ Done |
| Email Reminders | 🟡 Needs Testing |
| Settings Page | ⏳ Todo |
| Image Upload | ⏳ Todo |
| Export | ⏳ Todo |

---

## 💡 Quick Tips

- **Slow in dev?** Normal! Production is fast.
- **Need speed now?** Use `npm run build` + `npm start`
- **First time?** Read QUICKSTART.md
- **Problems?** Check SETUP.md troubleshooting
- **Deploy?** Read STATUS.md deployment section

---

**Need help?** Check the documentation files above! 📚
