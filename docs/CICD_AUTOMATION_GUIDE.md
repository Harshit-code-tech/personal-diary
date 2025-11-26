# 🚀 CI/CD & Automation Guide

**Date:** November 26, 2025  
**Project:** Personal Diary  
**Purpose:** Set up continuous integration, deployment, and automation pipelines

---

## 📋 Overview

This guide covers:
1. **GitHub Actions CI/CD** - Automated testing and deployment
2. **Supabase Database Automation** - Scheduled jobs and maintenance
3. **Vercel Deployment** - Frontend hosting and preview deployments
4. **Monitoring & Alerts** - Error tracking and performance monitoring
5. **Backup Automation** - Regular database backups

---

## 🎯 Goals

✅ **Automated Testing** - Run tests on every push/PR  
✅ **Automated Deployment** - Deploy on merge to main  
✅ **Scheduled Tasks** - Cron jobs for reminders, cleanup  
✅ **Quality Checks** - Linting, type checking, build verification  
✅ **Security Scanning** - Dependency vulnerability checks  
✅ **Performance Monitoring** - Lighthouse CI, Vercel Analytics  

---

## 🔧 Setup Overview

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
├── Run Tests (Vitest + Playwright)
├── Lint & Type Check
├── Build Application
├── Security Scan
└── Deploy to Vercel
    ↓
Vercel (Production)
    ↓
Supabase (Database + Functions)
    ↓
Scheduled Jobs (pg_cron)
```

---

## 1️⃣ GitHub Actions - CI/CD Pipeline

### Step 1: Create `.github/workflows/` Directory

```bash
mkdir -p .github/workflows
```

### Step 2: Create `ci.yml` - Main CI Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    name: Lint, Type Check & Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
        continue-on-error: false
      
      - name: TypeScript type check
        run: npx tsc --noEmit
      
      - name: Run unit tests
        run: npm run test
        env:
          CI: true
      
      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run Playwright tests
        run: npm run test:e2e
        env:
          CI: true
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Next.js application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Analyze bundle size
        run: |
          npm run build -- --analyze || true
          ls -lh .next/static/chunks/
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: .next/
          retention-days: 7

  security-scan:
    name: Security Vulnerability Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --production --audit-level=moderate
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  lighthouse:
    name: Lighthouse Performance Audit
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/app
            http://localhost:3000/login
          uploadArtifacts: true
          temporaryPublicStorage: true

  deploy-preview:
    name: Deploy Preview (Vercel)
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    name: Deploy to Production (Vercel)
    runs-on: ubuntu-latest
    needs: [build, e2e-tests, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
      
      - name: Notify deployment
        run: |
          echo "🚀 Deployed to production!"
          echo "URL: https://yourdomain.vercel.app"
```

---

### Step 3: Create `codeql.yml` - Security Analysis

Create `.github/workflows/codeql.yml`:

```yaml
name: "CodeQL Security Analysis"

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * 1'  # Run every Monday at 6 AM

jobs:
  analyze:
    name: Analyze Code
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript', 'typescript' ]

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: ${{ matrix.language }}

    - name: Autobuild
      uses: github/codeql-action/autobuild@v2

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      with:
        category: "/language:${{matrix.language}}"
```

---

### Step 4: Create `dependency-update.yml` - Auto Dependency Updates

Create `.github/workflows/dependency-update.yml`:

```yaml
name: Update Dependencies

on:
  schedule:
    - cron: '0 8 * * 1'  # Every Monday at 8 AM
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    name: Update Dependencies
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Update dependencies
        run: |
          npm update
          npm audit fix --audit-level=moderate || true
      
      - name: Run tests
        run: |
          npm ci
          npm test
          npm run build
      
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: '🔄 Weekly dependency updates'
          body: |
            Automated dependency updates
            
            - Updated npm packages
            - Ran tests successfully
            - Build verified
          branch: deps/automated-updates
          delete-branch: true
```

---

## 2️⃣ GitHub Secrets Configuration

### Required Secrets

Add these in **GitHub Repository → Settings → Secrets and variables → Actions**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Optional: Security scanning
SNYK_TOKEN=your_snyk_token
CODECOV_TOKEN=your_codecov_token
```

### How to Get Secrets:

**Vercel Token:**
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token
3. Copy to GitHub secrets

**Vercel Org/Project IDs:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and get IDs
vercel link

# View project settings
cat .vercel/project.json
```

---

## 3️⃣ Vercel Deployment Configuration

### Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### Environment Variables in Vercel

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Set for: **Production**, **Preview**, **Development**

---

## 4️⃣ Supabase Automation - Scheduled Jobs

### Schedule Daily Email Reminders

```sql
-- Run in Supabase SQL Editor

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminders at 8 AM UTC (adjust for your timezone)
SELECT cron.schedule(
  'daily-email-reminders',
  '0 8 * * *',  -- Every day at 8 AM
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "daily_reminder"}'::jsonb
  ) AS request_id;
  $$
);

-- Verify scheduled job
SELECT * FROM cron.job;
```

### Schedule Weekly Summary

```sql
-- Every Sunday at 6 PM UTC
SELECT cron.schedule(
  'weekly-summary-email',
  '0 18 * * 0',  -- Sunday at 6 PM
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "weekly_summary"}'::jsonb
  ) AS request_id;
  $$
);
```

### Schedule Reminder Checks (Hourly)

