# Noted. 📝

> Your thoughts, forever private. A modern, secure journaling platform for mindful reflection.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-✓-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Noted. App Preview](https://img.shields.io/badge/Status-Production-success)

---

## ✨ Overview

**Noted.** is a beautiful, privacy-first journaling platform that helps you document your life, track your moods, and reflect on your journey. Built with modern web technologies, it offers a seamless experience across all devices.

### 🎯 Key Features

- **📖 Rich Text Editing** - Write with a powerful WYSIWYG editor featuring formatting, lists, images, and more
- **📁 Smart Organization** - Organize entries with custom folders, tags, and nested hierarchies
- **😊 Mood Tracking** - Track your emotional journey with 10+ mood options
- **📅 Calendar View** - Visualize your writing activity with an interactive heatmap
- **📊 Analytics & Insights** - Understand your writing patterns, streaks, and productivity
- **👥 People & Stories** - Track relationships and life stories
- **🎯 Goal Setting** - Set and track personal goals
- **🔔 Smart Reminders** - Automated email reminders with Vercel Cron + Supabase Edge Functions
- **🔍 Powerful Search** - Find entries instantly with full-text search
- **📱 PWA Support** - Install as a native app on any device
- **🌓 Theme Modes** - Light and Dark themes for comfortable writing
- **🔒 Privacy First** - Your data is encrypted and secure with Supabase
- **📤 Export/Import** - Backup your journal in JSON, Markdown, or PDF formats
- **⚡ Blazing Fast** - Built on Next.js 14 with App Router and Server Components
- **🤖 AI-Ready** - Foundation for AI-powered features (sentiment analysis, smart prompts)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account (free tier works perfectly)
- **Resend** account for email notifications (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harshit-code-tech/personal-diary.git
   cd personal-diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Vercel Cron Secret (generate with: openssl rand -base64 32)
   CRON_SECRET=your_32_character_secret
   ```

4. **Run database migrations**
   ```bash
   # Connect to your Supabase project
   npx supabase link --project-ref your-project-ref
   
   # Push migrations
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **TipTap** - Rich text editor
- **React Query** - Server state management
- **Zustand** - Client state management
- **Framer Motion** - Smooth animations

### Backend
- **Supabase** - PostgreSQL database, Authentication, Storage, Edge Functions
- **Server Components** - Optimized data fetching
- **Edge Functions** - Serverless functions for email automation
- **pgvector** - Vector embeddings for future AI features

### Development
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 📂 Project Structure

```
personal-diary/
├── app/                       # Next.js 14 App Router
│   ├── (app)/                 # Authenticated routes
│   │   ├── app/              # Main app pages
│   │   │   ├── analytics/   # Analytics dashboard
│   │   │   ├── entry/       # Entry viewing/editing
│   │   │   ├── mood/        # Mood tracking
│   │   │   ├── settings/    # User settings
│   │   │   └── ...
│   │   └── layout.tsx       # App shell with sidebar
│   ├── (auth)/               # Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── ...
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── editor/              # WYSIWYG editor
│   ├── folders/             # Folder management
│   ├── layout/              # Layout components
│   ├── theme/               # Theme switching
│   └── ui/                  # Reusable UI components
├── lib/                      # Utilities & configurations
│   ├── supabase/            # Supabase client
│   ├── hooks/               # Custom React hooks
│   ├── export-utils.ts      # Export functionality
│   └── validation.ts        # Zod schemas
├── supabase/                 # Supabase configuration
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── public/                   # Static assets
├── __tests__/                # Unit tests
└── e2e/                      # E2E tests
```

---

## 🗄️ Database Schema

### Core Tables
- **diary_entries** - Journal entries with rich content
- **folders** - Custom folder hierarchy
- **entry_folders** - Many-to-many entry-folder relationships
- **moods** - Mood tracking
- **people** - Relationship tracking
- **stories** - Life stories
- **goals** - Goal setting & progress
- **reminders** - Smart reminders with cron scheduling
- **email_queue** - Email notification queue
- **user_settings** - User preferences and AI settings

### Features
- **Row Level Security (RLS)** - Secure multi-tenant architecture
- **Triggers** - Auto-create user settings, update timestamps
- **Edge Functions** - Serverless automation for emails and reminders
- **Full-Text Search** - PostgreSQL search capabilities
- **Foreign Keys** - Referential integrity across all tables

---

## 🔐 Authentication & Security

- **Email/Password Authentication** via Supabase Auth
- **Email Verification** required for account creation
- **Password Reset** with secure token-based flow
- **Row Level Security** ensures users only see their own data
- **CSRF Protection** for form submissions
- **Rate Limiting** to prevent abuse

---

## 📱 Progressive Web App (PWA)

Noted. is a full-featured PWA that can be installed on any device:

- **Offline Support** - Service workers for offline functionality
- **Native Installation** - Install from browser
- **App Shortcuts** - Quick actions from home screen
- **Responsive Design** - Optimized for mobile, tablet, and desktop

---

## 🎨 Theming

Two beautiful themes included:

- **Sunlight on Paper** 🌞 - Warm, cream background with gold accents
- **Midnight Study** 🌙 - Dark mode with teal highlights

Themes persist across sessions and apply instantly with no flash.

---

## 🧪 Testing

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run All Tests
```bash
npm run test:all
```

---

## 📊 Features in Detail

### Rich Text Editing
- **Formatting**: Bold, italic, underline, strike through
- **Headings**: H1-H6 support
- **Lists**: Ordered and unordered
- **Blockquotes**: Highlight important text
- **Images**: Upload up to 5 images per entry (5MB each)
- **Links**: Add hyperlinks
- **Code Blocks**: Syntax highlighting

### Folder System
- **Nested Folders**: Create unlimited folder hierarchies
- **Custom Icons**: Choose from 30+ emoji icons
- **Drag & Drop**: Organize folders easily
- **Multi-Select**: Assign entries to multiple folders

### Mood Tracking
- 10+ mood options with emojis
- "Others" option with custom text input
- Mood distribution analytics
- Emotional journey visualization

### Analytics Dashboard
- **Writing Stats**: Total entries, words, averages
- **Streaks**: Current and longest writing streaks
- **Calendar Heatmap**: Yearly activity visualization
- **Trends**: Writing patterns by day/week/month
- **Productivity**: Most productive day and hour
- **Filters**: All time, 30/90/365 days, custom date range

### Export Options
- **JSON**: Complete data backup
- **Markdown**: Plain text format
- **PDF**: Beautiful formatted document
- **Selective Export**: Choose date range or specific entries

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Add environment variables
   - Deploy!

3. **Configure Supabase**
   - Set Site URL to your Vercel domain
   - Add redirect URLs for auth callbacks
### Environment Variables
Set these in Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```
---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation
- Keep commits atomic and well-described

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [TipTap](https://tiptap.dev/) - Headless WYSIWYG editor
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vercel](https://vercel.com/) - Deployment platform
- [Lucide](https://lucide.dev/) - Beautiful icons

---

## 📧 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Harshit-code-tech/personal-diary/issues)
- **Discussions**: [Join community discussions](https://github.com/Harshit-code-tech/personal-diary/discussions)

---

<div align="center">

**Made with ❤️ for mindful journaling**

[⭐ Star this repo](https://github.com/Harshit-code-tech/personal-diary) if you find it useful!

</div>
