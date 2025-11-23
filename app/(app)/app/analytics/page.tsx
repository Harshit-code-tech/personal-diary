'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, Calendar, Zap, Award, Target, Clock } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'

type WritingStats = {
  totalEntries: number
  totalWords: number
  avgWordsPerEntry: number
  longestEntry: number
  shortestEntry: number
  totalDays: number
  entriesThisWeek: number
  entriesThisMonth: number
  wordsThisWeek: number
  wordsThisMonth: number
  currentStreak: number
  longestStreak: number
  mostProductiveDay: string
  mostProductiveHour: number
}

type DailyStats = {
  date: string
  entries: number
  words: number
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WritingStats>({
    totalEntries: 0,
    totalWords: 0,
    avgWordsPerEntry: 0,
    longestEntry: 0,
    shortestEntry: 0,
    totalDays: 0,
    entriesThisWeek: 0,
    entriesThisMonth: 0,
    wordsThisWeek: 0,
    wordsThisMonth: 0,
    currentStreak: 0,
    longestStreak: 0,
    mostProductiveDay: 'Monday',
    mostProductiveHour: 20
  })
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Calculate date range
      let startDate = new Date()
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1)
      } else if (timeRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1)
      } else {
        startDate = new Date('2000-01-01')
      }

      // Fetch all entries
      let query = supabase
        .from('entries')
        .select('id, title, word_count, entry_date, created_at')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false })

      if (timeRange !== 'all') {
        query = query.gte('entry_date', startDate.toISOString().split('T')[0])
      }

      const { data: entries, error } = await query

      if (error) throw error

      // Calculate statistics
      const totalEntries = entries?.length || 0
      const totalWords = entries?.reduce((sum, e) => sum + (e.word_count || 0), 0) || 0
      const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0
      
      const wordCounts = entries?.map(e => e.word_count || 0) || []
      const longestEntry = wordCounts.length > 0 ? Math.max(...wordCounts) : 0
      const shortestEntry = wordCounts.length > 0 ? Math.min(...wordCounts.filter(w => w > 0)) : 0

      // Calculate unique days written
      const uniqueDates = new Set(entries?.map(e => e.entry_date) || [])
      const totalDays = uniqueDates.size

      // This week/month stats
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      const entriesThisWeek = entries?.filter(e => 
        new Date(e.entry_date) >= weekAgo
      ).length || 0

      const entriesThisMonth = entries?.filter(e => 
        new Date(e.entry_date) >= monthAgo
      ).length || 0

      const wordsThisWeek = entries?.filter(e => 
        new Date(e.entry_date) >= weekAgo
      ).reduce((sum, e) => sum + (e.word_count || 0), 0) || 0

      const wordsThisMonth = entries?.filter(e => 
        new Date(e.entry_date) >= monthAgo
      ).reduce((sum, e) => sum + (e.word_count || 0), 0) || 0

      // Calculate streaks
      const sortedDates = Array.from(uniqueDates).sort()
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 1

      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Current streak
      if (sortedDates.includes(today) || sortedDates.includes(yesterdayStr)) {
        currentStreak = 1
        let checkDate = sortedDates.includes(today) 
          ? new Date() 
          : yesterday
        
        for (let i = sortedDates.length - 1; i >= 0; i--) {
          checkDate.setDate(checkDate.getDate() - 1)
          const dateStr = checkDate.toISOString().split('T')[0]
          if (sortedDates.includes(dateStr)) {
            currentStreak++
          } else {
            break
          }
        }
      }

      // Longest streak
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)

      // Most productive day of week
      const dayOfWeekCounts: Record<number, number> = {}
      entries?.forEach(e => {
        const dayOfWeek = new Date(e.entry_date).getDay()
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
      })
      const mostProductiveDayNum = Object.entries(dayOfWeekCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '0'
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const mostProductiveDay = dayNames[parseInt(mostProductiveDayNum)]

      // Most productive hour
      const hourCounts: Record<number, number> = {}
      entries?.forEach(e => {
        const hour = new Date(e.created_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })
      const mostProductiveHour = parseInt(
        Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || '20'
      )

      // Daily stats for chart
      const dailyMap = new Map<string, { entries: number; words: number }>()
      entries?.forEach(e => {
        const date = e.entry_date
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { entries: 0, words: 0 })
        }
        const stats = dailyMap.get(date)!
        stats.entries++
        stats.words += e.word_count || 0
      })

      const dailyStatsArray: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({
          date,
          entries: stats.entries,
          words: stats.words
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30) // Last 30 days

      setStats({
        totalEntries,
        totalWords,
        avgWordsPerEntry,
        longestEntry,
        shortestEntry,
        totalDays,
        entriesThisWeek,
        entriesThisMonth,
        wordsThisWeek,
        wordsThisMonth,
        currentStreak,
        longestStreak,
        mostProductiveDay,
        mostProductiveHour
      })

      setDailyStats(dailyStatsArray)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/app"
            className="group flex items-center gap-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Back</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-3 leading-tight flex items-center gap-4">
            <BarChart3 className="w-12 h-12 text-gold dark:text-teal" />
            Analytics & Insights
          </h1>
          <p className="text-lg text-charcoal/70 dark:text-white/70 font-medium">
            Understand your writing patterns and progress over time
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8 flex gap-3">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                timeRange === range
                  ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg scale-105'
                  : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
              }`}
            >
              {range === 'week' && 'Past Week'}
              {range === 'month' && 'Past Month'}
              {range === 'year' && 'Past Year'}
              {range === 'all' && 'All Time'}
            </button>
          ))}
        </div>

        {stats.totalEntries === 0 ? (
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
            <div className="text-8xl mb-6">📊</div>
            <h3 className="font-serif text-3xl font-bold mb-3 text-charcoal dark:text-teal">
              No Data Yet
            </h3>
            <p className="text-lg text-charcoal/70 dark:text-white/70 mb-8">
              Start writing entries to see your analytics and insights
            </p>
            <Link
              href="/app/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Create Entry
            </Link>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Entries */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.totalEntries}</div>
                <div className="text-sm opacity-90">Total Entries</div>
                <div className="text-xs opacity-75 mt-2">{stats.totalDays} unique days</div>
              </div>

              {/* Total Words */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <BarChart3 className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.totalWords.toLocaleString()}</div>
                <div className="text-sm opacity-90">Total Words</div>
                <div className="text-xs opacity-75 mt-2">Avg. {stats.avgWordsPerEntry} per entry</div>
              </div>

              {/* Current Streak */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <Zap className="w-8 h-8 opacity-80" />
                  <Award className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.currentStreak}</div>
                <div className="text-sm opacity-90">Day Streak 🔥</div>
                <div className="text-xs opacity-75 mt-2">Best: {stats.longestStreak} days</div>
              </div>

              {/* This Week */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <Target className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.entriesThisWeek}</div>
                <div className="text-sm opacity-90">This Week</div>
                <div className="text-xs opacity-75 mt-2">{stats.wordsThisWeek.toLocaleString()} words</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* This Month */}
              <div className="bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20">
                <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold dark:text-teal" />
                  This Month
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Entries</span>
                    <span className="text-2xl font-bold text-charcoal dark:text-white">
                      {stats.entriesThisMonth}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Words</span>
                    <span className="text-2xl font-bold text-gold dark:text-teal">
                      {stats.wordsThisMonth.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Entry Lengths */}
              <div className="bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20">
                <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gold dark:text-teal" />
                  Entry Lengths
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Longest</span>
                    <span className="text-2xl font-bold text-charcoal dark:text-white">
                      {stats.longestEntry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Shortest</span>
                    <span className="text-2xl font-bold text-gold dark:text-teal">
                      {stats.shortestEntry}
                    </span>
                  </div>
                </div>
              </div>

              {/* Writing Habits */}
              <div className="bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20">
                <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold dark:text-teal" />
                  Writing Habits
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Most Active Day</span>
                    <div className="text-xl font-bold text-charcoal dark:text-white">
                      {stats.mostProductiveDay}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Favorite Hour</span>
                    <div className="text-xl font-bold text-gold dark:text-teal">
                      {stats.mostProductiveHour}:00
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Line Chart - Words per Day */}
            {dailyStats.length > 0 && (
              <div className="bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20 mb-8">
                <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-gold dark:text-teal" />
                  Writing Activity (Last 30 Days)
                </h3>
                
                <div className="h-64 flex items-end justify-between gap-2">
                  {dailyStats.map((day, index) => {
                    const maxWords = Math.max(...dailyStats.map(d => d.words), 1)
                    const height = (day.words / maxWords) * 100
                    const date = new Date(day.date)

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div
                          className="w-full bg-gradient-to-t from-gold to-gold/80 dark:from-teal dark:to-teal/80 rounded-t-lg transition-all duration-300 hover:from-gold/80 hover:to-gold dark:hover:from-teal/80 dark:hover:to-teal cursor-pointer relative"
                          style={{ height: `${height}%`, minHeight: day.words > 0 ? '4px' : '0' }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-charcoal dark:bg-white text-white dark:text-midnight px-3 py-2 rounded-lg shadow-xl text-xs font-bold whitespace-nowrap">
                              <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                              <div>{day.words} words</div>
                              <div>{day.entries} {day.entries === 1 ? 'entry' : 'entries'}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Date label (show every 5th) */}
                        {index % 5 === 0 && (
                          <div className="text-[8px] text-charcoal/50 dark:text-white/50 mt-2 rotate-45 origin-top-left">
                            {date.getDate()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Motivational Message */}
            <div className="bg-gradient-to-br from-gold/10 to-transparent dark:from-teal/10 dark:to-transparent rounded-xl p-8 border border-gold/20 dark:border-teal/20">
              <div className="flex items-start gap-4">
                <div className="text-5xl">🎉</div>
                <div>
                  <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
                    Keep up the great work!
                  </h3>
                  <p className="text-charcoal/70 dark:text-white/70 mb-3">
                    You've written <span className="font-bold text-gold dark:text-teal">{stats.totalWords.toLocaleString()}</span> words 
                    across <span className="font-bold text-gold dark:text-teal">{stats.totalEntries}</span> entries.
                    {stats.currentStreak > 0 && (
                      <> You're on a <span className="font-bold text-orange-500">({stats.currentStreak} day streak!</span></>
                    )}
                  </p>
                  {stats.currentStreak === 0 && (
                    <Link
                      href="/app/new"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      Start Your Streak Today
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
