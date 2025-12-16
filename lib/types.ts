// Centralized TypeScript types for the application
// Prevents duplicate type definitions across components

export interface Entry {
  id: string
  title: string
  content: string
  entry_date: string
  word_count: number
  mood: string | null
  folder_id: string | null
  person_id: string | null
  is_bookmarked: boolean
  bookmarked_at: string | null
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  updated_at: string
  entry_people?: Array<{
    people: Person
  }>
  story_entries?: Array<{
    stories: Story
  }>
  goal_entries?: Array<{
    goals: Goal
  }>
  event_entries?: Array<{
    events: TimelineEvent
  }>
}

export interface Person {
  id: string
  user_id: string
  name: string
  relationship: string | null
  bio: string | null
  avatar_url: string | null
  birthday: string | null
  contact_info: string | null
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  user_id: string
  title: string
  description: string | null
  icon: string
  color: string
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  target_date: string | null
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  event_date: string
  event_type: string
  created_at: string
  updated_at: string
}

export interface MemoryAlbum {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image: string | null
  created_at: string
  updated_at: string
}

export interface DailyMemory {
  id: string
  user_id: string
  entry_id: string
  shown_date: string
  viewed: boolean
  created_at: string
  entry?: Entry
}

export interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  timezone: string
  email_reminders_enabled: boolean
  email_daily_reminder: boolean
  email_weekly_summary: boolean
  email_inactive_reminder: boolean
  reminder_time: string | null
  created_at: string
  updated_at: string
}

export interface Stats {
  totalEntries: number
  totalWords: number
  peopleCount: number
  storiesCount: number
  currentStreak: number
  longestStreak?: number
  averageWordsPerEntry?: number
  totalDaysWithEntries?: number
}
