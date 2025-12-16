'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Star, Plus, Calendar, Trash2, Filter } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import toast from 'react-hot-toast'

type LifeEvent = {
  id: string
  title: string
  description: string | null
  event_date: string
  category: string
  icon: string
  color: string
  is_major: boolean
  related_entries: number
}

const categories = [
  { value: 'milestone', label: 'Milestone', icon: '🎯', color: '#FFD700' },
  { value: 'achievement', label: 'Achievement', icon: '🏆', color: '#4CAF50' },
  { value: 'relationship', label: 'Relationship', icon: '❤️', color: '#E91E63' },
  { value: 'travel', label: 'Travel', icon: '✈️', color: '#2196F3' },
  { value: 'work', label: 'Work', icon: '💼', color: '#9C27B0' },
  { value: 'education', label: 'Education', icon: '🎓', color: '#FF9800' },
  { value: 'health', label: 'Health', icon: '💪', color: '#00BCD4' },
  { value: 'other', label: 'Other', icon: '⭐', color: '#607D8B' }
]

export default function LifeTimelinePage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<LifeEvent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customCategory, setCustomCategory] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    category: 'milestone',
    icon: '🎯',
    color: '#FFD700',
    is_major: false
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('event_date', { ascending: false })

      if (error) throw error
      setEvents(data || [])
      setFilteredEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user, fetchEvents])

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter(e => e.category === selectedCategory))
    }
  }, [selectedCategory, events])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.event_date) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.category === 'other' && !customCategory.trim()) {
      toast.error('Please specify the category')
      return
    }

    // Use custom category if "other" is selected
    const finalCategory = formData.category === 'other' ? customCategory.trim() : formData.category

    try {
      if (editingId) {
        const { error } = await supabase
          .from('life_events')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            event_date: formData.event_date,
            category: finalCategory,
            icon: formData.icon,
            color: formData.color,
            is_major: formData.is_major
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Event updated!')
      } else {
        const { error } = await supabase
          .from('life_events')
          .insert({
            user_id: user?.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            event_date: formData.event_date,
            category: formData.category,
            icon: formData.icon,
            color: formData.color,
            is_major: formData.is_major
          })

        if (error) throw error
        toast.success('Event created!')
      }

      resetForm()
      fetchEvents()
    } catch (err: any) {
      console.error('Error saving event:', err)
      toast.error(err.message || 'Failed to save event')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('life_events')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Event deleted!')
      fetchEvents()
    } catch (err) {
      console.error('Error deleting event:', err)
      toast.error('Failed to delete event')
    }
  }

  const startEdit = (event: LifeEvent) => {
    setEditingId(event.id)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      category: event.category,
      icon: event.icon,
      color: event.color,
      is_major: event.is_major
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      category: 'milestone',
      icon: '🎯',
      color: '#FFD700',
      is_major: false
    })
    setEditingId(null)
    setShowAddModal(false)
  }

  const updateCategoryDefaults = (category: string) => {
    const cat = categories.find(c => c.value === category)
    if (cat) {
      setFormData({
        ...formData,
        category,
        icon: cat.icon,
        color: cat.color
      })
    }
  }

  if (authLoading || loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-7xl mx-auto gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Link
              href="/app"
              className="group flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 shrink-0"
            >
              <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-bold text-sm sm:text-lg hidden xs:inline">Back</span>
            </Link>
            <Star className="w-6 h-6 text-gold dark:text-teal shrink-0" />
            <span className="font-bold text-lg text-charcoal dark:text-white hidden md:inline truncate">Timeline</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
            <ThemeSwitcher />
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl text-xs sm:text-sm font-bold hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Add Event</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight flex items-center gap-3 sm:gap-4">
            <Star className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gold dark:text-teal" />
            Life Timeline
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-charcoal/70 dark:text-white/70 font-medium">
            Chronicle the important moments in your life journey
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg'
                : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
            }`}
          >
            All Events ({events.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg'
                  : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
            <div className="text-8xl mb-6">⭐</div>
            <h3 className="font-serif text-3xl font-bold mb-3 text-charcoal dark:text-teal">
              {selectedCategory === 'all' ? 'No Events Yet' : 'No Events in This Category'}
            </h3>
            <p className="text-lg text-charcoal/70 dark:text-white/70 mb-8">
              {selectedCategory === 'all'
                ? 'Start documenting your life\'s important moments'
                : 'Create events in this category to see them here'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/50 to-transparent dark:from-teal dark:via-teal/50" />

            {/* Events */}
            <div className="space-y-8">
              {filteredEvents.map((event, index) => {
                const date = new Date(event.event_date)
                const cat = categories.find(c => c.value === event.category)

                return (
                  <div key={event.id} className="relative flex gap-6 items-start group">
                    {/* Timeline Dot */}
                    <div
                      className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                        event.is_major ? 'ring-4 ring-gold/30 dark:ring-teal/30' : ''
                      }`}
                      style={{ backgroundColor: event.color }}
                    >
                      <span className="text-3xl">{event.icon}</span>
                    </div>

                    {/* Event Card */}
                    <div className="flex-1 bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-charcoal/10 dark:border-white/10 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {event.is_major && (
                            <span className="inline-block px-3 py-1 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal text-xs font-bold rounded-full mb-2">
                              Major Event
                            </span>
                          )}
                          <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
                            {event.title}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {date.toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: `${event.color}20`, color: event.color }}
                            >
                              {cat?.label || event.category}
                            </span>
                          </div>

                          {event.description && (
                            <p className="text-charcoal/70 dark:text-white/70 leading-relaxed">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(event)}
                            className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl max-w-lg w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">
              {editingId ? 'Edit Event' : 'Add Life Event'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  rows={3}
                  placeholder="Tell the story..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    updateCategoryDefaults(e.target.value)
                    if (e.target.value !== 'other') {
                      setCustomCategory('')
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal [&>option]:bg-white [&>option]:dark:bg-midnight [&>option]:text-charcoal [&>option]:dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    Specify Category *
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                    placeholder="e.g., Hobby, Volunteering, Family..."
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_major}
                    onChange={(e) => setFormData({ ...formData, is_major: e.target.checked })}
                    className="w-5 h-5 rounded border-charcoal/20 dark:border-white/20 text-gold dark:text-teal focus:ring-gold dark:focus:ring-teal"
                  />
                  <span className="text-sm font-medium text-charcoal dark:text-white">
                    Mark as major life event
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 border border-charcoal/20 dark:border-white/20 rounded-lg font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
