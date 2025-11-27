'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Calendar, Award, BarChart3, Target, Zap, Activity, Sparkles } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'

type Statistics = {
  total_entries?: number
  current_streak?: number
  longest_streak?: number
  total_words?: number
  avg_words_per_entry?: number
  days_journaling?: number
  entries_this_month?: number
  entries_last_month?: number
  first_entry_date?: string
}

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Statistics>({})
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [dayData, setDayData] = useState<any[]>([])
  const [moodData, setMoodData] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchStatistics()
    }
  }, [user])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      // Get writing statistics
      const { data: statsData } = await supabase.rpc('get_writing_statistics', {
        user_id_param: user?.id
      })

      // Get monthly counts
      const { data: monthlyStats } = await supabase.rpc('get_monthly_entry_counts', {
        user_id_param: user?.id,
        months_back: 12
      })

      // Get day of week distribution
      const { data: dayStats } = await supabase.rpc('get_day_of_week_distribution', {
        user_id_param: user?.id
      })

      // Get mood distribution
      const { data: moodStats } = await supabase.rpc('get_mood_distribution', {
        user_id_param: user?.id
      })

      setStats(statsData || {})
      setMonthlyData(monthlyStats || [])
      setDayData(dayStats || [])
      setMoodData(moodStats || [])
    } catch (err) {
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <PageLoadingSkeleton />

  const statCards = [
    {
      title: 'Total Entries',
      value: stats.total_entries || 0,
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      gradient: 'from-blue-500/20 to-blue-600/20'
    },
    {
      title: 'Current Streak',
      value: `${stats.current_streak || 0} days`,
      icon: Zap,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      gradient: 'from-orange-500/20 to-orange-600/20'
    },
    {
      title: 'Longest Streak',
      value: `${stats.longest_streak || 0} days`,
      icon: Award,
      color: 'text-gold dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      gradient: 'from-yellow-500/20 to-yellow-600/20'
    },
    {
      title: 'Total Words',
      value: (stats.total_words || 0).toLocaleString(),
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      gradient: 'from-green-500/20 to-green-600/20'
    },
    {
      title: 'Avg Words/Entry',
      value: Math.round(stats.avg_words_per_entry || 0),
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      gradient: 'from-purple-500/20 to-purple-600/20'
    },
    {
      title: 'Days Journaling',
      value: stats.days_journaling || 0,
      icon: Calendar,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      gradient: 'from-pink-500/20 to-pink-600/20'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-7xl mx-auto gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Link
              href="/app"
              className="group flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 shrink-0"
            >
              <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-bold text-sm sm:text-lg hidden xs:inline">Back</span>
            </Link>
            <Activity className="w-6 h-6 text-gold dark:text-teal shrink-0" />
            <span className="font-bold text-lg text-charcoal dark:text-white hidden md:inline truncate">Statistics</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight flex items-center gap-3 sm:gap-4">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gold dark:text-teal" />
            Writing Statistics
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-charcoal/70 dark:text-white/70 font-medium">
            Track your journaling journey and celebrate your progress
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className={`bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-charcoal/10 dark:border-white/10 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-gold dark:hover:border-teal bg-gradient-to-br ${stat.gradient}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} backdrop-blur-sm`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <Sparkles className="w-4 h-4 text-gold dark:text-teal opacity-50" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-charcoal dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-medium text-charcoal/60 dark:text-white/60">
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* This Month vs Last Month */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-gold/20 dark:border-teal/20 bg-gradient-to-br from-gold/10 to-transparent dark:from-teal/10">
            <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold dark:text-teal" />
              This Month
            </h3>
            <div className="text-3xl sm:text-4xl font-black text-gold dark:text-teal mb-2">
              {stats.entries_this_month || 0}
            </div>
            <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
              entries written
            </div>
          </div>

          <div className="bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-charcoal/20 dark:border-white/20 bg-gradient-to-br from-charcoal/5 to-transparent dark:from-white/5">
            <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
              Last Month
            </h3>
            <div className="text-3xl sm:text-4xl font-black text-charcoal/70 dark:text-white/70 mb-2">
              {stats.entries_last_month || 0}
            </div>
            <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
              entries written
            </div>
            {stats.entries_this_month !== undefined && stats.entries_last_month !== undefined && (
              <div className="mt-3 pt-3 border-t border-charcoal/10 dark:border-white/10">
                {stats.entries_this_month > stats.entries_last_month ? (
                  <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stats.entries_this_month - stats.entries_last_month} more than last month
                  </span>
                ) : stats.entries_this_month < stats.entries_last_month ? (
                  <span className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                    ↓ {stats.entries_last_month - stats.entries_this_month} fewer than last month
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Same as last month
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Day of Week Distribution */}
        {dayData.length > 0 && (
          <div className="bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-charcoal/10 dark:border-white/10 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold dark:text-teal" />
              Writing by Day of Week
            </h3>
            <div className="space-y-3">
              {dayData
                .sort((a: any, b: any) => a.day_number - b.day_number)
                .map((day: any) => {
                  const maxCount = Math.max(...dayData.map((d: any) => Number(d.entry_count)))
                  const percentage = maxCount > 0 ? (Number(day.entry_count) / maxCount) * 100 : 0
                  return (
                    <div key={day.day_number} className="flex items-center gap-3 sm:gap-4">
                      <div className="w-20 sm:w-24 text-xs sm:text-sm font-bold text-charcoal dark:text-white">
                        {day.day_of_week.trim()}
                      </div>
                      <div className="flex-1 bg-charcoal/10 dark:bg-white/10 rounded-full h-8 sm:h-10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-orange-500 dark:from-teal dark:to-cyan-500 flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          {Number(day.entry_count) > 0 && (
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {day.entry_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Mood Distribution */}
        {moodData.length > 0 && (
          <div className="bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-charcoal/10 dark:border-white/10 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold dark:text-teal" />
              Mood Distribution
            </h3>
            <div className="space-y-3">
              {moodData.map((mood: any) => (
                <div key={mood.mood_value} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-24 sm:w-32 text-xs sm:text-sm font-bold text-charcoal dark:text-white capitalize truncate">
                    {mood.mood_value}
                  </div>
                  <div className="flex-1 bg-charcoal/10 dark:bg-white/10 rounded-full h-8 sm:h-10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${mood.percentage}%` }}
                    >
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {mood.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-12 sm:w-16 text-right text-xs sm:text-sm font-medium text-charcoal/60 dark:text-white/60">
                    {mood.entry_count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <div className="bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-charcoal/10 dark:border-white/10">
            <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold dark:text-teal" />
              Monthly Trend (Last 12 Months)
            </h3>
            <div className="space-y-2">
              {monthlyData.reverse().map((month: any) => {
                const maxCount = Math.max(...monthlyData.map((m: any) => Number(m.entry_count)))
                const percentage = maxCount > 0 ? (Number(month.entry_count) / maxCount) * 100 : 0
                return (
                  <div key={month.month} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-16 sm:w-20 text-xs sm:text-sm font-bold text-charcoal dark:text-white">
                      {month.month}
                    </div>
                    <div className="flex-1 bg-charcoal/10 dark:bg-white/10 rounded-full h-6 sm:h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-teal-500 dark:from-blue-400 dark:to-teal-400 flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      >
                        {Number(month.entry_count) > 0 && (
                          <span className="text-xs font-bold text-white">
                            {month.entry_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Journey Info */}
        {stats.first_entry_date && (
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-gold/20 to-orange-500/20 dark:from-teal/20 dark:to-cyan-500/20 rounded-2xl p-6 sm:p-8 border border-gold/30 dark:border-teal/30 shadow-xl">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-3">🎉</div>
              <div className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-2">
                You started journaling on{' '}
                {new Date(stats.first_entry_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs sm:text-sm text-charcoal/70 dark:text-white/70 font-medium">
                That&apos;s {stats.days_journaling} days of capturing your thoughts and memories!
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
