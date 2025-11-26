# 📧 Email Templates Configuration Guide

**Date:** November 26, 2025  
**Project:** Personal Diary  
**Purpose:** Configure all email templates for authentication and notifications

---

## 📋 Overview

Your application sends emails for:
1. **Email Verification** (signup)
2. **Password Reset**
3. **Email Change Confirmation**
4. **Daily Journal Reminders**
5. **Weekly Summary**
6. **Reminder Notifications**

---

## 🎨 Email Design Principles

### Brand Colors
- **Primary (Light Mode)**: `#D4AF37` (Gold)
- **Primary (Dark Mode)**: `#5EEAD4` (Teal)
- **Background**: `#FFF5E6` (Paper)
- **Text**: `#2C3E50` (Charcoal)

### Typography
- **Headings**: Georgia, serif
- **Body**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Logo**: 📖 Book emoji + "My Diary" or "Personal Diary"

---

## 🔧 Setup Instructions

### Step 1: Configure SMTP in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Settings** → **Auth** → **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure:
   - **Host**: `smtp.gmail.com` (for Gmail)
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: Your Gmail address
   - **Password**: App-specific password (not your regular password)
   - **Sender Email**: `noreply@yourdomain.com` or your Gmail
   - **Sender Name**: "My Diary" or "Personal Diary"

#### How to Get Gmail App Password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy the 16-character password
6. Use this in Supabase SMTP settings

### Step 2: Customize Email Templates in Supabase

Go to **Supabase Dashboard** → **Auth** → **Email Templates**

---

## 📨 Template 1: Email Verification (Confirm Signup)

**Path:** Supabase Dashboard → Auth → Email Templates → **Confirm signup**

### Subject Line
```
Verify your email - My Diary ✨
```

### HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - My Diary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); padding: 40px 40px 60px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📖</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; font-family: Georgia, serif; letter-spacing: -0.5px;">
                My Diary
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 600;">
                Your Personal Journaling Companion
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #2C3E50;">
                Welcome to Your Journey! 🎉
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                We're excited to have you start your journaling journey with us. To get started, we need to verify your email address.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                Click the button below to verify your email and unlock all features:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4); transition: all 0.3s ease;">
                  ✨ Verify Email Address
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="margin: 32px 0 0 0; padding: 24px; background: #F8F9FA; border-radius: 12px; border-left: 4px solid #D4AF37;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #34495E; font-weight: 600;">
                  Button not working?
                </p>
                <p style="margin: 0; font-size: 13px; color: #7F8C8D; word-break: break-all;">
                  Copy and paste this link into your browser:<br>
                  <a href="{{ .ConfirmationURL }}" style="color: #D4AF37; text-decoration: underline;">{{ .ConfirmationURL }}</a>
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="margin: 32px 0 0 0; padding: 16px; background: #FFF3CD; border-radius: 8px; border: 1px solid #FFE69C;">
                <p style="margin: 0; font-size: 13px; color: #856404;">
                  🔒 <strong>Security tip:</strong> If you didn't create an account, please ignore this email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: #F8F9FA; border-top: 1px solid #E9ECEF;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #7F8C8D; text-align: center;">
                This link will expire in 24 hours for security reasons.
              </p>
              <p style="margin: 0; font-size: 12px; color: #ADB5BD; text-align: center;">
                © 2025 My Diary. Your private journaling space.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔑 Template 2: Password Reset

**Path:** Supabase Dashboard → Auth → Email Templates → **Reset password**

### Subject Line
```
Reset your password - My Diary 🔑
```

### HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - My Diary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); padding: 40px 40px 60px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔑</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; font-family: Georgia, serif;">
                Password Reset Request
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #2C3E50;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                We received a request to reset the password for your My Diary account. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);">
                  🔓 Reset Password
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="margin: 32px 0 0 0; padding: 24px; background: #F8F9FA; border-radius: 12px; border-left: 4px solid #D4AF37;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #34495E; font-weight: 600;">
                  Button not working?
                </p>
                <p style="margin: 0; font-size: 13px; color: #7F8C8D; word-break: break-all;">
                  Copy and paste this link:<br>
                  <a href="{{ .ConfirmationURL }}" style="color: #D4AF37;">{{ .ConfirmationURL }}</a>
                </p>
              </div>
              
              <!-- Security Warning -->
              <div style="margin: 32px 0 0 0; padding: 20px; background: #FFF3CD; border-radius: 8px; border: 1px solid #FFE69C;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #856404; font-weight: 600;">
                  ⚠️ Important Security Information
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #856404;">
                  <li>This link expires in 1 hour</li>
                  <li>If you didn't request this, ignore this email</li>
                  <li>Your password won't change unless you click the link</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: #F8F9FA; border-top: 1px solid #E9ECEF;">
              <p style="margin: 0; font-size: 12px; color: #ADB5BD; text-align: center;">
                © 2025 My Diary. Keeping your memories secure.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📬 Template 3: Email Change Confirmation

**Path:** Supabase Dashboard → Auth → Email Templates → **Change email address**

### Subject Line
```
Confirm your new email - My Diary
```

### HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change - My Diary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✉️</div>
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-family: Georgia, serif;">
                Confirm Your New Email
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 48px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                You requested to change your email address for My Diary. Click below to confirm this change:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px;">
                  ✅ Confirm New Email
                </a>
              </div>
              
              <div style="margin: 24px 0; padding: 16px; background: #FFF3CD; border-radius: 8px;">
                <p style="margin: 0; font-size: 13px; color: #856404;">
                  🔒 If you didn't request this change, please contact support immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px 40px; background: #F8F9FA; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #ADB5BD;">
                © 2025 My Diary
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📅 Template 4: Daily Journal Reminder

**Function:** `supabase/functions/email-reminders/index.ts`  
**Trigger:** Scheduled daily via pg_cron or Supabase Edge Function cron

### Subject Line
```
📝 Your daily journaling reminder - My Diary
```

### Email Body (Plain Text)
```
Hello! 👋

It's time for your daily journaling session. Taking a few minutes to reflect on your day can:

✨ Improve mental clarity
🎯 Track your progress
💭 Process your thoughts
🌱 Build a consistent habit

Your Current Stats:
• Streak: {current_streak} days 🔥
• Total Entries: {total_entries}
• Words Written: {total_words:,}

Start writing: https://yourdomain.com/app/new

Keep up the great work!

---
My Diary - Your Private Journaling Space
https://yourdomain.com
```

### Email Body (HTML Version)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFF5E6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF5E6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); padding: 32px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 8px;">📝</div>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-family: Georgia, serif;">
                Time to Journal!
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                Hello! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                It's time for your daily journaling session. Taking a few minutes to reflect on your day can:
              </p>
              
              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #34495E;">
                <li>✨ Improve mental clarity</li>
                <li>🎯 Track your progress</li>
                <li>💭 Process your thoughts</li>
                <li>🌱 Build a consistent habit</li>
              </ul>
              
              <!-- Stats Card -->
              <div style="margin: 32px 0; padding: 24px; background: #FFF5E6; border-radius: 12px; border-left: 4px solid #D4AF37;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #2C3E50; font-weight: 700;">
                  Your Current Stats:
                </h3>
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #34495E;">
                  🔥 <strong>Streak:</strong> {current_streak} days
                </p>
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #34495E;">
                  📚 <strong>Total Entries:</strong> {total_entries}
                </p>
                <p style="margin: 0; font-size: 15px; color: #34495E;">
                  ✍️ <strong>Words Written:</strong> {total_words:,}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://yourdomain.com/app/new" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">
                  ✨ Start Writing Now
                </a>
              </div>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #7F8C8D; text-align: center;">
                Keep up the great work! 🌟
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background: #F8F9FA; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #ADB5BD;">
                My Diary - Your Private Journaling Space
              </p>
              <p style="margin: 0; font-size: 11px; color: #CED4DA;">
                <a href="https://yourdomain.com/app/settings" style="color: #D4AF37; text-decoration: none;">Manage reminder settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📊 Template 5: Weekly Summary

