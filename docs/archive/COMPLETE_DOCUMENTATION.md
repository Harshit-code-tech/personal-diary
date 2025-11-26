# Personal Diary - Complete Documentation

## 📊 Insights vs Statistics: What's the Difference?

### **Insights Page** (`/app/insights`)
**Purpose**: High-level analytics and patterns about your journaling journey

**Features**:
- ✨ **Writing Statistics Card**: Total entries, words written, average words per entry
- 📈 **Trends & Streaks**: Current writing streak, longest streak, consistency tracking
- 📅 **Temporal Patterns**: Entries this month vs last month, most active day of week
- 🎯 **Achievements & Milestones**: Days journaling, first entry date
- 🏆 **Visual Engagement**: Gradient cards, animations, inspirational metrics

**Use Case**: Get a quick overview of your journaling habits, see your progress, and stay motivated.

---

### **Statistics Page** (`/app/statistics`)
**Purpose**: Detailed data visualization and granular analytics

**Features**:
- 📊 **Stat Cards**: Quick metrics (Total Entries, Current Streak, Total Words, etc.)
- 🎨 **Mood Distribution**: Visual breakdown of moods with percentages and counts
- 📆 **Day of Week Analysis**: Which days you write most with bar charts
- 📈 **Monthly Trend**: Last 12 months of writing activity with timeline
- 🔍 **Data-Driven**: Focus on charts, graphs, and quantifiable metrics

**Use Case**: Deep dive into your writing patterns, identify trends over time, analyze mood data.

---

### Quick Comparison

| Feature | Insights | Statistics |
|---------|----------|------------|
| **Focus** | Overview & Motivation | Data & Analysis |
| **Visual Style** | Gradient cards, badges | Charts & graphs |
| **Mood Data** | Summary only | Full distribution with % |
| **Time Range** | Current state + recent | Historical (12 months) |
| **Best For** | Daily check-in | Periodic review |

---

## 📧 Email Templates Setup & Explanation

### Overview
The Personal Diary app uses **Supabase Auth** for authentication, which includes built-in email templates for:
- Welcome/Confirmation emails
- Password reset emails
- Magic link emails
- Email change confirmation

### Where to Find Email Templates

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project
   
2. **Authentication → Email Templates**
   - Left sidebar: Click "Authentication"
   - Click "Email Templates"

### Available Templates

#### 1. **Confirm Signup Email**
**When Sent**: After user creates a new account

**Purpose**: Verify email address before allowing login

**Customization Options**:
```html
<!-- Default Subject -->
Confirm Your Email

<!-- HTML Body -->
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Variables Available**:
- `{{ .ConfirmationURL }}` - Verification link
- `{{ .Token }}` - Verification token
- `{{ .SiteURL }}` - Your app URL

**Recommended Custom Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Personal Diary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f7f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4A460 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4A460 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #2B2B2B; color: #A0A0A0; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Welcome to Personal Diary</h1>
    </div>
    <div class="content">
      <h2>Confirm Your Email</h2>
      <p>Hi there! 👋</p>
      <p>Thank you for signing up for Personal Diary. You're one step away from starting your journaling journey.</p>
      <p>Please click the button below to verify your email address:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Personal Diary - Your Private Journaling Space</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

---

#### 2. **Reset Password Email**
**When Sent**: User clicks "Forgot Password"

**Purpose**: Provide secure link to reset password

**Default Variables**:
- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Token }}` - Reset token

