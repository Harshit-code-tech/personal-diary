import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Calendar, Award, BarChart3, Target, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStatistics(userId: string) {
  const supabase = await createClient()

  // Get writing statistics
  const { data: stats } = await supabase.rpc('get_writing_statistics', {
    user_id_param: userId
  })

  // Get monthly counts
  const { data: monthlyData } = await supabase.rpc('get_monthly_entry_counts', {
    user_id_param: userId,
    months_back: 12
  })

  // Get day of week distribution
  const { data: dayData } = await supabase.rpc('get_day_of_week_distribution', {
    user_id_param: userId
  })

  // Get mood distribution
  const { data: moodData } = await supabase.rpc('get_mood_distribution', {
    user_id_param: userId
  })

  return {
    stats: stats || {},
    monthlyData: monthlyData || [],
    dayData: dayData || [],
    moodData: moodData || []
  }
}

export default async function StatisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { stats, monthlyData, dayData, moodData } = await getStatistics(user.id)

  const statCards = [
    {
      title: 'Total Entries',
      value: stats.total_entries || 0,
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Current Streak',
      value: `${stats.current_streak || 0} days`,
      icon: Zap,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Longest Streak',
      value: `${stats.longest_streak || 0} days`,
      icon: Award,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: 'Total Words',
      value: (stats.total_words || 0).toLocaleString(),
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Avg Words/Entry',
      value: Math.round(stats.avg_words_per_entry || 0),
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Days Journaling',
      value: stats.days_journaling || 0,
      icon: Calendar,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-midnight dark:via-midnight-light dark:to-midnight">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📊 Writing Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your journaling journey and celebrate your progress
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* This Month vs Last Month */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📅 This Month
            </h3>
            <div className="text-4xl font-bold text-primary mb-2">
              {stats.entries_this_month || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              entries written
            </div>
          </div>

          <div className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📆 Last Month
            </h3>
            <div className="text-4xl font-bold text-gray-500 dark:text-gray-400 mb-2">
              {stats.entries_last_month || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              entries written
            </div>
            {stats.entries_this_month !== undefined && stats.entries_last_month !== undefined && (
              <div className="mt-2">
                {stats.entries_this_month > stats.entries_last_month ? (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ↑ {stats.entries_this_month - stats.entries_last_month} more than last month
                  </span>
                ) : stats.entries_this_month < stats.entries_last_month ? (
                  <span className="text-sm text-red-600 dark:text-red-400">
                    ↓ {stats.entries_last_month - stats.entries_this_month} fewer than last month
                  </span>
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Same as last month
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Most Active Day */}
        {stats.most_active_day && (
          <div className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🗓️ Most Active Day
            </h3>
            <div className="text-2xl font-bold text-primary">
              {stats.most_active_day}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You write most often on {stats.most_active_day}s
            </div>
          </div>
        )}

        {/* Day of Week Distribution */}
        {dayData.length > 0 && (
          <div className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              📊 Writing by Day of Week
            </h3>
            <div className="space-y-3">
              {dayData
                .sort((a: any, b: any) => a.day_number - b.day_number)
                .map((day: any) => {
                  const maxCount = Math.max(...dayData.map((d: any) => Number(d.entry_count)))
                  const percentage = maxCount > 0 ? (Number(day.entry_count) / maxCount) * 100 : 0
                  return (
                    <div key={day.day_number} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {day.day_of_week.trim()}
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-primary flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          {Number(day.entry_count) > 0 && (
                            <span className="text-sm font-semibold text-white">
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
          <div className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              😊 Mood Distribution
            </h3>
            <div className="space-y-3">
              {moodData.map((mood: any) => (
                <div key={mood.mood} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {mood.mood}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${mood.percentage}%` }}
                    >
                      <span className="text-sm font-semibold text-white">
                        {mood.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-600 dark:text-gray-400">
                    {mood.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <div className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              📈 Monthly Trend (Last 12 Months)
            </h3>
            <div className="space-y-2">
              {monthlyData.reverse().map((month: any) => {
                const maxCount = Math.max(...monthlyData.map((m: any) => Number(m.entry_count)))
                const percentage = maxCount > 0 ? (Number(month.entry_count) / maxCount) * 100 : 0
                return (
                  <div key={month.month} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {month.month}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-primary flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      >
                        {Number(month.entry_count) > 0 && (
                          <span className="text-xs font-semibold text-white">
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
          <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-xl p-6 border border-primary/20">
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                You started journaling on{' '}
                {new Date(stats.first_entry_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                That's {stats.days_journaling} days of capturing your thoughts and memories!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