**Function:** `supabase/functions/email-reminders/index.ts`  
**Trigger:** Scheduled weekly

### Subject Line
```
📊 Your weekly journaling summary - My Diary
```

### Email Body (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFF5E6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF5E6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); padding: 32px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 8px;">📊</div>
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-family: Georgia, serif;">
                Weekly Summary
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">
                {week_start} - {week_end}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                Here's what you accomplished this week! 🎉
              </p>
              
              <!-- Stats Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                <div style="padding: 20px; background: #FFF5E6; border-radius: 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: 800; color: #D4AF37; margin-bottom: 8px;">
                    {entries_this_week}
                  </div>
                  <div style="font-size: 14px; color: #7F8C8D;">
                    Entries Written
                  </div>
                </div>
                
                <div style="padding: 20px; background: #FFF5E6; border-radius: 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: 800; color: #D4AF37; margin-bottom: 8px;">
                    {words_this_week:,}
                  </div>
                  <div style="font-size: 14px; color: #7F8C8D;">
                    Words Written
                  </div>
                </div>
                
                <div style="padding: 20px; background: #FFF5E6; border-radius: 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: 800; color: #D4AF37; margin-bottom: 8px;">
                    {current_streak}
                  </div>
                  <div style="font-size: 14px; color: #7F8C8D;">
                    Day Streak 🔥
                  </div>
                </div>
                
                <div style="padding: 20px; background: #FFF5E6; border-radius: 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: 800; color: #D4AF37; margin-bottom: 8px;">
                    {total_entries}
                  </div>
                  <div style="font-size: 14px; color: #7F8C8D;">
                    Total Entries
                  </div>
                </div>
              </div>
              
              <!-- Most Active Day -->
              <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #FFF5E6 0%, #FFE6CC 100%); border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #2C3E50;">
                  📅 Most Active Day
                </h3>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #D4AF37;">
                  {most_active_day}
                </p>
              </div>
              
              <!-- Motivation -->
              <div style="margin: 32px 0; padding: 20px; background: #E8F5E9; border-radius: 12px; border-left: 4px solid #4CAF50;">
                <p style="margin: 0; font-size: 15px; color: #2E7D32; line-height: 1.6;">
                  💪 <strong>Keep it up!</strong> Consistent journaling helps you reflect, grow, and track your journey.
                </p>
              </div>
              
              <!-- CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://yourdomain.com/app" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">
                  📖 View Full Statistics
                </a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background: #F8F9FA; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #ADB5BD;">
                My Diary - Your Private Journaling Space
              </p>
              <p style="margin: 0; font-size: 11px; color: #CED4DA;">
                <a href="https://yourdomain.com/app/settings" style="color: #D4AF37; text-decoration: none;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔔 Template 6: Reminder Notification

**Function:** `supabase/functions/send-reminder-notifications/index.ts`  
**Trigger:** When reminder is due

### Subject Line
```
🔔 Reminder: {reminder_title} - My Diary
```

### Email Body (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFF5E6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF5E6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 32px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 8px;">🔔</div>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
                Reminder
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #2C3E50; font-weight: 700;">
                {reminder_title}
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #34495E;">
                {reminder_description}
              </p>
              
              <div style="margin: 24px 0; padding: 16px; background: #FFF5E6; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #7F8C8D;">
                  📅 <strong>Due:</strong> {reminder_date}
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://yourdomain.com/app/reminders" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">
                  ✅ Mark as Complete
                </a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background: #F8F9FA; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #ADB5BD;">
                My Diary - Stay on track with your goals
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🧪 Testing Email Templates

