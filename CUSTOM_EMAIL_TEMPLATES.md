# 📧 Custom Supabase Email Templates

Go to your Supabase Dashboard to customize email templates with beautiful designs!

## 🔗 Direct Link
```
https://supabase.com/dashboard/project/blmmcdqlipcrpsfodrww/auth/templates
```

---

## 📝 **Email Templates to Customize:**

### **1. Confirm Signup (Email Verification)**

**Subject:** Welcome to Your Personal Diary - Verify Your Email ✨

**Body HTML:**
```html
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #FFF9F0; padding: 40px 20px;">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-size: 48px; margin: 0;">📔</h1>
    <h2 style="color: #2D3748; font-size: 32px; margin: 10px 0;">My Diary</h2>
    <p style="color: #718096; font-size: 16px;">Your Space. Your Thoughts.</p>
  </div>

  <!-- Main Content -->
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h3 style="color: #2D3748; font-size: 24px; margin-bottom: 20px;">Welcome to Your Journaling Journey!</h3>
    
    <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      We're thrilled to have you here. Your private, secure journaling space is almost ready.
    </p>

    <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Click the button below to verify your email address and start writing your first entry:
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #D4A44F; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        Verify My Email
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #D4A44F; font-size: 12px; word-break: break-all;">
      {{ .ConfirmationURL }}
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 40px; color: #A0AEC0; font-size: 14px;">
    <p>This link expires in 24 hours for your security.</p>
    <p style="margin-top: 10px;">If you didn't create this account, you can safely ignore this email.</p>
    <p style="margin-top: 20px; color: #CBD5E0;">© 2025 My Personal Diary. Your thoughts, forever private.</p>
  </div>
</div>
```

---

### **2. Magic Link (Email Login)**

**Subject:** Sign in to Your Personal Diary 🔐

**Body HTML:**
```html
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #F7FAFC; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-size: 48px; margin: 0;">📔</h1>
    <h2 style="color: #2D3748; font-size: 32px; margin: 10px 0;">My Diary</h2>
  </div>

  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h3 style="color: #2D3748; font-size: 24px; margin-bottom: 20px;">Your Magic Sign-In Link</h3>
    
    <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Click the button below to securely sign in to your diary:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #4299E1; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        Sign In to My Diary
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      This link expires in 1 hour.
    </p>
  </div>

  <div style="text-align: center; margin-top: 40px; color: #A0AEC0; font-size: 14px;">
    <p>Didn't request this? Ignore this email.</p>
  </div>
</div>
```

---

### **3. Reset Password**

**Subject:** Reset Your Personal Diary Password 🔑

**Body HTML:**
```html
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #FFF9F0; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-size: 48px; margin: 0;">📔</h1>
    <h2 style="color: #2D3748; font-size: 32px; margin: 10px 0;">Password Reset</h2>
  </div>

  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h3 style="color: #2D3748; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h3>
    
    <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      We received a request to reset your password. Click below to create a new one:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #F56565; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        Reset Password
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Link expires in 1 hour.
    </p>
  </div>

  <div style="text-align: center; margin-top: 40px; color: #A0AEC0; font-size: 14px;">
    <p>Didn't request this? Your password is still secure.</p>
  </div>
</div>
```

---

### **4. Email Change Confirmation**

**Subject:** Confirm Your New Email Address 📬

**Body HTML:**
```html
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #F7FAFC; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-size: 48px; margin: 0;">📔</h1>
    <h2 style="color: #2D3748; font-size: 32px; margin: 10px 0;">Email Change Request</h2>
  </div>

  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Please confirm this is your new email address:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #48BB78; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        Confirm New Email
      </a>
    </div>
  </div>
</div>
```

---

## 🎨 **How to Apply:**

1. Go to **Supabase Dashboard**
2. Click **Authentication → Email Templates**
3. Select each template type
4. Paste the HTML code above
5. Click **Save**

**Test it:** Create a new account to see the beautiful email! ✨

---

## 🚀 **Pro Tips:**

- Keep emails under 100KB
- Test on mobile devices
- Use inline CSS (no external stylesheets)
- Preview before saving

---

**Need help?** Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email-templates
