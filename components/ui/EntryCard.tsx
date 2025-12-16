// Memoized Entry Card Component
// Prevents unnecessary re-renders when entry data hasn't changed

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Users, BookMarked, Star, Calendar } from 'lucide-react'
import { stripHtmlTags } from '@/lib/sanitize'
import type { Entry } from '@/lib/types'

interface EntryCardProps {
  entry: Entry & {
    folders?: { name: string; icon: string } | null
  }
  onToggleBookmark?: (id: string) => void
}

const EntryCard = React.memo(({ entry, onToggleBookmark }: EntryCardProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get mood emoji
  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null
    return mood.split(' ')[0] // Extract emoji from "😊 Happy" format
  }

  // Strip HTML and truncate
  const getPreview = (html: string, maxLength = 150) => {
    const text = stripHtmlTags(html)
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }

  return (
    <div className="bg-white dark:bg-charcoal/50 rounded-lg border border-charcoal/10 dark:border-white/10 hover:border-gold dark:hover:border-teal transition-all hover:shadow-lg group">
      <Link href={`/app/entry/${entry.id}`} className="block p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors line-clamp-2">
              {entry.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-sm text-charcoal/60 dark:text-white/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(entry.entry_date)}
              </span>
              {entry.word_count > 0 && (
                <span>{entry.word_count} words</span>
              )}
              {entry.mood && (
                <span className="text-base">{getMoodEmoji(entry.mood)}</span>
              )}
            </div>
          </div>

          {/* Bookmark button */}
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleBookmark(entry.id)
              }}
              className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors"
              aria-label={entry.is_bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Star 
                className={`w-5 h-5 ${
                  entry.is_bookmarked 
                    ? 'fill-amber-500 text-amber-500' 
                    : 'text-charcoal/40 dark:text-white/40'
                }`} 
              />
            </button>
          )}
        </div>

        {/* Content preview */}
        <p className="text-charcoal/70 dark:text-white/70 text-sm line-clamp-3 mb-4">
          {getPreview(entry.content)}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Folder */}
          {entry.folders && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 dark:bg-teal/10 text-charcoal dark:text-teal rounded-full text-xs">
              <span>{entry.folders.icon}</span>
              <span>{entry.folders.name}</span>
            </span>
          )}

          {/* People */}
          {entry.entry_people && entry.entry_people.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs">
              <Users className="w-3 h-3" />
              <span>{entry.entry_people.length}</span>
            </span>
          )}

          {/* Stories */}
          {entry.story_entries && entry.story_entries.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-xs">
              <BookMarked className="w-3 h-3" />
              <span>{entry.story_entries.length}</span>
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if entry id, bookmark status, or title changes
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.is_bookmarked === nextProps.entry.is_bookmarked &&
    prevProps.entry.title === nextProps.entry.title &&
    prevProps.entry.updated_at === nextProps.entry.updated_at
  )
})

EntryCard.displayName = 'EntryCard'

export default EntryCard