### Test in Supabase
1. Go to **Auth** → **Email Templates**
2. Click **Send test email** for each template
3. Check your inbox

### Test Reminder Emails
```bash
# Invoke the Edge Function manually
curl -L -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/email-reminders' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

---

## 🔧 Environment Variables for Email Functions

Add to `.env.local` (for local testing):
```env
# Supabase
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gmail SMTP (for reminders)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

---

## 📋 Email Sending Schedule

### Daily Reminders
- **Time:** 8:00 AM user's timezone (or configurable)
- **Frequency:** Daily for users with `email_reminders_enabled = true`
- **Method:** Supabase Edge Function + pg_cron

### Weekly Summary
- **Time:** Sunday 6:00 PM
- **Frequency:** Weekly for active users
- **Content:** Stats from past 7 days

### Reminder Notifications
- **Time:** As scheduled by user
- **Frequency:** once/daily/weekly/monthly
- **Method:** Edge Function checks every hour

---

## 🚀 Deployment Steps

### 1. Configure Supabase SMTP
✅ Add Gmail SMTP settings (see Step 1 above)

### 2. Update Email Templates
✅ Copy each HTML template to Supabase Dashboard

### 3. Set Environment Variables
```bash
# In Supabase Dashboard → Project Settings → Edge Functions
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### 4. Deploy Edge Functions
```bash
# Deploy email reminders function
supabase functions deploy email-reminders

# Deploy notification function
supabase functions deploy send-reminder-notifications
```

### 5. Schedule Cron Jobs
```sql
-- In Supabase SQL Editor
-- Daily reminders at 8 AM UTC
SELECT cron.schedule(
  'daily-email-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- Weekly summary on Sunday at 6 PM UTC
SELECT cron.schedule(
  'weekly-summary',
  '0 18 * * 0',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "weekly_summary"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## ✅ Checklist

- [ ] Configure Gmail App Password
- [ ] Add SMTP settings to Supabase
- [ ] Customize "Confirm signup" email template
- [ ] Customize "Reset password" email template
- [ ] Customize "Change email" email template
- [ ] Update Edge Function environment variables
- [ ] Deploy `email-reminders` function
- [ ] Deploy `send-reminder-notifications` function
- [ ] Schedule cron jobs in Supabase
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Test daily reminder email
- [ ] Test weekly summary email
- [ ] Test reminder notification email
- [ ] Update "yourdomain.com" in all templates
- [ ] Verify all emails render correctly on mobile

---

## 🎨 Customization Tips

### Colors
- Replace `#D4AF37` (gold) with your primary color
- Replace gradient values to match your brand

### Logo
- Replace 📖 emoji with your actual logo image
- Use `<img src="URL" width="64" height="64">`

### Domain
- Find & replace `yourdomain.com` with actual domain
- Update all links to production URLs

### Tone
- Adjust copy to match your brand voice
- Add/remove emojis based on preference

---

## 📱 Mobile Responsiveness

All templates use:
- **Max width:** 600px
- **Padding:** Responsive (40px → 20px on mobile)
- **Font sizes:** Readable on all devices
- **Buttons:** Touch-friendly (44px+ height)
- **Tables:** Fluid layout for small screens

---

## 🔒 Security Best Practices

✅ **Never** include passwords in emails  
✅ **Always** use HTTPS links  
✅ **Expire** magic links after 24 hours  
✅ **Log** all email sending attempts  
✅ **Verify** sender domain (SPF/DKIM)  
✅ **Rate limit** email sending  

---

## 📈 Success Metrics

Track these metrics:
- **Open Rate:** Should be >20%
- **Click Rate:** Should be >5%
- **Bounce Rate:** Should be <2%
- **Unsubscribe Rate:** Should be <0.5%

---

## 🎉 Congratulations!

Your email system is now production-ready! Users will receive beautiful, branded emails for all authentication and notification events.

**Next:** Read `CICD_AUTOMATION_GUIDE.md` for deployment automation.