**Recommended Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f7f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4A460 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4A460 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .warning { background: #FFF3CD; border-left: 4px solid #FFA000; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #2B2B2B; color: #A0A0A0; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Your Password</h1>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password for your Personal Diary account.</p>
      <p>Click the button below to choose a new password:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <p style="margin: 5px 0 0 0;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    </div>
    <div class="footer">
      <p>Personal Diary - Your Private Journaling Space</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

---

#### 3. **Magic Link Email**
**When Sent**: User chooses "Sign in with email" (passwordless)

**Purpose**: One-click secure login without password

**Variables**:
- `{{ .ConfirmationURL }}` - Magic link URL
- `{{ .Token }}` - Auth token

**Recommended Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your Magic Link</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f7f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #2B2B2B; color: #A0A0A0; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Your Magic Link</h1>
    </div>
    <div class="content">
      <h2>Sign In to Personal Diary</h2>
      <p>Click the button below to securely sign in to your account:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Sign In Now</a>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">This link expires in 15 minutes and can only be used once.</p>
    </div>
    <div class="footer">
      <p>Personal Diary - Your Private Journaling Space</p>
    </div>
  </div>
</body>
</html>
```

---

#### 4. **Change Email Confirmation**
**When Sent**: User updates their email address

**Purpose**: Confirm new email address

**Recommended Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Confirm Email Change</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f7f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #2B2B2B; color: #A0A0A0; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Email Change Request</h1>
    </div>
    <div class="content">
      <h2>Confirm Your New Email</h2>
      <p>You've requested to change your email address for Personal Diary.</p>
      <p>Click the button below to confirm your new email address:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this change, please contact support immediately.</p>
    </div>
    <div class="footer">
      <p>Personal Diary - Your Private Journaling Space</p>
    </div>
  </div>
</body>
</html>
```

---

### How to Update Email Templates in Supabase

1. **Navigate to Email Templates**:
   - Supabase Dashboard → Your Project → Authentication → Email Templates

2. **Select Template to Edit**:
   - Choose from: Confirm Signup, Invite User, Magic Link, Change Email, Reset Password

3. **Edit HTML**:
   - Paste custom HTML from above
   - Adjust colors/branding to match your app
   - Test with `{{ .ConfirmationURL }}` variable

4. **Update Subject Line**:
   - Keep it clear and action-oriented
   - Examples:
     - "Welcome to Personal Diary - Confirm Your Email"
     - "Reset Your Personal Diary Password"
     - "Your Magic Link to Personal Diary"

5. **Save & Test**:
   - Click "Save"
   - Test by creating a new account or triggering password reset

---

### Email Template Variables Reference

| Variable | Description | Used In |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | Full confirmation/action URL | All templates |
| `{{ .Token }}` | Authentication token | All templates |
| `{{ .SiteURL }}` | Your application URL | All templates |
| `{{ .Email }}` | User's email address | All templates |
| `{{ .TokenHash }}` | Hashed token | All templates |
| `{{ .Data }}` | Custom metadata | Custom templates |

---

### Email Sending Configuration

**SMTP Settings** (if using custom SMTP):
1. Go to: Authentication → Settings → SMTP Settings
2. Configure:
   - **Host**: Your SMTP host (e.g., smtp.gmail.com)
   - **Port**: Usually 587 (TLS) or 465 (SSL)
   - **Username**: SMTP username/email
   - **Password**: SMTP password or app-specific password
   - **Sender Email**: The "From" address
   - **Sender Name**: Display name (e.g., "Personal Diary")

**Using Supabase Email** (Default):
- No configuration needed
- Limited to 3 emails per hour during development
- Upgrade plan for production use

---

### Troubleshooting

**Emails Not Sending**:
1. Check SMTP settings are correct
2. Verify email confirmation is enabled in Auth settings
3. Check spam/junk folder
4. Review Supabase logs for errors

**Links Not Working**:
1. Verify Site URL is correct in Project Settings
2. Check redirect URLs are whitelisted
3. Ensure `.env.local` has correct `NEXT_PUBLIC_SITE_URL`

**Customization Not Showing**:
1. Clear browser cache
2. Wait 5 minutes for changes to propagate
3. Test with new email address

---

## 🎨 Design System Overview

### Color Palette

**Light Theme**:
- Primary: Gold (#D4AF37)
- Background: Cream (#F9F7F4)
- Text: Charcoal (#2B2B2B)

**Dark Theme**:
- Primary: Teal (#4FD1C5)
- Background: Midnight (#1A1A1A) / Graphite (#2D2D2D)
- Text: White (#FFFFFF)

**Accent Colors**:
- Purple: #667EEA → #764BA2
- Pink: #EC4899 → #F472B6
- Orange: #F97316 → #FB923C
- Blue: #3B82F6 → #60A5FA

### Typography

- **Headings**: Font Cormorant (Serif) - Elegant, classic
- **Body**: Font Inter (Sans-serif) - Clean, modern
- **Accent**: Font Lora (Serif) - Warm, readable

### Component Patterns

**Cards**:
```css
rounded-2xl p-6 shadow-xl 
border border-charcoal/10 dark:border-white/10
hover:scale-105 transition-transform duration-300
```

**Buttons**:
```css
px-4 py-2 rounded-xl font-bold
bg-gradient-to-r from-gold to-orange-500
hover:shadow-lg transition-all duration-300
```

**Inputs**:
```css
rounded-xl border-2 border-charcoal/20 dark:border-white/20
focus:border-gold dark:focus:border-teal
transition-colors duration-300
```

---

## 📱 Responsive Breakpoints

- `xs`: 475px (Extra small phones)
- `sm`: 640px (Phones)
- `md`: 768px (Tablets)
- `lg`: 1024px (Laptops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large desktops)

---

## 🔧 Development Commands

```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run E2E tests
npx playwright test
```

---

## 📦 Key Dependencies

- **Next.js 14.2.33**: React framework
- **Supabase**: Backend & Auth
- **TailwindCSS**: Styling
- **Lucide React**: Icons
- **TipTap**: Rich text editor
- **Recharts**: Data visualization
- **React Query**: Data fetching

---

## 🗂️ Project Structure

```
personal-diary/
├── app/                      # Next.js 14 App Router
│   ├── (app)/               # Protected app routes
│   │   ├── layout.tsx       # App layout with header
│   │   └── app/             # Feature pages
│   │       ├── insights/    # Analytics overview
│   │       ├── mood/        # Mood tracking
│   │       ├── statistics/  # Detailed stats
│   │       ├── search/      # Full-text search
│   │       ├── calendar/    # Calendar view
│   │       ├── timeline/    # Life events
│   │       ├── goals/       # Goal tracking
│   │       ├── people/      # People mentions
│   │       └── stories/     # Story categories
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── auth/               # Auth-related
│   ├── calendar/           # Calendar components
│   ├── editor/             # WYSIWYG editor
│   ├── folders/            # Folder navigation
│   ├── layout/             # Layout components
│   ├── theme/              # Theme switcher
│   └── ui/                 # Reusable UI components
├── lib/                    # Utilities
│   ├── supabase/          # Supabase client
│   ├── hooks/             # Custom React hooks
│   └── utils.ts           # Helper functions
├── supabase/              # Supabase config
│   └── migrations/        # SQL migrations
├── docs/                  # Documentation
└── public/                # Static assets
```

---

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env.local`
2. **Row Level Security**: All tables have RLS policies
3. **Server-Side Auth**: Use `@/lib/supabase/server` in Server Components
4. **Client-Side Auth**: Use `@/lib/supabase/client` in Client Components
5. **API Routes**: Validate user authentication
6. **SQL Injection**: Use parameterized queries
7. **XSS Protection**: DOMPurify for user content

---

This documentation covers the core aspects of your Personal Diary application. For specific technical details, refer to individual files in the `docs/` directory.
