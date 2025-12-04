'use client'

import { useStreakStatus } from '@/lib/hooks/useStreaks'
import { AlertCircle, Flame } from 'lucide-react'

export default function StreakBadge() {
  const { currentStreak, isAtRisk, encouragement, isLoading } = useStreakStatus()

  if (isLoading) return null

  return (
    <div className="flex items-center gap-2">
      {currentStreak > 0 && (
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            isAtRisk
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
          }`}
          title={encouragement}
        >
          {isAtRisk ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Flame className="w-4 h-4" />
          )}
          <span>{currentStreak} day streak</span>
        </div>
      )}
    </div>
  )
}
