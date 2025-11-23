-- Custom email templates for authentication
-- This creates beautiful, branded email templates for verification and password reset

-- Note: Supabase uses their own email service by default.
-- To use custom templates, you need to configure SMTP settings in Supabase Dashboard:
-- Settings > Auth > Email Templates

-- Custom Email Verification Template
-- Go to: Supabase Dashboard > Auth > Email Templates > Confirm signup
-- Replace with this HTML:

/*
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
              
              <!-- Verify Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #C8A02C 100%); color: #ffffff; font-size: 18px; font-weight: 700; text-decoration: none; padding: 18px 48px; border-radius: 12px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3); transition: transform 0.2s;">
                      ✨ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 24px 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
                Or copy and paste this link into your browser:
              </p>
              
              <div style="background: #F8F9FA; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 13px; color: #5D6D7E; word-break: break-all; font-family: 'Courier New', monospace;">
                  {{ .ConfirmationURL }}
                </p>
              </div>
              
              <!-- Features Grid -->
              <div style="margin: 40px 0; padding: 32px 0; border-top: 2px solid #F0F0F0; border-bottom: 2px solid #F0F0F0;">
                <h3 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 700; color: #2C3E50; text-align: center;">
                  What You'll Get
                </h3>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="padding: 12px; vertical-align: top;">
                      <div style="text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🔒</div>
                        <div style="font-size: 14px; font-weight: 600; color: #2C3E50; margin-bottom: 4px;">
                          Private & Secure
                        </div>
                        <div style="font-size: 12px; color: #7F8C8D;">
                          Your thoughts, encrypted
                        </div>
                      </div>
                    </td>
                    <td width="50%" style="padding: 12px; vertical-align: top;">
                      <div style="text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
                        <div style="font-size: 14px; font-weight: 600; color: #2C3E50; margin-bottom: 4px;">
                          Insights & Analytics
                        </div>
                        <div style="font-size: 12px; color: #7F8C8D;">
                          Track your growth
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" style="padding: 12px; vertical-align: top;">
                      <div style="text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🎨</div>
                        <div style="font-size: 14px; font-weight: 600; color: #2C3E50; margin-bottom: 4px;">
                          Rich Formatting
                        </div>
                        <div style="font-size: 12px; color: #7F8C8D;">
                          Express yourself
                        </div>
                      </div>
                    </td>
                    <td width="50%" style="padding: 12px; vertical-align: top;">
                      <div style="text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🌙</div>
                        <div style="font-size: 14px; font-weight: 600; color: #2C3E50; margin-bottom: 4px;">
                          Dark Mode
                        </div>
                        <div style="font-size: 12px; color: #7F8C8D;">
                          Write comfortably
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Note -->
              <div style="background: #FFF9F0; border: 2px solid #FFE6CC; border-radius: 12px; padding: 20px; margin-top: 32px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #856404;">
                  <strong style="display: block; margin-bottom: 8px;">🔐 Security Note:</strong>
                  This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #F8F9FA; padding: 32px 40px; text-align: center; border-top: 1px solid #E9ECEF;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6C757D; font-weight: 600;">
                Questions? We're here to help!
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #6C757D;">
                Contact us at <a href="mailto:support@mydiary.com" style="color: #D4AF37; text-decoration: none; font-weight: 600;">support@mydiary.com</a>
              </p>
              
              <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #DEE2E6;">
                <p style="margin: 0; font-size: 12px; color: #ADB5BD;">
                  &copy; 2025 My Diary. All rights reserved.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #ADB5BD;">
                  Empowering your personal growth, one entry at a time ✨
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
*/

-- Password Reset Email Template
-- Go to: Supabase Dashboard > Auth > Email Templates > Reset password
-- Replace with similar HTML (change heading to "Reset Your Password" and button text)

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✨ Custom email templates ready!';
  RAISE NOTICE '';
  RAISE NOTICE '📧 To enable custom email templates:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Auth > Email Templates';
  RAISE NOTICE '2. Replace default templates with the HTML above';
  RAISE NOTICE '3. Templates include: Verification, Password Reset';
  RAISE NOTICE '4. Features: Branded design, mobile responsive, dark mode friendly';
END $$;
