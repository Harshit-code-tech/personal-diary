'use client'

import { useStreakStats } from '@/lib/hooks/useStreaks'
import { useEntries } from '@/lib/hooks/useData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function StreakDashboard() {
  const { data: streakStats, isLoading } = useStreakStats()
  const { data: entries } = useEntries()

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!streakStats) return null

  const {
    currentStreak,
    longestStreak,
    consistencyRate,
    nextMilestone,
    totalEntries,
    daysWithEntries,
    totalDaysTracked,
  } = streakStats

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              {nextMilestone.message}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <span className="text-2xl">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Personal best
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consistencyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {daysWithEntries} of {totalDaysTracked} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Writing Calendar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your writing activity over the past 6 months
          </p>
        </CardHeader>
        <CardContent>
          <StreakCalendarHeatmap calendar={streakStats.calendar} />
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MilestoneProgress current={currentStreak} target={7} label="Week Streak" />
          <MilestoneProgress current={currentStreak} target={30} label="Month Streak" />
          <MilestoneProgress current={currentStreak} target={100} label="100-Day Streak" />
          <MilestoneProgress current={currentStreak} target={365} label="Year Streak" />
        </CardContent>
      </Card>
    </div>
  )
}

// Heatmap component
function StreakCalendarHeatmap({ calendar }: { calendar: any }) {
  const dates = Object.keys(calendar).sort()
  const weeks: string[][] = []
  let currentWeek: string[] = []

  dates.forEach((date, i) => {
    const day = new Date(date).getDay()
    
    if (i === 0) {
      // Pad the first week
      currentWeek = Array(day).fill('')
    }
    
    currentWeek.push(date)
    
    if (currentWeek.length === 7 || i === dates.length - 1) {
      // Pad the last week if needed
      while (currentWeek.length < 7) {
        currentWeek.push('')
      }
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[repeat(53,_20px)] gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={`empty-${dayIndex}`} className="w-4 h-4" />
              }

              const dayData = calendar[date]
              const level = dayData?.hasEntry
                ? dayData.entryCount > 2
                  ? 'high'
                  : 'medium'
                : 'none'

              return (
                <div
                  key={date}
                  className={`w-4 h-4 rounded-sm transition-colors ${
                    level === 'high'
                      ? 'bg-green-600 dark:bg-green-500'
                      : level === 'medium'
                      ? 'bg-green-400 dark:bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  title={`${date}: ${dayData?.entryCount || 0} entries`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-gray-700" />
        <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-600" />
        <div className="w-4 h-4 rounded-sm bg-green-600 dark:bg-green-500" />
        <span>More</span>
      </div>
    </div>
  )
}

// Milestone progress bar
function MilestoneProgress({ current, target, label }: { current: number; target: number; label: string }) {
  const progress = Math.min((current / target) * 100, 100)
  const achieved = current >= target

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {achieved ? '✓ ' : ''}{current}/{target}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            achieved ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
