# Authentication Quick Reference Guide

## 🔗 Page URLs

| Feature | URL | Description |
|---------|-----|-------------|
| Sign Up | `/signup` | Create new account |
| Login | `/login` | Sign in to account |
| Verify Email | `/verify-email?email={email}` | Email verification instructions |
| Forgot Password | `/forgot-password` | Request password reset |
| Reset Password | `/auth/reset-password` | Set new password (via email link) |
| Settings | `/app/settings` | Change email, password, and account settings |
| Auth Callback | `/auth/callback` | OAuth/email verification callback |

---

## 🔐 Component Imports

```typescript
// Reauthentication Modal
import ReauthModal from '@/components/auth/ReauthModal'

// Supabase Client
import { createClient } from '@/lib/supabase/client'

// Toast Notifications
import toast from 'react-hot-toast'
```

---

## 💻 Code Snippets

### Sign Up
```typescript
const { error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

### Login
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
})
```

### Sign Out
```typescript
await supabase.auth.signOut()
router.push('/')
```

### Forgot Password (Send Reset Link)
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
})
```

### Reset Password
```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword
})
```

### Change Email
```typescript
const { error } = await supabase.auth.updateUser(
  { email: newEmail },
  {
    emailRedirectTo: `${window.location.origin}/app/settings`,
  }
)
```

### Resend Verification Email
```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: email,
})
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Check Email Verification Status
```typescript
const { data: { user } } = await supabase.auth.getUser()
const isVerified = !!user?.email_confirmed_at
```

### Reauthenticate User
```typescript
// Verify current password
const { error } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: currentPassword,
})
```

---

## 🎨 Using ReauthModal Component

```typescript
import { useState } from 'react'
import ReauthModal from '@/components/auth/ReauthModal'

export default function MyComponent() {
  const [showReauth, setShowReauth] = useState(false)
  const [reauthAction, setReauthAction] = useState<'action1' | 'action2' | null>(null)

  const handleSensitiveAction = () => {
    setReauthAction('action1')
    setShowReauth(true)
  }

  const handleReauthSuccess = async () => {
    if (reauthAction === 'action1') {
      await executeAction1()
    }
    setReauthAction(null)
  }

  const executeAction1 = async () => {
    // Your sensitive operation here
  }

  return (
    <>
      <button onClick={handleSensitiveAction}>
        Do Sensitive Action
      </button>

      <ReauthModal
        isOpen={showReauth}
        onClose={() => {
          setShowReauth(false)
          setReauthAction(null)
        }}
        onSuccess={handleReauthSuccess}
        title="Confirm Your Identity"
        description="Please re-enter your password to continue"
      />
    </>
  )
}
```

---

## 🧪 Testing Commands

```bash
# Run dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## 📧 Email Template Variables

In Supabase email templates, use these variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Email verification or password reset link |
| `{{ .Email }}` | User's email address |
| `{{ .SiteURL }}` | Your application URL |
| `{{ .Token }}` | Verification token |
| `{{ .TokenHash }}` | Hashed token |

---

## 🔧 Supabase Dashboard Configuration

### 1. Authentication → Email Auth
- Enable "Confirm email"
- Enable "Secure email change"

### 2. Authentication → URL Configuration
Add these redirect URLs:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/app/settings
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/reset-password
https://yourdomain.com/app/settings
```

### 3. Authentication → Email Templates
Use templates from:
`supabase/migrations/017_custom_email_templates.sql`

---

## 🚨 Common Errors & Solutions

### "Invalid or expired reset link"
- Links expire after 1 hour
- Request a new reset link
- Check that the link matches your environment (dev/prod)

### "Email not confirmed"
- Check spam folder
- Use resend button on verify-email page
- Check Supabase email logs

### "Reauthentication failed"
- Ensure current password is correct
- Clear browser cache
- Check for typos

### "Email already in use"
- Email addresses must be unique
- Try logging in instead
- Use password reset if forgotten

---

## 📚 Related Files

### Pages:
- `app/(auth)/signup/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/verify-email/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/auth/reset-password/page.tsx`
- `app/auth/callback/page.tsx`
- `app/(app)/app/settings/page.tsx`

### Components:
- `components/auth/ReauthModal.tsx`

### Utilities:
- `lib/supabase/client.ts` - Supabase client
- `lib/hooks/useAuth.ts` - Auth hook

### Migrations:
- `supabase/migrations/017_custom_email_templates.sql` - Email templates

### Documentation:
- `docs/AUTHENTICATION_FEATURES.md` - Complete guide
- `docs/AUTHENTICATION_AUDIT.md` - Feature audit
- `docs/AUTHENTICATION_QUICK_REFERENCE.md` - This file

---

## 🎯 Best Practices

### Security:
1. Always require reauthentication for sensitive operations
2. Validate email format before sending
3. Check password strength before accepting
4. Use HTTPS in production
5. Don't store passwords in state or localStorage

### UX:
1. Show loading states for all async operations
2. Provide clear error messages
3. Confirm successful actions with toast notifications
4. Auto-redirect after verification when appropriate
5. Allow users to cancel actions

### Code:
1. Use TypeScript for type safety
2. Handle errors with try-catch
3. Use reusable components
4. Follow consistent naming conventions
5. Add comments for complex logic

---

## 📞 Support Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Auth Patterns](https://nextjs.org/docs/authentication)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Version:** 1.0.0  
**Last Updated:** 2024
