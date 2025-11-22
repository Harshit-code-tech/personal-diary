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
  { value: 'sad', emoji: '😢', color: '#3B82F6' },
  { value: 'excited', emoji: '🤩', color: '#F59E0B' },
  { value: 'anxious', emoji: '😰', color: '#8B5CF6' },
  { value: 'calm', emoji: '😌', color: '#2DD4BF' },
  { value: 'angry', emoji: '😠', color: '#EF4444' },
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
    const moodObj = moods.find(m => m.value === mood)
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
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-charcoal dark:text-white" />
              </Link>
              <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-teal">
                Calendar
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Link
                href="/app/new"
                className="flex items-center gap-2 px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                New Entry
              </Link>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-charcoal dark:text-white" />
            </button>

            <h2 className="text-xl font-semibold text-charcoal dark:text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-charcoal dark:text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map(day => (
                  <div
                    key={day}
                    className="text-center font-semibold text-charcoal/60 dark:text-white/60 text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
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
                        aspect-square p-2 rounded-lg transition-all relative
                        ${isTodayDate ? 'ring-2 ring-gold dark:ring-teal' : ''}
                        ${isSelected
                          ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg scale-105'
                          : 'hover:bg-charcoal/5 dark:hover:bg-white/5'
                        }
                      `}
                    >
                      <div className={`text-sm font-medium ${isSelected ? 'text-white dark:text-midnight' : 'text-charcoal dark:text-white'}`}>
                        {day}
                      </div>

                      {/* Entry Indicators */}
                      {dayEntries.length > 0 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {dayEntries.slice(0, 3).map((entry, idx) => {
                            const moodColor = getMoodColor(entry.mood)
                            return (
                              <div
                                key={idx}
                                className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-midnight shadow-lg"
                                style={{ backgroundColor: moodColor }}
                                title={entry.mood || 'No mood'}
                              />
                            )
                          })}
                          {dayEntries.length > 3 && (
                            <div className="text-xs font-bold text-charcoal/80 dark:text-white/80">
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

            {/* Legend */}
            <div className="mt-6 bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-charcoal dark:text-white mb-4">Mood Legend</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {moods.map(mood => (
                  <div key={mood.value} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: mood.color }}
                    />
                    <span className="text-sm text-charcoal dark:text-white capitalize">
                      {mood.emoji} {mood.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Date Entries */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6 sticky top-24">
              {selectedDate ? (
                <>
                  <h3 className="font-semibold text-charcoal dark:text-white mb-2">
                    {formatSelectedDate()}
                  </h3>
                  <div className="text-sm text-charcoal/60 dark:text-white/60 mb-4">
                    {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'}
                  </div>

                  {selectedEntries.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEntries.map(entry => (
                        <Link
                          key={entry.id}
                          href={`/app/entry/${entry.id}`}
                          className="block p-4 bg-[#FFF5E6] dark:bg-midnight rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            {entry.mood && (
                              <div
                                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                style={{ backgroundColor: getMoodColor(entry.mood) }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-charcoal dark:text-white truncate">
                                {entry.title}
                              </h4>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-charcoal/60 dark:text-white/60 mb-4">
                        No entries for this day
                      </p>
                      <Link
                        href={`/app/entry/new?date=${selectedDate}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Create Entry
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-charcoal/60 dark:text-white/60">
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
