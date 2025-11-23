import { BookOpen, Calendar, Heart, Smile, Sparkles } from 'lucide-react'

interface EmptyStateProps {
  icon?: 'book' | 'calendar' | 'heart' | 'smile' | 'sparkles'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const icons = {
  book: BookOpen,
  calendar: Calendar,
  heart: Heart,
  smile: Smile,
  sparkles: Sparkles,
}

export default function EmptyState({
  icon = 'book',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="mb-6 p-6 bg-gold/10 dark:bg-teal/10 rounded-full">
        <Icon className="w-16 h-16 text-gold dark:text-teal" />
      </div>
      <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-charcoal/60 dark:text-white/60 max-w-md mb-8">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gold dark:bg-teal text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Preset empty states for common use cases
export const NoEntriesState = ({ onCreateEntry }: { onCreateEntry: () => void }) => (
  <EmptyState
    icon="book"
    title="No entries yet"
    description="Start documenting your thoughts, experiences, and memories. Your journey begins with a single entry."
    action={{
      label: "Write your first entry",
      onClick: onCreateEntry,
    }}
  />
)

export const NoSearchResultsState = ({ onClearSearch }: { onClearSearch?: () => void }) => (
  <EmptyState
    icon="sparkles"
    title="No results found"
    description="Try adjusting your search query or filters to find what you're looking for."
    action={onClearSearch ? {
      label: "Clear search",
      onClick: onClearSearch,
    } : undefined}
  />
)

export const NoPeopleState = ({ onAddPerson }: { onAddPerson: () => void }) => (
  <EmptyState
    icon="heart"
    title="No people added yet"
    description="Keep track of the important people in your life and link them to your diary entries."
    action={{
      label: "Add your first person",
      onClick: onAddPerson,
    }}
  />
)

export const NoStoriesState = ({ onCreateStory }: { onCreateStory: () => void }) => (
  <EmptyState
    icon="sparkles"
    title="No stories created"
    description="Organize your entries into meaningful stories and track your life's adventures."
    action={{
      label: "Create your first story",
      onClick: onCreateStory,
    }}
  />
)

export const NoMoodDataState = () => (
  <EmptyState
    icon="smile"
    title="No mood data yet"
    description="Start adding moods to your entries to see your emotional patterns over time."
  />
)

export const NoRemindersState = ({ onCreateReminder }: { onCreateReminder: () => void }) => (
  <EmptyState
    icon="calendar"
    title="No reminders set"
    description="Set reminders to help you stay consistent with journaling and never miss important moments."
    action={{
      label: "Create your first reminder",
      onClick: onCreateReminder,
    }}
  />
)
