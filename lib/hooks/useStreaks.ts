// React hook for streak tracking
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { calculateStreaks, generateStreakCalendar, getStreakStats, isStreakAtRisk, getStreakEncouragement } from '@/lib/streak-utils'

/**
 * Hook to get current streak data
 */
export function useStreaks() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['streaks', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      return await calculateStreaks(user.id)
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook to get streak calendar for visualization
 */
export function useStreakCalendar(months: number = 3) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['streakCalendar', user?.id, months],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      return await generateStreakCalendar(user.id, months)
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
  })
}

/**
 * Hook to get comprehensive streak statistics
 */
export function useStreakStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['streakStats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      return await getStreakStats(user.id)
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

/**
 * Hook to check if streak is at risk
 */
export function useStreakStatus() {
  const { data: streakData, isLoading } = useStreaks()

  if (isLoading || !streakData) {
    return {
      isAtRisk: false,
      encouragement: '',
      currentStreak: 0,
      isLoading: true,
    }
  }

  const atRisk = isStreakAtRisk(streakData.lastEntryDate)
  const encouragement = getStreakEncouragement(streakData)

  return {
    isAtRisk: atRisk,
    encouragement,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    nextMilestone: streakData.nextMilestone,
    isLoading: false,
  }
}
