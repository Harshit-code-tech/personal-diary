'use client'

import Link from 'next/link'
import { FileText, Search, Calendar, Heart, Sparkles } from 'lucide-react'

interface EmptyStateProps {
  type: 'entries' | 'search' | 'folder' | 'people' | 'stories' | 'tags' | 'calendar'
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

const illustrations = {
  entries: {
    icon: FileText,
    defaultTitle: 'No entries yet',
    defaultDescription: 'Start your journaling journey by creating your first entry',
    defaultActionLabel: 'Create First Entry',
    defaultActionHref: '/app/new',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-gold/5 dark:from-teal/20 dark:to-teal/5 rounded-full animate-pulse" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <FileText className="w-16 h-16 text-gold dark:text-teal" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold dark:bg-teal rounded-full flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-white dark:text-midnight" />
        </div>
      </div>
    ),
  },
  search: {
    icon: Search,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search query or filters',
    defaultActionLabel: '',
    defaultActionHref: '',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 to-blue-100/20 dark:from-blue-900/30 dark:to-blue-800/10 rounded-full" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <Search className="w-16 h-16 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
        </div>
      </div>
    ),
  },
  folder: {
    icon: FileText,
    defaultTitle: 'Empty folder',
    defaultDescription: 'Add entries to this folder to see them here',
    defaultActionLabel: 'Create Entry',
    defaultActionHref: '/app/new',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 to-amber-100/20 dark:from-amber-900/30 dark:to-amber-800/10 rounded-full" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <div className="text-6xl">📁</div>
        </div>
      </div>
    ),
  },
  people: {
    icon: Heart,
    defaultTitle: 'No people yet',
    defaultDescription: 'Add people to link them to your journal entries',
    defaultActionLabel: 'Add Person',
    defaultActionHref: '/app/people/new',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/50 to-pink-100/20 dark:from-pink-900/30 dark:to-pink-800/10 rounded-full" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <div className="text-6xl">👥</div>
        </div>
      </div>
    ),
  },
  stories: {
    icon: FileText,
    defaultTitle: 'No stories yet',
    defaultDescription: 'Create stories to track ongoing narratives in your life',
    defaultActionLabel: 'Create Story',
    defaultActionHref: '/app/stories/new',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/50 to-purple-100/20 dark:from-purple-900/30 dark:to-purple-800/10 rounded-full" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <div className="text-6xl">📚</div>
        </div>
      </div>
    ),
  },
  tags: {
    icon: FileText,
    defaultTitle: 'No tags yet',
    defaultDescription: 'Add tags to your entries to organize and find them easily',
    defaultActionLabel: '',
    defaultActionHref: '',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-green-200/50 to-green-100/20 dark:from-green-900/30 dark:to-green-800/10 rounded-full" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <div className="text-6xl">🏷️</div>
        </div>
      </div>
    ),
  },
  calendar: {
    icon: Calendar,
    defaultTitle: 'No entries this month',
    defaultDescription: 'Start journaling to see your activity on the calendar',
    defaultActionLabel: 'Write Today',
    defaultActionHref: '/app/new',
    illustration: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 to-indigo-100/20 dark:from-indigo-900/30 dark:to-indigo-800/10 rounded-full" />
        <div className="absolute inset-8 bg-white dark:bg-graphite rounded-2xl shadow-xl flex items-center justify-center">
          <Calendar className="w-16 h-16 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
        </div>
      </div>
    ),
  },
}

export default function EmptyStateIllustration({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = illustrations[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      {config.illustration}

      {/* Title */}
      <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-3">
        {title || config.defaultTitle}
      </h3>

      {/* Description */}
      <p className="text-charcoal/60 dark:text-white/60 max-w-md mb-8">
        {description || config.defaultDescription}
      </p>

      {/* Action Button */}
      {(actionHref || onAction) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <config.icon className="w-5 h-5" />
              {actionLabel || config.defaultActionLabel}
            </Link>
          ) : onAction ? (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <config.icon className="w-5 h-5" />
              {actionLabel || config.defaultActionLabel}
            </button>
          ) : null}
        </>
      )}

      {/* Tips */}
      {type === 'entries' && (
        <div className="mt-8 p-4 bg-gold/10 dark:bg-teal/10 rounded-lg border border-gold/20 dark:border-teal/20 max-w-md">
          <p className="text-sm text-charcoal/70 dark:text-white/70">
            💡 <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-white dark:bg-graphite rounded border border-charcoal/20 dark:border-white/20 text-xs font-mono">Ctrl+E</kbd> to quickly create a new entry
          </p>
        </div>
      )}

      {type === 'search' && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md">
          <p className="text-sm text-charcoal/70 dark:text-white/70">
            💡 <strong>Tip:</strong> Use filters to narrow down your search or try different keywords
          </p>
        </div>
      )}
    </div>
  )
}