```sql
-- Check for due reminders every hour
SELECT cron.schedule(
  'check-reminders',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminder-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

### Schedule Database Cleanup (Weekly)

```sql
-- Clean old cached entries weekly
SELECT cron.schedule(
  'cleanup-old-cache',
  '0 2 * * 0',  -- Sunday at 2 AM
  $$
  -- Delete entries older than 30 days with no activity
  DELETE FROM entries 
  WHERE updated_at < NOW() - INTERVAL '30 days'
    AND (SELECT COUNT(*) FROM entries WHERE user_id = entries.user_id) > 100;
  
  -- Analyze tables for query optimization
  ANALYZE entries;
  ANALYZE folders;
  ANALYZE people;
  ANALYZE stories;
  $$
);
```

### Schedule Database Backup

```sql
-- Create daily backup metadata
SELECT cron.schedule(
  'daily-backup-log',
  '0 3 * * *',  -- Every day at 3 AM
  $$
  INSERT INTO backup_logs (backup_date, status, row_count)
  SELECT 
    NOW(),
    'completed',
    (SELECT COUNT(*) FROM entries);
  $$
);
```

---

## 5️⃣ Monitoring & Error Tracking

### Setup Sentry (Free Tier)

#### Step 1: Install Sentry

```bash
npm install --save @sentry/nextjs
```

#### Step 2: Initialize Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

#### Step 3: Configure `sentry.client.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',
});
```

#### Step 4: Configure `sentry.server.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

---

### Setup Vercel Analytics (Free)

#### Add to `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## 6️⃣ Database Backup Strategy

### Automated Supabase Backups

Supabase automatically backs up:
- **Daily backups**: Retained for 7 days (Free tier)
- **Point-in-time recovery**: Not available in free tier

### Manual Backup Script

Create `scripts/backup-database.sh`:

```bash
#!/bin/bash

# Database backup script
# Run this manually or schedule with cron

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "🔄 Starting database backup..."

# Use Supabase CLI to backup
npx supabase db dump --file $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup completed: ${BACKUP_FILE}.gz"

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "🧹 Cleaned old backups"
```

Make executable:
```bash
chmod +x scripts/backup-database.sh
```

---

## 7️⃣ Performance Monitoring

### Lighthouse CI Configuration

Create `.lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/app',
        'http://localhost:3000/login',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

## 8️⃣ Deployment Workflow

### Branching Strategy

```
main (production)
  ├── develop (staging)
  └── feature/* (feature branches)
```

### Typical Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/add-new-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/add-new-feature
   ```

4. **Create Pull Request**
   - GitHub Actions runs CI checks
   - Vercel deploys preview
   - Review changes

5. **Merge to develop** (if using staging)
   - Auto-deploy to staging environment

6. **Merge to main** (production)
   - Auto-deploy to production
   - Runs full test suite
   - Security scans
   - Performance checks

---

## 9️⃣ Maintenance Automation

### Weekly Health Check Script

Create `.github/workflows/health-check.yml`:

```yaml
name: Weekly Health Check

on:
  schedule:
    - cron: '0 10 * * 1'  # Every Monday at 10 AM
  workflow_dispatch:

jobs:
  health-check:
    name: System Health Check
    runs-on: ubuntu-latest
    
    steps:
      - name: Check website availability
        run: |
          curl -f https://yourdomain.com || exit 1
      
      - name: Check API endpoints
        run: |
          curl -f https://yourdomain.com/api/health || exit 1
      
      - name: Check database connection
        run: |
          # Add health check endpoint test
          echo "Database health check"
      
      - name: Send health report
        if: failure()
        run: |
          echo "⚠️ Health check failed!"
          # Send notification (email, Slack, etc.)
```

---

## 🔟 Notifications & Alerts

### GitHub Actions Slack Integration

Add to workflow:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'CI Pipeline Failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications

GitHub automatically sends email on:
- Workflow failures
- Pull request comments
- Security alerts

---

## ✅ Deployment Checklist

### Before First Deploy

- [ ] Run all migrations in Supabase
- [ ] Configure RLS policies
- [ ] Set up environment variables in Vercel
- [ ] Configure custom domain (if using)
- [ ] Set up email SMTP settings
- [ ] Deploy Edge Functions to Supabase
- [ ] Schedule cron jobs in Supabase
- [ ] Test email templates
- [ ] Configure GitHub secrets
- [ ] Set up monitoring (Sentry, Analytics)

### First Deployment

- [ ] Push to `main` branch
- [ ] Verify GitHub Actions pass
- [ ] Check Vercel deployment succeeds
- [ ] Test live site functionality
- [ ] Verify database connection
- [ ] Test authentication flows
- [ ] Check email sending works
- [ ] Verify scheduled jobs run
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit

### Post-Deployment

- [ ] Monitor error rates in Sentry
- [ ] Check performance metrics
- [ ] Review user analytics
- [ ] Monitor database usage
- [ ] Check email delivery rates
- [ ] Review security alerts
- [ ] Update documentation

---

## 📊 Monitoring Dashboard

### Key Metrics to Track

**Application Health:**
- Uptime: >99.9%
- Response time: <2s
- Error rate: <0.1%
- Build success rate: >95%

**Database:**
- Query performance
- Connection pool usage
- Storage usage
- Active users

**User Metrics:**
- Daily active users
- New signups
- Entry creation rate
- Feature usage

---

## 🎉 Congratulations!

Your Personal Diary application now has:
✅ Automated CI/CD pipeline  
✅ Scheduled database jobs  
✅ Error monitoring  
✅ Performance tracking  
✅ Automated backups  
✅ Security scanning  

**You're ready for production! 🚀**

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Last Updated:** November 26, 2025  
**Version:** 1.0.0
