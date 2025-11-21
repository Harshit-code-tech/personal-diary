# 🎯 Breaking into Git Commits - Guide

Since all code was created at once, here's how to commit logically:

## 📦 Method 1: Manual Commits (Recommended)

### Step 1: Stage Files Selectively

```bash
# Commit 1: Initial project setup
git add package.json package-lock.json
git add tsconfig.json tailwind.config.ts postcss.config.js next.config.js
git add .gitignore .env.example
git commit -m "chore: initial project setup with Next.js 14 and TypeScript"

# Commit 2: Add environment config
git add .env.local
git commit -m "chore: configure environment variables"

# Commit 3: Add global styles and layouts
git add app/layout.tsx app/globals.css
git commit -m "feat: add root layout and global styles"

# Commit 4: Add database schema
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: create database schema with 12 tables"

# Commit 5: Add RLS policies
git add supabase/migrations/002_rls_policies.sql
git commit -m "feat: implement row-level security policies"

# Commit 6: Add Supabase utilities
git add lib/supabase/
git add lib/database.types.ts
git commit -m "feat: add Supabase client utilities and types"

# Commit 7: Add utility functions
git add lib/utils.ts lib/image-utils.ts
git commit -m "feat: add utility functions for word count and image handling"

# Commit 8: Add authentication middleware
git add middleware.ts
git add lib/hooks/useAuth.ts
git commit -m "feat: implement authentication middleware and hooks"

# Commit 9: Add authentication pages
git add "app/(auth)/login/page.tsx"
git add "app/(auth)/signup/page.tsx"
git commit -m "feat: create login and signup pages"

# Commit 10: Add landing page
git add app/page.tsx
git commit -m "feat: create landing page with feature showcase"

# Commit 11: Add app layout
git add "app/(app)/layout.tsx"
git commit -m "feat: add protected app layout"

# Commit 12: Add main dashboard
git add "app/(app)/app/page.tsx"
git commit -m "feat: create main dashboard"

# Commit 13: Add entry templates
git add components/templates/
git add "app/(app)/app/new/page.tsx"
git commit -m "feat: implement entry templates system with 7 pre-built templates"

# Commit 14: Add calendar view
git add components/calendar/
git add "app/(app)/app/calendar/page.tsx"
git commit -m "feat: add calendar heatmap with streak tracking"

# Commit 15: Add PWA support
git add public/manifest.json
git commit -m "feat: configure Progressive Web App support"

# Commit 16: Add email reminders
git add supabase/functions/email-reminders/
git add supabase/migrations/003_setup_cron.sql
git commit -m "feat: implement email reminder system with Gmail SMTP"

# Commit 17: Add documentation
git add README.md SETUP.md QUICKSTART.md CHECKLIST.md PROGRESS.md
git commit -m "docs: add comprehensive setup guides and documentation"
```

---

## 📦 Method 2: Interactive Staging (Advanced)

```bash
# Stage hunks interactively
git add -p app/

# For each file, choose:
# y - stage this hunk
# n - don't stage this hunk
# s - split into smaller hunks
# q - quit

# Commit after staging related files
git commit -m "feat: your commit message"
```

---

## 📦 Method 3: Automated Script

Create `break-commits.sh`:

```bash
#!/bin/bash

# Array of commits with files
declare -a commits=(
  "chore: initial project setup|package.json package-lock.json tsconfig.json tailwind.config.ts postcss.config.js next.config.js .gitignore .env.example"
  "chore: configure environment variables|.env.local"
  "feat: add root layout and global styles|app/layout.tsx app/globals.css"
  "feat: create database schema|supabase/migrations/001_initial_schema.sql"
  "feat: implement row-level security|supabase/migrations/002_rls_policies.sql"
  "feat: add Supabase utilities|lib/supabase/ lib/database.types.ts"
  "feat: add utility functions|lib/utils.ts lib/image-utils.ts"
  "feat: implement authentication|middleware.ts lib/hooks/useAuth.ts"
  "feat: create auth pages|app/(auth)/"
  "feat: create landing page|app/page.tsx"
  "feat: add app layout|app/(app)/layout.tsx"
  "feat: create dashboard|app/(app)/app/page.tsx"
  "feat: implement entry templates|components/templates/ app/(app)/app/new/page.tsx"
  "feat: add calendar view|components/calendar/ app/(app)/app/calendar/page.tsx"
  "feat: configure PWA|public/manifest.json"
  "feat: implement email reminders|supabase/functions/email-reminders/ supabase/migrations/003_setup_cron.sql"
  "docs: add documentation|README.md SETUP.md QUICKSTART.md CHECKLIST.md PROGRESS.md COMMITS.md"
)

# Loop through commits
for commit in "${commits[@]}"; do
  IFS='|' read -r message files <<< "$commit"
  git add $files
  git commit -m "$message"
  echo "✓ Committed: $message"
done
```

Run:
```bash
chmod +x break-commits.sh
./break-commits.sh
```

---

## 📦 Method 4: Git Rebase (Most Complex)

If you already made one big commit:

```bash
# Start interactive rebase
git rebase -i HEAD~1

# In editor, change "pick" to "edit"
# Save and exit

# Now split the commit
git reset HEAD^

# Stage and commit files in logical groups
git add package.json tsconfig.json
git commit -m "chore: initial project setup"

# Continue for each group...

# When done
git rebase --continue
```

---

## 🎯 Recommended Commit Structure

### Conventional Commits Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, CSS
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### Examples:
```bash
git commit -m "feat(auth): implement login and signup pages"
git commit -m "feat(editor): add entry templates with 7 pre-built options"
git commit -m "feat(calendar): integrate calendar heatmap with streak tracking"
git commit -m "chore(config): setup TypeScript and Tailwind CSS"
```

---

## 📊 Suggested Commit Breakdown (17 commits)

1. ✅ `chore: initial project setup with Next.js 14`
2. ✅ `chore: configure environment variables and gitignore`
3. ✅ `style: add global styles and custom Tailwind theme`
4. ✅ `feat(database): create complete schema with 12 tables`
5. ✅ `feat(database): implement row-level security policies`
6. ✅ `feat(supabase): add client utilities and TypeScript types`
7. ✅ `feat(utils): add helper functions for word count and images`
8. ✅ `feat(auth): implement authentication middleware`
9. ✅ `feat(auth): create login and signup pages`
10. ✅ `feat(pages): add landing page with features`
11. ✅ `feat(pages): create protected app layout`
12. ✅ `feat(dashboard): add main dashboard page`
13. ✅ `feat(editor): implement entry editor with template system`
14. ✅ `feat(calendar): add calendar heatmap with streak tracking`
15. ✅ `feat(pwa): configure Progressive Web App support`
16. ✅ `feat(email): implement email reminders with Gmail SMTP`
17. ✅ `docs: add comprehensive setup and user guides`

---

## 🚀 Quick Start (Copy-Paste Ready)

```bash
# Make sure you're in the project directory
cd "d:\CODE\Project_Idea\personal diary"

# Initialize git if not done
git init

# Add remote (replace with your repo URL)
git remote add origin https://github.com/Harshit-code-tech/personal-diary.git

# Stage and commit in groups (use commands from Method 1 above)

# Push to GitHub
git push -u origin main
```

---

## ⚠️ Important Notes

1. **Don't commit `.env.local`** - It's in `.gitignore` but double-check
2. **Commit message format** - Use conventional commits for consistency
3. **Test before committing** - Make sure app runs: `npm run dev`
4. **Push after each commit** - Or batch push at the end

---

## 🎯 Need Help?

If you want me to create the exact git commands for your setup, let me know and I'll generate a ready-to-run script!
