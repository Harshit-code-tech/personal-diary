'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowLeft, Calendar } from 'lucide-react'
import { stripHtmlTags } from '@/lib/sanitize'
import AppHeader from '@/components/layout/AppHeader'

interface BookmarkedEntry {
  id: string
  title: string
  content: string
  entry_date: string
  bookmarked_at: string
  mood: string | null
  word_count: number
}

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [entries, setEntries] = useState<BookmarkedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchBookmarkedEntries()
    }
  }, [user])

  const fetchBookmarkedEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('id, title, content, entry_date, bookmarked_at, mood, word_count')
        .eq('user_id', user?.id)
        .eq('is_bookmarked', true)
        .order('bookmarked_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching bookmarked entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnbookmark = async (entryId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const { error } = await supabase
        .from('entries')
        .update({ 
          is_bookmarked: false,
          bookmarked_at: null 
        })
        .eq('id', entryId)

      if (error) throw error

      setEntries(prev => prev.filter(entry => entry.id !== entryId))
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading bookmarks...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight transition-colors duration-500">
      <AppHeader />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm text-charcoal/60 dark:text-white/60 hover:text-gold dark:hover:text-teal transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Diary
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gold/10 dark:bg-teal/10 rounded-xl">
              <Star className="w-8 h-8 text-gold dark:text-teal" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-black text-charcoal dark:text-teal">
                Bookmarked Entries
              </h1>
              <p className="text-charcoal/70 dark:text-white/70 mt-2">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} saved for quick access
              </p>
            </div>
          </div>
        </div>

        {/* Bookmarked Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-graphite rounded-2xl border-2 border-charcoal/10 dark:border-white/10">
            <Star className="w-16 h-16 mx-auto text-charcoal/20 dark:text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-2">
              No bookmarked entries yet
            </h3>
            <p className="text-charcoal/60 dark:text-white/60 mb-6">
              Star your favorite entries to see them here
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Entries
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/app/entry/${entry.id}`}
                className="group relative bg-white dark:bg-graphite rounded-xl p-6 border-2 border-charcoal/10 dark:border-white/10 hover:border-gold dark:hover:border-teal hover:shadow-lg transition-all"
              >
                {/* Bookmark Badge */}
                <button
                  onClick={(e) => handleUnbookmark(entry.id, e)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gold/10 dark:bg-teal/10 hover:bg-gold/20 dark:hover:bg-teal/20 transition-colors"
                  aria-label="Remove bookmark"
                >
                  <Star className="w-5 h-5 text-gold dark:text-teal" fill="currentColor" />
                </button>

                <div className="pr-12">
                  <h3 className="text-xl font-bold text-charcoal dark:text-white mb-2 group-hover:text-gold dark:group-hover:text-teal transition-colors">
                    {entry.title || 'Untitled Entry'}
                  </h3>

                  {entry.content && (
                    <p className="text-charcoal/70 dark:text-white/70 mb-4 line-clamp-2">
                      {stripHtmlTags(entry.content).substring(0, 200)}
                      {entry.content.length > 200 && '...'}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal/60 dark:text-white/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.entry_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    {entry.mood && (
                      <span className="px-3 py-1 bg-gold/10 dark:bg-teal/10 rounded-full capitalize">
                        {entry.mood}
                      </span>
                    )}

                    <span>
                      {entry.word_count} words
                    </span>

                    <span className="text-xs text-charcoal/40 dark:text-white/40">
                      Bookmarked {new Date(entry.bookmarked_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
