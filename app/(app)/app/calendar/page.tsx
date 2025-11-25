'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, ArrowLeft } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

interface Entry {
  id: string
  entry_date: string
  title: string
  mood?: string
}

const moods = [
  { value: 'happy', emoji: '😊', color: '#10B981' },
  { value: 'sad', emoji: '😔', color: '#3B82F6' },
  { value: 'angry', emoji: '😡', color: '#EF4444' },
  { value: 'anxious', emoji: '😰', color: '#8B5CF6' },
  { value: 'peaceful', emoji: '😌', color: '#2DD4BF' },
  { value: 'excited', emoji: '🎉', color: '#F59E0B' },
  { value: 'tired', emoji: '😴', color: '#9CA3AF' },
  { value: 'thoughtful', emoji: '💭', color: '#6366F1' },
  { value: 'grateful', emoji: '🙏', color: '#D4AF37' },
  { value: 'neutral', emoji: '😐', color: '#6B7280' },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user, currentDate])

  const fetchEntries = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('entries')
        .select('id, entry_date, title, mood')
        .eq('user_id', user?.id)
        .gte('entry_date', startOfMonth.toISOString().split('T')[0])
        .lte('entry_date', endOfMonth.toISOString().split('T')[0])
        .order('entry_date', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getEntriesForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return entries.filter(entry => entry.entry_date === dateStr)
  }

  const getMoodColor = (mood?: string) => {
    if (!mood) return '#6B7280' // Default grey for no mood
    
    // Extract mood value from format like "😊 Happy" -> "happy"
    // Split by space and take the last word, then lowercase it
    const words = mood.trim().split(/\s+/)
    const moodWord = words[words.length - 1].toLowerCase()
    
    const moodObj = moods.find(m => m.value === moodWord)
    
    return moodObj?.color || '#6B7280'
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ''
    const date = new Date(selectedDate)
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const selectedEntries = selectedDate ? entries.filter(e => e.entry_date === selectedDate) : []

  const days = getDaysInMonth()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Link
                href="/app"
                className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-charcoal dark:text-white" />
              </Link>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal dark:text-teal truncate">
                📅 Calendar
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ThemeSwitcher />
              <Link
                href="/app/new"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-xl transition-all text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">New Entry</span>
              </Link>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white/50 dark:bg-graphite/50 rounded-xl p-3 backdrop-blur-sm">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-charcoal dark:text-white" />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-charcoal dark:text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-charcoal dark:text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl p-4 sm:p-6 border border-charcoal/10 dark:border-white/10">
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
                {weekDays.map(day => (
                  <div
                    key={day}
                    className="text-center font-bold text-gold dark:text-teal text-xs sm:text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} />
                  }

                  const dayEntries = getEntriesForDate(day)
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isSelected = selectedDate === dateStr
                  const isTodayDate = isToday(day)

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`
                        aspect-square p-2 sm:p-3 rounded-xl transition-all relative group
                        ${isTodayDate ? 'ring-2 ring-gold dark:ring-teal ring-offset-2 ring-offset-white dark:ring-offset-graphite' : ''}
                        ${isSelected
                          ? 'bg-gradient-to-br from-gold to-orange-500 dark:from-teal dark:to-cyan-500 text-white shadow-2xl scale-105 z-10'
                          : dayEntries.length > 0
                            ? 'bg-gold/10 dark:bg-teal/10 hover:bg-gold/20 dark:hover:bg-teal/20 hover:scale-105'
                            : 'hover:bg-charcoal/5 dark:hover:bg-white/5 hover:scale-105'
                        }
                      `}
                    >
                      <div className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : isTodayDate ? 'text-gold dark:text-teal' : 'text-charcoal dark:text-white'}`}>
                        {day}
                      </div>

                      {/* Entry Indicators */}
                      {dayEntries.length > 0 && (
                        <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 sm:gap-1">
                          {dayEntries.slice(0, 3).map((entry, idx) => {
                            const moodColor = getMoodColor(entry.mood)
                            return (
                              <div
                                key={idx}
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ring-1 sm:ring-2 ring-white dark:ring-graphite shadow-md transition-transform group-hover:scale-125"
                                style={{ backgroundColor: isSelected ? 'white' : moodColor }}
                                title={entry.mood || 'No mood'}
                              />
                            )
                          })}
                          {dayEntries.length > 3 && (
                            <div className={`text-[10px] sm:text-xs font-bold ml-0.5 ${isSelected ? 'text-white' : 'text-gold dark:text-teal'}`}>
                              +{dayEntries.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mood Legend */}
            <div className="mt-6 bg-gradient-to-br from-white to-gray-50 dark:from-graphite dark:to-charcoal rounded-2xl shadow-xl p-4 sm:p-6 border border-charcoal/10 dark:border-white/10">
              <h3 className="font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🎨</span>
                Mood Legend
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {moods.map(mood => (
                  <div key={mood.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-midnight/50 transition-colors">
                    <div
                      className="w-4 h-4 rounded-full shadow-md ring-2 ring-white dark:ring-graphite"
                      style={{ backgroundColor: mood.color }}
                    />
                    <span className="text-xs sm:text-sm text-charcoal dark:text-white capitalize font-medium">
                      {mood.emoji} {mood.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Date Entries */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-graphite dark:to-charcoal rounded-2xl shadow-2xl p-4 sm:p-6 sticky top-24 border border-charcoal/10 dark:border-white/10">
              {selectedDate ? (
                <>
                  <h3 className="font-bold text-charcoal dark:text-white mb-2 text-base sm:text-lg">
                    {formatSelectedDate()}
                  </h3>
                  <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 mb-4 font-medium">
                    {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'}
                  </div>

                  {selectedEntries.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEntries.map(entry => (
                        <Link
                          key={entry.id}
                          href={`/app/entry/${entry.id}`}
                          className="block p-3 sm:p-4 bg-white dark:bg-midnight rounded-xl hover:shadow-lg transition-all hover:scale-102 border border-charcoal/10 dark:border-white/10"
                        >
                          <div className="flex items-start gap-3">
                            {entry.mood && (
                              <div
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mt-1 flex-shrink-0 shadow-md ring-2 ring-white dark:ring-midnight"
                                style={{ backgroundColor: getMoodColor(entry.mood) }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm sm:text-base text-charcoal dark:text-white line-clamp-2">
                                {entry.title}
                              </h4>
                              {entry.mood && (
                                <p className="text-xs text-charcoal/60 dark:text-white/60 mt-1 capitalize">
                                  {entry.mood}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📝</div>
                      <p className="text-charcoal/60 dark:text-white/60 mb-4 text-sm">
                        No entries for this day
                      </p>
                      <Link
                        href={`/app/entry/new?date=${selectedDate}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold to-orange-500 dark:from-teal dark:to-cyan-500 text-white rounded-xl font-bold hover:shadow-xl transition-all text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Create Entry
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📅</div>
                  <p className="text-charcoal/60 dark:text-white/60 font-medium">
                    Select a date to view entries
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
