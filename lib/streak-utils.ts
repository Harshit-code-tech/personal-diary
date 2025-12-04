// Comprehensive streak tracking and analysis
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface StreakData {
  currentStreak: number
  longestStreak: number
  totalEntries: number
  streakDates: string[]
  streakPercentage: number
  lastEntryDate: string | null
  nextMilestone: {
    days: number
    message: string
  }
}

export interface StreakCalendar {
  [date: string]: {
    hasEntry: boolean
    entryCount: number
    inStreak: boolean
  }
}

/**
 * Calculate current and longest writing streaks
 */
export async function calculateStreaks(userId: string): Promise<StreakData> {
  const { data: entries, error } = await supabase
    .from('entries')
    .select('entry_date')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })

  if (error || !entries) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      streakDates: [],
      streakPercentage: 0,
      lastEntryDate: null,
      nextMilestone: { days: 7, message: 'Keep going! Reach 7 days' },
    }
  }

  const dates = entries.map(e => e.entry_date)
  const uniqueDates = [...new Set(dates)].sort()
  
  // Calculate current streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let currentStreak = 0
  let checkDate = new Date(today)
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (uniqueDates.includes(dateStr)) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  const streakDates: string[] = []
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i])
    const prevDate = i > 0 ? new Date(uniqueDates[i - 1]) : null
    
    if (!prevDate) {
      tempStreak = 1
      if (currentStreak > 0 && streakDates.length < currentStreak) {
        streakDates.push(uniqueDates[i])
      }
    } else {
      const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        tempStreak++
        if (currentStreak > 0 && streakDates.length < currentStreak) {
          streakDates.push(uniqueDates[i])
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // Calculate streak percentage (entries in last 30 days)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentEntries = uniqueDates.filter(d => new Date(d) >= thirtyDaysAgo).length
  const streakPercentage = Math.round((recentEntries / 30) * 100)

  // Next milestone
  const milestones = [7, 14, 30, 50, 100, 365]
  const nextMilestone = milestones.find(m => m > currentStreak) || 1000
  
  return {
    currentStreak,
    longestStreak,
    totalEntries: entries.length,
    streakDates,
    streakPercentage,
    lastEntryDate: uniqueDates[0] || null,
    nextMilestone: {
      days: nextMilestone,
      message: getStreakMessage(currentStreak, nextMilestone),
    },
  }
}

/**
 * Generate streak calendar for visualization
 */
export async function generateStreakCalendar(
  userId: string,
  months: number = 3
): Promise<StreakCalendar> {
  const { data: entries } = await supabase
    .from('entries')
    .select('entry_date')
    .eq('user_id', userId)

  if (!entries) return {}

  const calendar: StreakCalendar = {}
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setHours(0, 0, 0, 0)

  // Group entries by date
  const entriesByDate = entries.reduce((acc: any, entry) => {
    acc[entry.entry_date] = (acc[entry.entry_date] || 0) + 1
    return acc
  }, {})

  // Calculate streak ranges
  const dates = Object.keys(entriesByDate).sort()
  const streakRanges: { start: string; end: string }[] = []
  let streakStart: string | null = null
  let prevDate: string | null = null

  dates.forEach(date => {
    if (!prevDate) {
      streakStart = date
    } else {
      const diff = Math.floor(
        (new Date(date).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diff > 1) {
        if (streakStart) {
          streakRanges.push({ start: streakStart, end: prevDate })
        }
        streakStart = date
      }
    }
    prevDate = date
  })
  
  if (streakStart && prevDate) {
    streakRanges.push({ start: streakStart, end: prevDate })
  }

  // Build calendar
  const currentDate = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const inStreak = streakRanges.some(
      range => dateStr >= range.start && dateStr <= range.end
    )

    calendar[dateStr] = {
      hasEntry: !!entriesByDate[dateStr],
      entryCount: entriesByDate[dateStr] || 0,
      inStreak,
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return calendar
}

/**
 * Get motivational message based on streak
 */
function getStreakMessage(current: number, next: number): string {
  const remaining = next - current
  
  if (current === 0) return '🌱 Start your first streak today!'
  if (current < 7) return `🔥 ${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach a week!`
  if (current < 14) return `💪 ${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach 2 weeks!`
  if (current < 30) return `🚀 ${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach a month!`
  if (current < 100) return `⭐ ${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach 100 days!`
  if (current < 365) return `🏆 ${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach a year!`
  return '🎉 Amazing! You\'re a writing legend!'
}

/**
 * Get streak statistics
 */
export async function getStreakStats(userId: string) {
  const streaks = await calculateStreaks(userId)
  const calendar = await generateStreakCalendar(userId, 6)
  
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const calendarDates = Object.keys(calendar)
    .filter(date => new Date(date) >= sixMonthsAgo)
    .sort()
  
  const totalDays = calendarDates.length
  const daysWithEntries = calendarDates.filter(date => calendar[date].hasEntry).length
  const consistencyRate = totalDays > 0 ? Math.round((daysWithEntries / totalDays) * 100) : 0
  
  return {
    ...streaks,
    calendar,
    consistencyRate,
    totalDaysTracked: totalDays,
    daysWithEntries,
  }
}

/**
 * Check if streak is at risk (no entry today)
 */
export function isStreakAtRisk(lastEntryDate: string | null): boolean {
  if (!lastEntryDate) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastEntry = new Date(lastEntryDate)
  lastEntry.setHours(0, 0, 0, 0)
  
  return lastEntry < today
}

/**
 * Get streak encouragement based on current status
 */
export function getStreakEncouragement(streakData: StreakData): string {
  const { currentStreak, lastEntryDate } = streakData
  
  if (!lastEntryDate) {
    return '✨ Start your journaling journey today!'
  }
  
  const atRisk = isStreakAtRisk(lastEntryDate)
  
  if (atRisk && currentStreak > 0) {
    return `⚠️ Your ${currentStreak}-day streak is at risk! Write today to keep it alive.`
  }
  
  if (currentStreak === 0) {
    return '🌱 Begin a new streak today!'
  }
  
  if (currentStreak < 7) {
    return `🔥 ${currentStreak}-day streak! Keep the momentum going!`
  }
  
  if (currentStreak < 30) {
    return `💪 ${currentStreak} days strong! You\'re building a great habit!`
  }
  
  if (currentStreak < 100) {
    return `🚀 ${currentStreak} days! You\'re on fire!`
  }
  
  return `🏆 ${currentStreak}-day streak! Absolutely incredible!`
}
