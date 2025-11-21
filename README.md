# 📖 Personal Diary Website

A private, secure personal journaling platform built with **Next.js** and **Supabase**. 100% FREE to run forever.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password with row-level security
- 📝 **Rich Text Editor** - Markdown support with image uploads
- 📅 **Calendar View** - GitHub-style heatmap of your journaling activity
- 📋 **Entry Templates** - Pre-built templates for different journal types
- 📧 **Email Reminders** - Daily/weekly notifications (FREE)
- 📱 **Mobile PWA** - Install as app on any device
- 🌓 **Three Themes** - Light, Dark, and "I'm Tired" Grey Mode
- 💾 **Multiple Export Formats** - JSON, Markdown, HTML, PDF, Obsidian
- 🔒 **Privacy First** - Your data is yours, completely isolated
- 🎯 **Streak Tracking** - Build consistent journaling habits

## 🚀 Tech Stack (All FREE)

- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **Cost:** $0/month forever (within free tiers)

## 📦 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account (free tier)
- Vercel account (optional, for deployment)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd personal-diary
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the database migration:

```bash
# Copy the SQL from supabase/migrations/001_initial_schema.sql
# Paste and run it in Supabase SQL Editor
```

### 3. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
personal-diary/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (app)/             # Main app pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── calendar/          # Calendar heatmap
│   ├── editor/            # Markdown editor
│   ├── templates/         # Entry templates
│   └── ui/                # UI components
├── lib/                   # Utilities
│   ├── supabase/          # Supabase client
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Helper functions
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   ├── functions/         # Edge Functions
│   └── config.toml        # Local config
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
└── styles/                # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase

## 📊 Database Schema

See `supabase/migrations/001_initial_schema.sql` for complete schema including:

- `entries` - Journal entries with markdown support
- `entry_templates` - Pre-built and custom templates
- `images` - Image uploads with compression
- `user_settings` - Theme, timezone, email preferences
- `streaks` - Journaling streak tracking
- `email_queue` - Email reminder queue

## 🔒 Security

- Row-Level Security (RLS) enabled on all tables
- Private storage buckets with signed URLs
- HTTPS enforced in production
- Client-side image compression (200KB max)

## 🌐 Deployment

### Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Supabase Setup

1. Enable Edge Functions in your Supabase project
2. Deploy email reminder function:

```bash
supabase functions deploy email-reminders
```

## 📈 Staying Within FREE Tiers

- **Supabase:** 500MB DB + 1GB storage + 500k Edge Functions/month
- **Vercel:** 100GB bandwidth + unlimited builds
- **Tips:** Compress images, lazy load, use IndexedDB caching

## 🤝 Contributing

This is a personal side hustle project, but feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use for personal projects

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Inspired by the need for a truly private journaling space

---

**Made with 💙 for mindful journaling**
