'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Clock, Star, Calendar, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { stripHtmlTags } from '@/lib/sanitize'
import AppHeader from '@/components/layout/AppHeader'

interface Entry {
  id: string
  title: string
  content: string
  entry_date: string
  mood: string | null
  word_count: number
  created_at: string
}

interface MemoryEntry extends Entry {
  yearsAgo: number
}

export default function MemoriesPage() {
  const [onThisDayEntries, setOnThisDayEntries] = useState<MemoryEntry[]>([])
  const [randomMemory, setRandomMemory] = useState<Entry | null>(null)
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalWords: 0,
    journalingDays: 0,
    longestEntry: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true)

      // Get today's date parts
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentDay = today.getDate()
      const currentYear = today.getFullYear()

      // Fetch "On This Day" entries (same month/day, different years)
      const { data: onThisDayData, error: onThisDayError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user?.id)
        .filter('entry_date', 'not.is', null)
        .order('entry_date', { ascending: false })

      if (onThisDayError) throw onThisDayError

      // Filter entries from the same day in previous years
      const onThisDayFiltered = (onThisDayData || [])
        .filter(entry => {
          const entryDate = new Date(entry.entry_date)
          return (
            entryDate.getMonth() + 1 === currentMonth &&
            entryDate.getDate() === currentDay &&
            entryDate.getFullYear() < currentYear
          )
        })
        .map(entry => {
          const entryYear = new Date(entry.entry_date).getFullYear()
          return {
            ...entry,
            yearsAgo: currentYear - entryYear,
          }
        })
        .slice(0, 5) // Limit to 5 entries

      setOnThisDayEntries(onThisDayFiltered)

      // Fetch random memory (entry from at least 30 days ago)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: randomData, error: randomError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user?.id)
        .lt('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(50)

      if (randomError) throw randomError

      // Pick a random entry from the last 50 old entries
      if (randomData && randomData.length > 0) {
        const randomIndex = Math.floor(Math.random() * randomData.length)
        setRandomMemory(randomData[randomIndex])
      }

      // Fetch statistics
      const { data: allEntries, error: statsError } = await supabase
        .from('entries')
        .select('word_count, created_at, entry_date')
        .eq('user_id', user?.id)

      if (statsError) throw statsError

      if (allEntries && allEntries.length > 0) {
        const totalWords = allEntries.reduce((sum, entry) => sum + (entry.word_count || 0), 0)
        const longestEntry = Math.max(...allEntries.map(e => e.word_count || 0))
        const firstEntry = new Date(allEntries[allEntries.length - 1].created_at)
        const daysSinceFirst = Math.floor((today.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24))

        setStats({
          totalEntries: allEntries.length,
          totalWords,
          journalingDays: daysSinceFirst,
          longestEntry,
        })
      }
    } catch (err) {
      console.error('Error fetching memories:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (user) {
      fetchMemories()
    }
  }, [user, fetchMemories])

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return '😊'
    return mood.split(' ')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center text-charcoal/60 dark:text-white/60">
            Loading your memories...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-gold to-gold/80 dark:from-teal dark:to-teal/80 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold text-charcoal dark:text-white">
              Memories
            </h1>
          </div>
          <p className="text-base sm:text-lg text-charcoal/70 dark:text-white/70 ml-0 sm:ml-16">
            Rediscover your past moments and celebrate your journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <div className="p-4 sm:p-6 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10">
            <div className="text-2xl sm:text-3xl font-bold text-gold dark:text-teal mb-1">
              {stats.totalEntries}
            </div>
            <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">Total Entries</div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10">
            <div className="text-2xl sm:text-3xl font-bold text-gold dark:text-teal mb-1">
              {stats.totalWords.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">Words Written</div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10">
            <div className="text-2xl sm:text-3xl font-bold text-gold dark:text-teal mb-1">
              {stats.journalingDays}
            </div>
            <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">Days Journaling</div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10">
            <div className="text-2xl sm:text-3xl font-bold text-gold dark:text-teal mb-1">
              {stats.longestEntry}
            </div>
            <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">Longest Entry</div>
          </div>
        </div>

        {/* On This Day */}
        {onThisDayEntries.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gold dark:text-teal" />
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white">
                On This Day
              </h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {onThisDayEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/app/entry/${entry.id}`}
                  className="block p-4 sm:p-6 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10 hover:border-gold dark:hover:border-teal transition-all hover:shadow-lg group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-2xl sm:text-3xl">{getMoodEmoji(entry.mood)}</div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors">
                          {entry.title || 'Untitled Entry'}
                        </h3>
                        <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">
                          {entry.yearsAgo} {entry.yearsAgo === 1 ? 'year' : 'years'} ago • {new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-charcoal/50 dark:text-white/50">
                      {entry.word_count} words
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-charcoal/70 dark:text-white/70 line-clamp-2">
                    {stripHtmlTags(entry.content).substring(0, 150)}...
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gold dark:text-teal font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Read memory <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Random Memory */}
        {randomMemory && (
          <section className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gold dark:text-teal" />
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white">
                Random Memory Today
              </h2>
            </div>
            <Link
              href={`/app/entry/${randomMemory.id}`}
              className="block p-6 sm:p-8 bg-gradient-to-br from-gold/10 to-transparent dark:from-teal/10 dark:to-transparent rounded-xl border-2 border-gold/20 dark:border-teal/20 hover:border-gold dark:hover:border-teal transition-all hover:shadow-xl group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl sm:text-4xl">{getMoodEmoji(randomMemory.mood)}</div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors mb-1">
                      {randomMemory.title || 'Untitled Entry'}
                    </h3>
                    <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">
                      {new Date(randomMemory.entry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-charcoal/50 dark:text-white/50">
                  {randomMemory.word_count} words
                </div>
              </div>
              <p className="text-sm sm:text-base text-charcoal/70 dark:text-white/70 line-clamp-3 mb-4">
                {stripHtmlTags(randomMemory.content).substring(0, 250)}...
              </p>
              <div className="flex items-center gap-2 text-sm sm:text-base text-gold dark:text-teal font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Relive this moment <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </section>
        )}

        {/* Empty State */}
        {onThisDayEntries.length === 0 && !randomMemory && (
          <div className="text-center py-12 sm:py-20">
            <div className="mb-6">
              <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-charcoal/20 dark:text-white/20" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white mb-3">
              No Memories Yet
            </h3>
            <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 mb-6">
              Keep writing to build your collection of memories!
            </p>
            <Link
              href="/app/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              Write an Entry
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
