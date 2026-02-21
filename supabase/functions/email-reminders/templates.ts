// Beautiful HTML Email Templates for Personal Diary App

interface EmailTemplateProps {
  userName?: string
  currentStreak: number
  totalEntries: number
  appUrl: string
}

export function generateDailyReminderEmail({ userName, currentStreak, appUrl }: EmailTemplateProps): string {
  const displayName = userName || 'there'

  // Random writing prompt
  const prompts = [
    'What was the highlight of your day? What are you grateful for?',
    'What are three things you\'re grateful for today?',
    'What went well today? Celebrate your wins, big or small.',
    'What did you learn about yourself today?',
    'What are your intentions for tomorrow?',
    'How do you want to feel by the end of the week?',
    'What\'s one small thing that brought you joy recently?',
    'What challenges did you face, and how did you overcome them?',
    'Describe a moment today that made you smile.',
    'What would you tell your future self about today?'
  ]
  const prompt = prompts[Math.floor(Math.random() * prompts.length)]

  const streakSection = currentStreak > 0 ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); border-radius: 12px; padding: 20px; text-align: center;">
                <span style="font-size: 28px;">🔥</span>
                <p style="margin: 8px 0 0 0; color: #2C3E50; font-size: 18px; font-weight: 600;">${currentStreak}-day streak!</p>
                <p style="margin: 4px 0 0 0; color: #2C3E50; font-size: 13px;">Keep the momentum going!</p>
              </div>
            </td>
          </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Journal Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4C1 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px; font-weight: 600;">Daily Journal Reminder</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <p style="margin: 0 0 20px; color: #2C3E50; font-size: 18px; line-height: 1.6;">Hi ${displayName}! 👋</p>
              <p style="margin: 0 0 24px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                It's time to reflect on your day and write in your journal. Taking a few moments to document your thoughts, feelings, and experiences can help you:
              </p>
              <ul style="color: #546E7A; line-height: 2; font-size: 15px; padding-left: 20px; margin: 0 0 24px 0;">
                <li>Process your emotions and gain clarity</li>
                <li>Track your personal growth over time</li>
                <li>Preserve memories and important moments</li>
                <li>Reduce stress and improve mental wellbeing</li>
              </ul>
            </td>
          </tr>${streakSection}
          <!-- Writing Prompt -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background: #FFF9E6; border-left: 4px solid #D4AF37; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #7A6A2E; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Writing Prompt:</strong> ${prompt}
                </p>
              </div>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="${appUrl}/app/new" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941A 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">
                Start Writing →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 20px 32px; text-align: center;">
              <p style="margin: 0; color: #90A4AE; font-size: 14px;">Take a moment for yourself today 💙</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 24px 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0 0 8px; color: #90A4AE; font-size: 13px;">You're receiving this because you enabled daily reminders</p>
              <p style="margin: 0; color: #90A4AE; font-size: 13px;">
                <a href="${appUrl}/app/settings" style="color: #D4AF37; text-decoration: none;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function generateWeeklySummaryEmail({ userName, currentStreak, totalEntries, appUrl }: EmailTemplateProps): string {
  const displayName = userName || 'there'
  const hasStreakMilestone = currentStreak >= 7

  const milestoneSection = hasStreakMilestone ? `
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); border-radius: 12px; padding: 24px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
                <p style="margin: 0; color: #2C3E50; font-size: 18px; font-weight: 600;">Amazing! You journaled every day this week!</p>
                <p style="margin: 8px 0 0; color: #2C3E50; font-size: 14px;">Consistency is the key to growth. Keep it up!</p>
              </div>
            </td>
          </tr>` : `
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <div style="background-color: #F8F9FA; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #2C3E50; font-size: 15px;">
                  💡 <strong>Tip:</strong> Journaling regularly helps build self-awareness and reduces stress.
                </p>
              </div>
            </td>
          </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Journaling Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2EC4B6 0%, #A8DADC 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px; font-weight: 600;">Your Weekly Summary</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px 20px 30px;">
              <p style="margin: 0 0 20px; color: #2C3E50; font-size: 18px; line-height: 1.6;">Hi ${displayName}! 👋</p>
              <p style="margin: 0 0 28px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                Here's a look at your journaling journey this week. Every entry is a step toward self-discovery!
              </p>
              <!-- Stats Grid -->
              <table role="presentation" style="width: 100%; margin-bottom: 28px;">
                <tr>
                  <td style="width: 48%; padding: 20px; background-color: #F8F9FA; border-radius: 12px; text-align: center;" valign="top">
                    <div style="font-size: 32px; margin-bottom: 8px;">📝</div>
                    <p style="margin: 0; color: #2C3E50; font-size: 32px; font-weight: 700;">${totalEntries}</p>
                    <p style="margin: 8px 0 0; color: #546E7A; font-size: 14px;">Total Entries</p>
                  </td>
                  <td style="width: 4%;"></td>
                  <td style="width: 48%; padding: 20px; background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); border-radius: 12px; text-align: center;" valign="top">
                    <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
                    <p style="margin: 0; color: #2C3E50; font-size: 32px; font-weight: 700;">${currentStreak}</p>
                    <p style="margin: 8px 0 0; color: #2C3E50; font-size: 14px;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>${milestoneSection}
          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 30px 32px 30px; text-align: center;">
              <a href="${appUrl}/app/calendar" style="display: inline-block; background: linear-gradient(135deg, #2EC4B6 0%, #1A8B81 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(46, 196, 182, 0.3); margin: 0 6px;">
                View Calendar
              </a>
              <a href="${appUrl}/app/new" style="display: inline-block; background-color: #ffffff; color: #2EC4B6; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; border: 2px solid #2EC4B6; margin: 0 6px;">
                Write New Entry
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 20px 30px; text-align: center;">
              <p style="margin: 0; color: #90A4AE; font-size: 14px;">Keep reflecting, keep growing 💙</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 24px 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0 0 8px; color: #90A4AE; font-size: 13px;">You're receiving weekly summaries as part of your journaling preferences</p>
              <p style="margin: 0; color: #90A4AE; font-size: 13px;">
                <a href="${appUrl}/app/settings" style="color: #2EC4B6; text-decoration: none;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function generateStreakMilestoneEmail({ userName, currentStreak, appUrl }: EmailTemplateProps): string {
  const displayName = userName || 'there'
  const milestones: Record<number, { emoji: string; title: string; message: string }> = {
    7: { emoji: '🎯', title: '1 Week Streak!', message: 'You\'ve journaled for 7 days straight!' },
    14: { emoji: '🌟', title: '2 Week Streak!', message: 'Two weeks of consistent journaling!' },
    30: { emoji: '🏆', title: '1 Month Streak!', message: 'An entire month of self-reflection!' },
    60: { emoji: '💎', title: '2 Month Streak!', message: 'Your dedication is inspiring!' },
    90: { emoji: '👑', title: '3 Month Streak!', message: 'You\'re a journaling champion!' },
    365: { emoji: '🎊', title: '1 Year Streak!', message: 'A full year of journaling! Incredible!' },
  }

  const milestone = milestones[currentStreak] || { emoji: '🔥', title: `${currentStreak}-Day Streak!`, message: 'Keep the fire burning!' }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Streak Milestone Achieved!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Celebration Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCF7F 100%); padding: 48px 30px; text-align: center;">
              <div style="font-size: 72px; margin-bottom: 16px;">${milestone.emoji}</div>
              <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">${milestone.title}</h1>
              <p style="margin: 0; color: #ffffff; font-size: 18px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">${milestone.message}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px; text-align: center;">
              <p style="margin: 0 0 20px; color: #2C3E50; font-size: 18px; line-height: 1.6;">Congratulations, ${displayName}! 🎉</p>
              <p style="margin: 0 0 28px; color: #546E7A; font-size: 16px; line-height: 1.6;">
                You've reached an incredible milestone in your journaling journey.
                Your commitment to self-reflection and personal growth is truly inspiring!
              </p>
              <!-- Streak Counter -->
              <div style="background: linear-gradient(135deg, #FF6B6B 20%, #FFE66D 100%); border-radius: 12px; padding: 28px; margin-bottom: 28px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔥</div>
                <p style="margin: 0; color: #2C3E50; font-size: 48px; font-weight: 700;">${currentStreak}</p>
                <p style="margin: 8px 0 0; color: #2C3E50; font-size: 18px; font-weight: 600;">Days Strong!</p>
              </div>
              <!-- Why This Matters -->
              <div style="background-color: #F8F9FA; border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: left;">
                <p style="margin: 0 0 12px; color: #2C3E50; font-size: 16px; font-weight: 600;">Why this matters:</p>
                <ul style="margin: 0; padding-left: 20px; color: #546E7A; font-size: 15px; line-height: 1.8;">
                  <li>Building habits takes consistency and dedication</li>
                  <li>Regular reflection leads to better self-awareness</li>
                  <li>You're investing in your mental well-being</li>
                  <li>Your future self will thank you for these insights</li>
                </ul>
              </div>
              <!-- CTA -->
              <a href="${appUrl}/app/calendar" style="display: inline-block; background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); color: #2C3E50; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(255, 107, 107, 0.3);">
                View Your Progress
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px 20px 30px; text-align: center;">
              <p style="margin: 0; color: #90A4AE; font-size: 14px;">Keep up the amazing work! 💙</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 24px 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0; color: #90A4AE; font-size: 13px;">
                <a href="${appUrl}/app/settings" style="color: #FF6B6B; text-decoration: none;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
