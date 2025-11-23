# Custom Email Templates Setup Guide

## Overview

This guide explains how to configure beautiful, custom-branded email templates for authentication in Supabase.

## Why Custom Templates?

By default, Supabase uses plain text emails. Custom templates provide:
- **Professional branding** with your app's design
- **Better user experience** with clear CTAs and instructions
- **Mobile responsiveness** that works on all devices
- **Visual appeal** that increases engagement

## Templates Included

1. **Email Verification** - Sent when users sign up
2. **Password Reset** - Sent when users request password reset
3. **Magic Link** - Sent for passwordless login (optional)

## Step-by-Step Setup

### 1. Access Supabase Dashboard

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **Email Templates** in the left sidebar

### 2. Configure Email Verification Template

1. Click on **Confirm signup** template
2. Delete the existing template
3. Paste the custom HTML from `supabase/migrations/017_custom_email_templates.sql`
4. Click **Save**

### 3. Test the Email

1. Create a test account in your app
2. Check your email inbox
3. Verify the email looks correct and the verification link works

### 4. Optional: Configure SMTP

For production, configure custom SMTP settings:

1. Go to **Settings** > **Auth** > **SMTP Settings**
2. Enter your SMTP provider details (e.g., SendGrid, Mailgun, AWS SES)
3. Enable **Enable Custom SMTP**
4. Test by sending yourself an email

## Email Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - Verification/reset link
- `{{ .Token }}` - Magic link token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your app's URL
- `{{ .Email }}` - User's email address

## Customization Options

### Change Colors

Replace hex colors in the HTML:
- **Primary Gold**: `#D4AF37` → Your brand color
- **Background**: `#FFF5E6` → Your background color
- **Text**: `#2C3E50` → Your text color

### Change Logo

Replace the emoji icon (📖) with an image:

```html
<img src="https://yourdomain.com/logo.png" 
     alt="My Diary Logo" 
     width="64" 
     height="64" 
     style="margin-bottom: 16px;" />
```

### Add Social Links

Add social media icons to the footer:

```html
<div style="margin: 20px 0;">
  <a href="https://twitter.com/yourbrand" style="margin: 0 8px;">
    <img src="https://yourdomain.com/twitter-icon.png" width="24" height="24" alt="Twitter" />
  </a>
  <a href="https://facebook.com/yourbrand" style="margin: 0 8px;">
    <img src="https://yourdomain.com/facebook-icon.png" width="24" height="24" alt="Facebook" />
  </a>
</div>
```

## Email Design Best Practices

### 1. Mobile First
- Max width: 600px
- Touch-friendly buttons (min 44px height)
- Large, readable text (min 14px)

### 2. Clear Call-to-Action
- One primary action per email
- Prominent button with high contrast
- Fallback text link

### 3. Security Information
- Explain why they received the email
- Include expiration time
- Provide contact support option

### 4. Accessibility
- Semantic HTML structure
- Alt text for images
- High color contrast
- Clear hierarchy

## Testing Checklist

Before going live, test:

- [ ] Email displays correctly in Gmail
- [ ] Email displays correctly in Outlook
- [ ] Mobile view (iPhone, Android)
- [ ] Dark mode appearance (iOS Mail, Gmail)
- [ ] Verification link works
- [ ] Unsubscribe link works (if applicable)
- [ ] Images load correctly
- [ ] Text is readable without images

## Troubleshooting

### Email not sending
- Check Supabase email logs: **Authentication** > **Users** > **Logs**
- Verify SMTP settings if using custom SMTP
- Check spam folder

### Link not working
- Ensure `{{ .ConfirmationURL }}` is correctly placed
- Check redirect URL settings in Supabase Auth
- Verify site URL in Supabase settings

### Styling broken
- Test HTML in [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com)
- Use inline styles (avoid external CSS)
- Test in multiple email clients

## Advanced: Localization

To support multiple languages, create separate templates:

```html
{% if .Language == "es" %}
  <h2>¡Bienvenido!</h2>
  <p>Haz clic para verificar tu correo electrónico.</p>
{% elsif .Language == "fr" %}
  <h2>Bienvenue!</h2>
  <p>Cliquez pour vérifier votre e-mail.</p>
{% else %}
  <h2>Welcome!</h2>
  <p>Click to verify your email.</p>
{% endif %}
```

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Template Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [HTML Email Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)

## Support

Need help? Contact:
- **Documentation**: Check [Supabase Discord](https://discord.supabase.com)
- **Email**: support@yourdomain.com
- **GitHub**: Open an issue in your repository

---

**Last Updated**: November 23, 2025  
**Version**: 1.0
