# 📖 Personal Diary

A beautiful, secure, and feature-rich personal journaling application built with **Next.js 14**, **Supabase**, and **TypeScript**.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Powered-green?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

## ✨ Features

### 📝 Core Journaling
- **Rich Text Editor** - WYSIWYG editor with formatting, images, and tables
- **Mood Tracking** - Track emotional states with emoji-based mood selection
- **Tags & Organization** - Organize entries with tags and custom folders
- **Search & Filter** - Full-text search with advanced filters (Ctrl+K)
- **Auto-Save Drafts** - Never lose your work (saves every 3 seconds)

### 🎨 UI/UX
- **Three Themes** - Light (Sunlight on Paper), Dark (Midnight Study), Grey (I'm Tired)
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Keyboard Shortcuts** - Fast navigation and actions
- **Touch-Friendly** - Optimized touch targets for mobile
- **Real-time Validation** - Instant feedback on forms

### 📊 Advanced Features
- **Folder System** - Nested folders with drag-and-drop
- **People Tracking** - Link entries to people in your life
- **Stories** - Create ongoing narratives
- **Calendar View** - Visual calendar with mood indicators
- **Analytics Dashboard** - Insights into journaling habits
- **Export Options** - JSON, Markdown, HTML, PDF, Obsidian

### 🔐 Security & Privacy
- **Secure Authentication** - Email verification with beautiful templates
- **Row Level Security** - Your data is completely private
- **Password Strength** - Visual strength indicator
- **Admin Dashboard** - Role-based access control

### 📱 Progressive Web App (PWA)
- **Offline Support** - Background sync capability
- **App Shortcuts** - Quick actions from home screen
- **Install Prompt** - Install as standalone app

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/personal-diary.git
cd personal-diary
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup
- Create Supabase project
- Run migrations from `/supabase/migrations/` folder in order (001 → 029)

### 4. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14, TypeScript, TailwindCSS, TipTap Editor  
**Backend:** Supabase (PostgreSQL, Auth, Storage)  
**Testing:** Vitest, Playwright  
**Deployment:** Vercel + Supabase

---

## 📚 Documentation

- **Testing Guide**: `docs/TESTING_GUIDE.md`
- **Implementation Details**: `docs/IMPLEMENTATION_COMPLETE.md`
- **Quick Start**: `docs/QUICK_START_GUIDE.md`
- **UI/UX Guide**: `docs/UI_UX_IMPROVEMENTS.md`

---

## 🎯 Key Features Explained

### Auto-Save Drafts
Entries auto-save to localStorage every 3 seconds. Never lose your work!

### Password Strength
Real-time validation with 6-level strength indicator:
- Weak → Fair → Good → Strong

### Multi-Word Search
Search "happy birthday" highlights both words separately using PostgreSQL full-text search.

### Three Themes
1. **Sunlight on Paper** - Warm cream background
2. **Midnight Study** - Cool dark with teal accents  
3. **I'm Tired...** - Muted greys

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Credits

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [TipTap](https://tiptap.dev/) - Editor framework
- [Lucide](https://lucide.dev/) - Icons

---

**Built with ❤️ for journaling**
