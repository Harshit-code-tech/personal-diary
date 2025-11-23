'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Smile, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { MoodBarChart, MoodTimeline, MoodPieChart } from '@/components/charts/MoodCharts'

type MoodEntry = {
  id: string
  title: string
  mood: string
  entry_date: string
  word_count: number
}

type MoodStats = {
  mood: string
  count: number
  percentage: number
  avgWordCount: number
  recentTrend: 'up' | 'down' | 'stable'
}

export default function MoodAnalysisPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [moodStats, setMoodStats] = useState<MoodStats[]>([])
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    if (user) {
      fetchMoodData()
    }
  }, [user, timeRange])

  const fetchMoodData = async () => {
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
        startDate = new Date('2000-01-01') // All time
      }

      let query = supabase
        .from('entries')
        .select('id, title, mood, entry_date, word_count')
        .eq('user_id', user?.id)
        .not('mood', 'is', null)
        .order('entry_date', { ascending: false })

      if (timeRange !== 'all') {
        query = query.gte('entry_date', startDate.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error

      setEntries(data || [])

      // Calculate mood statistics
      const moodCounts: Record<string, { count: number; wordCount: number; recent: number; older: number }> = {}
      const totalEntries = data?.length || 0
      const midpoint = Math.floor(totalEntries / 2)

      data?.forEach((entry, index) => {
        const mood = entry.mood
        if (!moodCounts[mood]) {
          moodCounts[mood] = { count: 0, wordCount: 0, recent: 0, older: 0 }
        }
        moodCounts[mood].count++
        moodCounts[mood].wordCount += entry.word_count || 0
        
        // Track recent vs older for trend
        if (index < midpoint) {
          moodCounts[mood].recent++
        } else {
          moodCounts[mood].older++
        }
      })

      const stats: MoodStats[] = Object.entries(moodCounts).map(([mood, stats]) => {
        const percentage = totalEntries > 0 ? (stats.count / totalEntries) * 100 : 0
        const avgWordCount = stats.count > 0 ? stats.wordCount / stats.count : 0
        
        // Determine trend
        let recentTrend: 'up' | 'down' | 'stable' = 'stable'
        if (stats.recent > stats.older * 1.2) {
          recentTrend = 'up'
        } else if (stats.recent < stats.older * 0.8) {
          recentTrend = 'down'
        }

        return {
          mood,
          count: stats.count,
          percentage,
          avgWordCount: Math.round(avgWordCount),
          recentTrend,
        }
      })

      // Sort by count
      stats.sort((a, b) => b.count - a.count)
      setMoodStats(stats)
    } catch (err) {
      console.error('Error fetching mood data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = selectedMood
    ? entries.filter(e => e.mood === selectedMood)
    : entries

  if (authLoading || loading) {
    return <LoadingSkeleton.Page />
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-3 leading-tight flex items-center gap-4">
            <Smile className="w-12 h-12 text-gold dark:text-teal" />
            Mood Analysis
          </h1>
          <p className="text-lg text-charcoal/70 dark:text-white/70 font-medium">
            Track and understand your emotional patterns over time
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

        {moodStats.length === 0 ? (
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
            <div className="text-8xl mb-6">😊</div>
            <h3 className="font-serif text-3xl font-bold mb-3 text-charcoal dark:text-teal">
              No Mood Data Yet
            </h3>
            <p className="text-lg text-charcoal/70 dark:text-white/70 mb-8">
              Start adding moods to your entries to see insights here
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
            {/* Visualization Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MoodBarChart data={moodStats} />
              <MoodPieChart data={moodStats} />
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <MoodTimeline entries={entries} />
            </div>

            {/* Mood Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {moodStats.map((stat) => {
                const maxPercentage = Math.max(...moodStats.map(s => s.percentage))
                const isTop = stat.percentage === maxPercentage

                return (
                  <button
                    key={stat.mood}
                    onClick={() => setSelectedMood(selectedMood === stat.mood ? null : stat.mood)}
                    className={`group relative bg-white dark:bg-graphite rounded-xl shadow-lg hover:shadow-2xl p-6 border transition-all duration-300 hover:scale-105 text-left ${
                      selectedMood === stat.mood
                        ? 'border-gold dark:border-teal ring-4 ring-gold/20 dark:ring-teal/20'
                        : isTop
                        ? 'border-gold/30 dark:border-teal/30'
                        : 'border-charcoal/10 dark:border-white/10'
                    }`}
                  >
                    {isTop && (
                      <div className="absolute -top-2 -right-2 bg-gold dark:bg-teal text-white dark:text-midnight text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Top Mood
                      </div>
                    )}

                    {/* Mood Icon */}
                    <div className="text-5xl mb-4">{stat.mood.split(' ')[0]}</div>

                    {/* Mood Name */}
                    <h3 className="text-xl font-bold text-charcoal dark:text-white mb-2">
                      {stat.mood.split(' ').slice(1).join(' ')}
                    </h3>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-charcoal/60 dark:text-white/60">Count</span>
                        <span className="text-lg font-bold text-charcoal dark:text-white">
                          {stat.count}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-charcoal/60 dark:text-white/60">Percentage</span>
                        <span className="text-lg font-bold text-gold dark:text-teal">
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-charcoal/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 transition-all duration-500"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-charcoal/50 dark:text-white/50">
                          Avg. {stat.avgWordCount} words
                        </span>
                        <div className="flex items-center gap-1">
                          <TrendingUp 
                            className={`w-4 h-4 ${
                              stat.recentTrend === 'up' 
                                ? 'text-green-500 dark:text-green-400' 
                                : stat.recentTrend === 'down'
                                ? 'text-red-500 dark:text-red-400 rotate-180'
                                : 'text-charcoal/30 dark:text-white/30 rotate-0'
                            }`}
                          />
                          <span className="text-xs text-charcoal/50 dark:text-white/50">
                            {stat.recentTrend === 'up' ? 'Trending up' : stat.recentTrend === 'down' ? 'Trending down' : 'Stable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Entry List */}
            {selectedMood && (
              <div className="bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-charcoal dark:text-white flex items-center gap-3">
                    <span className="text-4xl">{selectedMood.split(' ')[0]}</span>
                    {selectedMood.split(' ').slice(1).join(' ')} Entries
                  </h2>
                  <button
                    onClick={() => setSelectedMood(null)}
                    className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>

                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/app/entry/${entry.id}`}
                      className="group block p-5 bg-charcoal/5 dark:bg-white/5 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10 hover:border-gold/30 dark:hover:border-teal/30 transition-all duration-200 hover:scale-102 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors">
                          {entry.title}
                        </h3>
                        <span className="text-sm text-charcoal/60 dark:text-white/60">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.entry_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span>{entry.word_count} words</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {filteredEntries.length === 0 && (
                  <p className="text-center text-charcoal/50 dark:text-white/50 py-8">
                    No entries found for this mood
                  </p>
                )}
              </div>
            )}

            {/* Overall Summary */}
            <div className="mt-8 bg-gradient-to-br from-gold/10 to-transparent dark:from-teal/10 dark:to-transparent rounded-xl p-8 border border-gold/20 dark:border-teal/20">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4 flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-gold dark:text-teal" />
                Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {entries.length}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60">
                    Total Entries with Mood
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {moodStats.length}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60">
                    Different Moods Tracked
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {moodStats[0]?.mood.split(' ')[0] || '😊'}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60">
                    Most Common Mood
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
