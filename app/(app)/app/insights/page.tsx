'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import {
  TrendingUp,
  Calendar,
  FileText,
  Heart,
  Users,
  BookMarked,
  Target,
  Zap,
  ArrowLeft,
  Award,
  Clock,
  BarChart3
} from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

interface AnalyticsData {
  totalEntries: number
  totalWords: number
  avgWordsPerEntry: number
  longestEntry: { id: string; title: string; word_count: number } | null
  currentStreak: number
  longestStreak: number
  moodDistribution: { mood: string; count: number }[]
  writingByMonth: { month: string; entries: number; words: number }[]
  writingByDayOfWeek: { day: string; count: number }[]
  topTags: { tag: string; count: number }[]
  peopleCount: number
  storiesCount: number
  goalsCount: number
  mostProductiveHour: number
  firstEntryDate: string | null
  daysSinceFirstEntry: number
}

export default function InsightsPage() {
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'all' | '30' | '90' | '365'>('all')

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let dateFilter = null

      if (timeRange !== 'all') {
        const daysAgo = new Date()
        daysAgo.setDate(now.getDate() - parseInt(timeRange))
        dateFilter = daysAgo.toISOString().split('T')[0]
      }

      // Fetch entries
      let query = supabase
        .from('entries')
        .select('id, title, content, entry_date, word_count, mood, created_at, tags')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false })

      if (dateFilter) {
        query = query.gte('entry_date', dateFilter)
      }

      const { data: entries, error } = await query

      if (error) throw error

      // Calculate statistics
      const totalEntries = entries?.length || 0
      const totalWords = entries?.reduce((sum, e) => sum + (e.word_count || 0), 0) || 0
      const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0

      // Longest entry
      const longestEntry =
        entries && entries.length > 0
          ? entries.reduce((max, e) => (e.word_count > (max?.word_count || 0) ? e : max))
          : null

      // Mood distribution
      const moodCounts = entries?.reduce((acc: any, e) => {
        if (e.mood) {
          acc[e.mood] = (acc[e.mood] || 0) + 1
        }
        return acc
      }, {})
      const moodDistribution = Object.entries(moodCounts || {})
        .map(([mood, count]) => ({ mood, count: count as number }))
        .sort((a, b) => b.count - a.count)

      // Writing by month (last 12 months)
      const writingByMonth = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM

        const monthEntries = entries?.filter((e) => e.entry_date.startsWith(monthKey)) || []
        writingByMonth.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          entries: monthEntries.length,
          words: monthEntries.reduce((sum, e) => sum + (e.word_count || 0), 0)
        })
      }

      // Writing by day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayCounts = entries?.reduce((acc: any, e) => {
        const day = new Date(e.entry_date).getDay()
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {})
      const writingByDayOfWeek = dayNames.map((day, i) => ({
        day: day.slice(0, 3),
        count: dayCounts?.[i] || 0
      }))

      // Top tags
      const allTags = entries?.flatMap((e) => e.tags || []) || []
      const tagCounts = allTags.reduce((acc: any, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {})
      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Streaks
      const dates = entries?.map((e) => new Date(e.entry_date)) || []
      dates.sort((a, b) => b.getTime() - a.getTime())

      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      let prevDate: Date | null = null

      for (const date of dates) {
        if (prevDate) {
          const diffDays = Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays === 1) {
            tempStreak++
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        } else {
          tempStreak = 1
        }
        prevDate = date
      }
      longestStreak = Math.max(longestStreak, tempStreak)

      // Current streak (from today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let checkDate = new Date(today)
      currentStreak = 0

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]
        const hasEntry = entries?.some((e) => e.entry_date === dateStr)
        if (hasEntry) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }

      // Fetch counts from other tables
      const [peopleRes, storiesRes, goalsRes] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('stories').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user!.id)
      ])

      const peopleCount = peopleRes.count || 0
      const storiesCount = storiesRes.count || 0
      const goalsCount = goalsRes.count || 0

      // Most productive hour
      const hours = entries?.reduce((acc: any, e) => {
        const hour = new Date(e.created_at).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {})
      const mostProductiveHour = Object.entries(hours || {}).reduce(
        (max: any, [hour, count]: any) => (count > max.count ? { hour: parseInt(hour), count } : max),
        { hour: 0, count: 0 }
      ).hour

      // First entry date
      const firstEntryDate = entries && entries.length > 0 ? entries[entries.length - 1].entry_date : null
      const daysSinceFirstEntry = firstEntryDate
        ? Math.floor((now.getTime() - new Date(firstEntryDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setAnalytics({
        totalEntries,
        totalWords,
        avgWordsPerEntry,
        longestEntry,
        currentStreak,
        longestStreak,
        moodDistribution,
        writingByMonth,
        writingByDayOfWeek,
        topTags,
        peopleCount,
        storiesCount,
        goalsCount,
        mostProductiveHour,
        firstEntryDate,
        daysSinceFirstEntry
      })
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <PageLoadingSkeleton />
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-charcoal">
        <p className="text-charcoal dark:text-white">No data available</p>
      </div>
    )
  }

  const maxMoodCount = Math.max(...analytics.moodDistribution.map((m) => m.count), 1)
  const maxMonthEntries = Math.max(...analytics.writingByMonth.map((m) => m.entries), 1)
  const maxDayCount = Math.max(...analytics.writingByDayOfWeek.map((d) => d.count), 1)

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal pb-16">{/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/80 dark:bg-charcoal/80 border-b border-charcoal/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Link
                href="/app"
                className="p-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <TrendingUp className="w-6 h-6 text-gold dark:text-teal shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white truncate">Your Writing Insights</h1>
                <p className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 hidden xs:block">
                  Discover patterns and celebrate your journey
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <ThemeSwitcher />
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { value: 'all', label: 'All Time' },
              { value: '30', label: 'Last 30 Days' },
              { value: '90', label: 'Last 90 Days' },
              { value: '365', label: 'This Year' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value as any)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  timeRange === range.value
                    ? 'bg-gold dark:bg-teal text-white'
                    : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            title="Total Entries"
            value={analytics.totalEntries.toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Total Words"
            value={analytics.totalWords.toLocaleString()}
            color="green"
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            title="Current Streak"
            value={`${analytics.currentStreak} days`}
            color="gold"
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            title="Longest Streak"
            value={`${analytics.longestStreak} days`}
            color="purple"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            title="Avg Words/Entry"
            value={analytics.avgWordsPerEntry.toLocaleString()}
            color="teal"
            size="sm"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            title="People"
            value={analytics.peopleCount.toLocaleString()}
            color="pink"
            size="sm"
          />
          <StatCard
            icon={<BookMarked className="w-5 h-5" />}
            title="Stories"
            value={analytics.storiesCount.toLocaleString()}
            color="indigo"
            size="sm"
          />
        </div>

        {/* Journey Info */}
        {analytics.firstEntryDate && (
          <div className="bg-gradient-to-r from-gold/10 to-teal/10 dark:from-gold/5 dark:to-teal/5 p-6 rounded-xl mb-8 border border-gold/20 dark:border-teal/20">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-gold dark:text-teal" />
              <h3 className="font-semibold text-charcoal dark:text-white">Your Writing Journey</h3>
            </div>
            <p className="text-charcoal/80 dark:text-white/80">
              You started writing on{' '}
              <span className="font-semibold">
                {new Date(analytics.firstEntryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {" - that's "}
              <span className="font-semibold">{analytics.daysSinceFirstEntry} days</span> of documenting your
              life! 🎉
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mood Distribution */}
          <div className="bg-white dark:bg-graphite p-6 rounded-xl border border-charcoal/10 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-bold text-charcoal dark:text-white">Mood Distribution</h3>
            </div>
            <div className="space-y-3">
              {analytics.moodDistribution.slice(0, 5).map((mood) => (
                <div key={mood.mood}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-charcoal dark:text-white">{mood.mood}</span>
                    <span className="text-charcoal/60 dark:text-white/60">{mood.count} entries</span>
                  </div>
                  <div className="h-2 bg-charcoal/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-teal rounded-full"
                      style={{ width: `${(mood.count / maxMoodCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {analytics.moodDistribution.length === 0 && (
                <p className="text-center text-charcoal/60 dark:text-white/60 py-4">
                  No mood data yet. Start adding moods to your entries!
                </p>
              )}
            </div>
          </div>

          {/* Writing by Day of Week */}
          <div className="bg-white dark:bg-graphite p-6 rounded-xl border border-charcoal/10 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-charcoal dark:text-white">Writing by Day</h3>
            </div>
            <div className="flex justify-between items-end h-40">
              {analytics.writingByDayOfWeek.map((day) => (
                <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                    <div
                      className="w-8 bg-gradient-to-t from-gold to-teal rounded-t-lg"
                      style={{ height: `${(day.count / maxDayCount) * 100}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-xs text-charcoal/60 dark:text-white/60">{day.day}</span>
                  <span className="text-xs font-semibold text-charcoal dark:text-white">{day.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Writing Trend (Last 12 Months) */}
        <div className="bg-white dark:bg-graphite p-6 rounded-xl border border-charcoal/10 dark:border-white/10 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-charcoal dark:text-white">Writing Trend (Last 12 Months)</h3>
          </div>
          <div className="flex justify-between items-end h-48 gap-1">
            {analytics.writingByMonth.map((month) => (
              <div key={month.month} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full max-w-8 bg-gradient-to-t from-gold to-teal rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${(month.entries / maxMonthEntries) * 100}%`, minHeight: '4px' }}
                    title={`${month.month}: ${month.entries} entries, ${month.words.toLocaleString()} words`}
                  />
                </div>
                <span className="text-xs text-charcoal/60 dark:text-white/60 truncate w-full text-center">
                  {month.month.split(' ')[0]}
                </span>
                <span className="text-xs font-semibold text-charcoal dark:text-white">{month.entries}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tags */}
        {analytics.topTags.length > 0 && (
          <div className="bg-white dark:bg-graphite p-6 rounded-xl border border-charcoal/10 dark:border-white/10 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-charcoal dark:text-white">Most Used Tags</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {analytics.topTags.map((tag) => (
                <span
                  key={tag.tag}
                  className="px-3 py-2 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal border border-gold/20 dark:border-teal/20 rounded-lg text-sm font-medium"
                >
                  #{tag.tag}{' '}
                  <span className="text-charcoal/60 dark:text-white/60">({tag.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Most Productive Time */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-charcoal dark:text-white">Most Productive Hour</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.mostProductiveHour === 0
                ? '12 AM'
                : analytics.mostProductiveHour < 12
                ? `${analytics.mostProductiveHour} AM`
                : analytics.mostProductiveHour === 12
                ? '12 PM'
                : `${analytics.mostProductiveHour - 12} PM`}
            </p>
            <p className="text-sm text-charcoal/60 dark:text-white/60 mt-1">
              You write most at this time
            </p>
          </div>

          {/* Longest Entry */}
          {analytics.longestEntry && (
            <Link
              href={`/app/entry/${analytics.longestEntry.id}`}
              className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-700 hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-charcoal dark:text-white">Longest Entry</h3>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                {analytics.longestEntry.word_count.toLocaleString()} words
              </p>
              <p className="text-sm text-charcoal/80 dark:text-white/80 truncate">
                "{analytics.longestEntry.title}"
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  color: string
  size?: 'sm' | 'md'
}

function StatCard({ icon, title, value, color, size = 'md' }: StatCardProps) {
  const colors: any = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    gold: 'from-gold to-amber-500',
    purple: 'from-purple-500 to-purple-600',
    teal: 'from-teal to-cyan-500',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  return (
    <div className="bg-white dark:bg-graphite p-6 rounded-xl border border-charcoal/10 dark:border-white/10">
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colors[color]} text-white mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-charcoal/60 dark:text-white/60 mb-1">{title}</p>
      <p className={`font-bold text-charcoal dark:text-white ${size === 'sm' ? 'text-2xl' : 'text-3xl'}`}>
        {value}
      </p>
    </div>
  )
}
