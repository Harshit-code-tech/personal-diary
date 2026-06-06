'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import {
  ArrowLeft, Star, Plus, Calendar, Trash2, Search,
  ChevronDown, ChevronRight, Eye, Pencil, X, Target,
} from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CategoryComboBox, {
  PRESET_CATEGORIES, getCategoryDisplay, isPresetCategory,
} from '@/components/timeline/CategoryComboBox'
import type { LifeEvent, UserCategory } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────────────

/** An entry linked to a life event, fetched for inline display */
interface LinkedEntry {
  id: string
  title: string
  entry_date: string
  mood: string | null
}

/** A goal linked to a life event */
interface LinkedGoal {
  id: string
  title: string
  category: string | null
  progress: number
  is_completed: boolean
}

/** Group of events within a single month */
interface MonthGroup {
  month: number        // 0-11
  monthLabel: string   // "January", "February", etc.
  events: LifeEvent[]
}

/** Group of months within a single year */
interface YearGroup {
  year: number
  months: MonthGroup[]
  totalEvents: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Group a flat list of events into year → month hierarchy, sorted descending */
function groupEventsByYearMonth(events: LifeEvent[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, LifeEvent[]>>()

  for (const event of events) {
    const d = new Date(event.event_date)
    const year = d.getFullYear()
    const month = d.getMonth()

    if (!yearMap.has(year)) yearMap.set(year, new Map())
    const monthMap = yearMap.get(year)!
    if (!monthMap.has(month)) monthMap.set(month, [])
    monthMap.get(month)!.push(event)
  }

  // Sort years descending, months descending
  return Array.from(yearMap.keys())
    .sort((a, b) => b - a)
    .map(year => {
      const monthMap = yearMap.get(year)!
      const months = Array.from(monthMap.keys())
        .sort((a, b) => b - a)
        .map(month => ({
          month,
          monthLabel: MONTH_NAMES[month],
          events: monthMap.get(month)!.sort(
            (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
          ),
        }))

      return {
        year,
        months,
        totalEvents: months.reduce((sum, m) => sum + m.events.length, 0),
      }
    })
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function LifeTimelinePage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // ── Data state ─────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [loading, setLoading] = useState(true)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // ── Year collapse (current year starts expanded, past years collapsed) ─────
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  // ── Inline linked-entries expansion per event ──────────────────────────────
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [linkedEntries, setLinkedEntries] = useState<LinkedEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  // ── Add/Edit modal ─────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    category: 'milestone',
    icon: '🎯',
    color: '#FFD700',
    is_major: false,
  })

  // ── Delete confirmation ────────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Goal linking ───────────────────────────────────────────────────────────
  const [allGoals, setAllGoals] = useState<LinkedGoal[]>([])
  const [linkedGoalMap, setLinkedGoalMap] = useState<Map<string, LinkedGoal[]>>(new Map())
  const [showGoalPicker, setShowGoalPicker] = useState<string | null>(null) // eventId or null
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])

  // ═══════════════════════════════════════════════════════════════════════════
  //  Data Fetching
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchEvents = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })

      if (error) throw error
      setEvents(data || [])

      // Auto-expand the current year on first load
      setExpandedYears(prev => {
        if (prev.size === 0) return new Set([new Date().getFullYear()])
        return prev
      })
    } catch (err) {
      console.error('Error fetching life events:', err)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  const fetchUserCategories = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })

      if (!error && data) setUserCategories(data)
    } catch (err) {
      console.error('Error fetching user categories:', err)
    }
  }, [user?.id, supabase])

  /** Fetch all user goals for the goal-linking picker */
  const fetchAllGoals = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, category, progress, is_completed')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) setAllGoals(data)
    } catch (err) {
      console.error('Error fetching goals:', err)
    }
  }, [user?.id, supabase])

  /** Fetch linked goals for a specific event (populate map) */
  const fetchLinkedGoals = useCallback(async (eventId: string) => {
    try {
      // Get goal IDs linked to this event
      const { data: links, error: linkError } = await supabase
        .from('life_event_goals')
        .select('goal_id')
        .eq('life_event_id', eventId)

      if (linkError) throw linkError

      const goalIds = (links || []).map((l: any) => l.goal_id).filter(Boolean)

      if (goalIds.length === 0) {
        setLinkedGoalMap(prev => new Map(prev).set(eventId, []))
        return
      }

      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id, title, category, progress, is_completed')
        .in('id', goalIds)

      if (!goalsError && goals) {
        setLinkedGoalMap(prev => new Map(prev).set(eventId, goals))
      }
    } catch (err) {
      console.error('Error fetching linked goals:', err)
    }
  }, [supabase])

  /** Link selected goals to a life event */
  const linkGoals = async (eventId: string) => {
    if (selectedGoalIds.length === 0) return

    try {
      const { error } = await supabase
        .from('life_event_goals')
        .insert(selectedGoalIds.map(goalId => ({
          life_event_id: eventId,
          goal_id: goalId,
        })))

      if (error) throw error

      toast.success('Goals linked!')
      setShowGoalPicker(null)
      setSelectedGoalIds([])
      fetchLinkedGoals(eventId)
    } catch (err: any) {
      console.error('Error linking goals:', err)
      toast.error(err.message || 'Failed to link goals')
    }
  }

  /** Unlink a goal from a life event */
  const unlinkGoal = async (eventId: string, goalId: string) => {
    try {
      const { error } = await supabase
        .from('life_event_goals')
        .delete()
        .eq('life_event_id', eventId)
        .eq('goal_id', goalId)

      if (error) throw error

      toast.success('Goal unlinked')
      fetchLinkedGoals(eventId)
    } catch (err) {
      console.error('Error unlinking goal:', err)
      toast.error('Failed to unlink goal')
    }
  }

  useEffect(() => {
    if (user) {
      fetchEvents()
      fetchUserCategories()
      fetchAllGoals()
    }
  }, [user, fetchEvents, fetchUserCategories, fetchAllGoals])

  // ═══════════════════════════════════════════════════════════════════════════
  //  Linked Entries (inline expansion)
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchLinkedEntries = async (eventId: string) => {
    // Toggle off if already expanded
    if (expandedEventId === eventId) {
      setExpandedEventId(null)
      setLinkedEntries([])
      return
    }

    setExpandedEventId(eventId)
    setLoadingEntries(true)
    try {
      // Step 1: Get entry IDs linked to this life event
      const { data: links, error: linkError } = await supabase
        .from('entry_life_events')
        .select('entry_id')
        .eq('life_event_id', eventId)

      if (linkError) throw linkError

      const entryIds = (links || []).map((l: any) => l.entry_id).filter(Boolean)

      if (entryIds.length === 0) {
        setLinkedEntries([])
        setLoadingEntries(false)
        return
      }

      // Step 2: Fetch the actual entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select('id, title, entry_date, mood')
        .in('id', entryIds)
        .order('entry_date', { ascending: false })

      if (entriesError) throw entriesError

      setLinkedEntries(entriesData || [])
    } catch (err) {
      console.error('Error fetching linked entries:', err)
      setLinkedEntries([])
    } finally {
      setLoadingEntries(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Filtering & Grouping (memoized)
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredEvents = useMemo(() => {
    let result = events

    if (selectedYear !== 'all') {
      result = result.filter(e => new Date(e.event_date).getFullYear() === selectedYear)
    }
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      )
    }

    return result
  }, [events, selectedYear, selectedCategory, searchQuery])

  const yearGroups = useMemo(() => groupEventsByYearMonth(filteredEvents), [filteredEvents])

  // All years that appear in any event (for quick-jump buttons)
  const availableYears = useMemo(() => {
    const years = new Set(events.map(e => new Date(e.event_date).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [events])

  // All unique category values across all events (for the category filter)
  const allCategoryValues = useMemo(() => {
    const cats = new Set(events.map(e => e.category))
    return Array.from(cats)
  }, [events])

  // ═══════════════════════════════════════════════════════════════════════════
  //  Year Toggle
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.event_date) {
      toast.error('Title and date are required')
      return
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: formData.event_date,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        is_major: formData.is_major,
      }

      if (editingId) {
        const { error } = await supabase
          .from('life_events')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        toast.success('Event updated!')
      } else {
        const { error } = await supabase
          .from('life_events')
          .insert({ ...payload, user_id: user?.id })
        if (error) throw error
        toast.success('Event created!')

        // Save custom categories for future auto-complete suggestions
        if (!isPresetCategory(formData.category)) {
          await supabase
            .from('user_categories')
            .upsert(
              {
                user_id: user?.id,
                name: formData.category,
                icon: formData.icon,
                color: formData.color,
                usage_count: 1,
              },
              { onConflict: 'user_id,name' }
            )
          fetchUserCategories()
        }
      }

      resetForm()
      fetchEvents()
    } catch (err: any) {
      console.error('Error saving event:', err)
      toast.error(err.message || 'Failed to save event')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('life_events')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast.success('Event deleted!')
      setConfirmDeleteId(null)
      if (expandedEventId === id) {
        setExpandedEventId(null)
        setLinkedEntries([])
      }
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
      is_major: event.is_major,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      category: 'milestone',
      icon: '🎯',
      color: '#FFD700',
      is_major: false,
    })
    setEditingId(null)
    setShowModal(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Loading State
  // ═══════════════════════════════════════════════════════════════════════════

  if (authLoading || loading) return <PageLoadingSkeleton />

  // ═══════════════════════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════════════════════

  const currentYear = new Date().getFullYear()

  return (
    <div
      className="min-h-screen bg-paper dark:bg-midnight"
      onClick={() => {
        // Close any open goal picker when clicking outside
        if (showGoalPicker) {
          setShowGoalPicker(null)
          setSelectedGoalIds([])
        }
      }}
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-6xl mx-auto gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/app"
              className="p-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-charcoal dark:text-white" />
            </Link>
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-gold dark:text-teal shrink-0" />
            <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-charcoal dark:text-teal truncate">
              Life Timeline
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSearch(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch
                  ? 'bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal'
                  : 'hover:bg-charcoal/5 dark:hover:bg-white/5 text-charcoal dark:text-white'
              }`}
              title="Search events"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <ThemeSwitcher />
            <button
              onClick={() => { resetForm(); setShowModal(true) }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg text-xs sm:text-sm font-bold hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Search bar (toggleable) */}
        {showSearch && (
          <div className="px-4 sm:px-6 pb-3 max-w-6xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title or description..."
                className="w-full pl-10 pr-8 py-2 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-sm text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 dark:focus:ring-teal/50"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded"
                >
                  <X className="w-3.5 h-3.5 text-charcoal/50 dark:text-white/50" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8 space-y-3">
          {/* Filtered event count */}
          <p className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            {selectedYear !== 'all' && ` in ${selectedYear}`}
            {selectedCategory !== 'all' && ` · ${getCategoryDisplay(selectedCategory, userCategories).label}`}
            {searchQuery && ` · matching "${searchQuery}"`}
          </p>

          {/* Dropdowns row: year + category + clear */}
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <select
              value={selectedYear}
              onChange={(e) => {
                const val = e.target.value
                const yearNum = val === 'all' ? 'all' as const : Number(val)
                setSelectedYear(yearNum)
                if (yearNum !== 'all') {
                  setExpandedYears(prev => new Set(prev).add(yearNum))
                }
              }}
              className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm vintage-card border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 dark:focus:ring-teal/50"
            >
              <option value="all">All Years</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm vintage-card border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 dark:focus:ring-teal/50"
            >
              <option value="all">All Categories</option>
              {allCategoryValues.map(cat => {
                const display = getCategoryDisplay(cat, userCategories)
                return <option key={cat} value={cat}>{display.icon} {display.label}</option>
              })}
            </select>

            {(selectedYear !== 'all' || selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedYear('all')
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
                className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gold dark:text-teal hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Quick-jump year pills */}
          {availableYears.length > 1 && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs text-charcoal/40 dark:text-white/40 font-medium mr-1">
                Jump:
              </span>
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => {
                    setSelectedYear(y)
                    setExpandedYears(prev => new Set(prev).add(y))
                  }}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-xs font-medium transition-colors ${
                    selectedYear === y
                      ? 'bg-gold dark:bg-teal text-white dark:text-midnight'
                      : 'bg-charcoal/5 dark:bg-white/5 text-charcoal/60 dark:text-white/60 hover:bg-charcoal/10 dark:hover:bg-white/10'
                  }`}
                >
                  {y}
                </button>
              ))}
              {selectedYear !== 'all' && (
                <button
                  onClick={() => setSelectedYear('all')}
                  className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium text-gold dark:text-teal hover:bg-gold/10 dark:hover:bg-teal/10 rounded transition-colors"
                >
                  All Years
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Empty State ─────────────────────────────────────────────────── */}
        {filteredEvents.length === 0 ? (
          <div className="vintage-card rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-charcoal/10 dark:border-white/10">
            <div className="text-5xl sm:text-6xl mb-4">⭐</div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2 text-charcoal dark:text-teal">
              {events.length === 0 ? 'No Events Yet' : 'No Matching Events'}
            </h3>
            <p className="text-sm text-charcoal/60 dark:text-white/60 mb-6 max-w-sm mx-auto">
              {events.length === 0
                ? 'Start documenting your life\'s important moments — milestones, achievements, and everything in between.'
                : 'Try adjusting your filters or search to find events.'}
            </p>
            {events.length === 0 && (
              <button
                onClick={() => { resetForm(); setShowModal(true) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-bold hover:opacity-90 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Event
              </button>
            )}
          </div>
        ) : (
          /* ── Year-grouped Timeline ──────────────────────────────────────── */
          <div className="space-y-4 sm:space-y-6">
            {yearGroups.map(yearGroup => {
              const isExpanded = expandedYears.has(yearGroup.year)
              const isCurrent = yearGroup.year === currentYear

              return (
                <section key={yearGroup.year} aria-label={`${yearGroup.year} events`}>
                  {/* Year header bar */}
                  <button
                    onClick={() => toggleYear(yearGroup.year)}
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 dark:bg-graphite/60 rounded-xl border border-charcoal/10 dark:border-white/10 hover:bg-white dark:hover:bg-graphite transition-colors"
                  >
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-charcoal/50 dark:text-white/50" />
                      : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-charcoal/50 dark:text-white/50" />
                    }
                    <span className="font-serif text-lg sm:text-2xl font-bold text-charcoal dark:text-white">
                      {yearGroup.year}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal text-[10px] sm:text-xs font-bold rounded-full">
                        Current
                      </span>
                    )}
                    <span className="ml-auto text-[10px] sm:text-sm text-charcoal/50 dark:text-white/50 tabular-nums">
                      {yearGroup.totalEvents} event{yearGroup.totalEvents !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Collapsed hint */}
                  {!isExpanded && (
                    <button
                      onClick={() => toggleYear(yearGroup.year)}
                      className="mt-1 pl-8 sm:pl-10 text-[10px] sm:text-xs text-charcoal/40 dark:text-white/40 hover:text-charcoal/60 dark:hover:text-white/60 transition-colors"
                    >
                      Show {yearGroup.totalEvents} event{yearGroup.totalEvents !== 1 ? 's' : ''}
                    </button>
                  )}

                  {/* Expanded year → month → events */}
                  {isExpanded && (
                    <div className="mt-3 space-y-4 sm:space-y-5 pl-2 sm:pl-4">
                      {yearGroup.months.map(monthGroup => (
                        <div key={monthGroup.month}>
                          {/* Month sub-header */}
                          <h4 className="text-[10px] sm:text-xs font-bold text-charcoal/40 dark:text-white/40 uppercase tracking-wider mb-2 sm:mb-3 pl-2">
                            {monthGroup.monthLabel}
                          </h4>

                          {/* Events in this month */}
                          <div className="space-y-2.5 sm:space-y-3">
                            {monthGroup.events.map(event => (
                              <EventCard
                                key={event.id}
                                event={event}
                                userCategories={userCategories}
                                isExpanded={expandedEventId === event.id}
                                linkedEntries={expandedEventId === event.id ? linkedEntries : []}
                                loadingEntries={expandedEventId === event.id && loadingEntries}
                                onToggleEntries={() => fetchLinkedEntries(event.id)}
                                onEdit={() => startEdit(event)}
                                onDelete={() => setConfirmDeleteId(event.id)}
                                linkedGoals={linkedGoalMap.get(event.id) || []}
                                allGoals={allGoals}
                                showGoalPicker={showGoalPicker === event.id}
                                selectedGoalIds={selectedGoalIds}
                                onToggleGoalPicker={() => {
                                  if (showGoalPicker === event.id) {
                                    setShowGoalPicker(null)
                                    setSelectedGoalIds([])
                                  } else {
                                    fetchLinkedGoals(event.id)
                                    setShowGoalPicker(event.id)
                                    setSelectedGoalIds([])
                                  }
                                }}
                                onSelectGoal={(goalId) => {
                                  setSelectedGoalIds(prev =>
                                    prev.includes(goalId)
                                      ? prev.filter(id => id !== goalId)
                                      : [...prev, goalId]
                                  )
                                }}
                                onLinkGoals={() => linkGoals(event.id)}
                                onUnlinkGoal={(goalId) => unlinkGoal(event.id, goalId)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={resetForm}
        >
          <div
            className="vintage-card rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-charcoal dark:text-white">
                {editingId ? 'Edit Event' : 'Add Life Event'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-charcoal/50 dark:text-white/50" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-charcoal dark:text-white mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 dark:focus:ring-teal/50"
                  placeholder="e.g., Got Promoted, Started Masters Degree"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-charcoal dark:text-white mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 dark:focus:ring-teal/50 resize-none"
                  rows={3}
                  placeholder="Tell the story behind this event..."
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-charcoal dark:text-white mb-1.5">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 dark:focus:ring-teal/50"
                />
              </div>

              {/* Category – ComboBox (type-or-select) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-charcoal dark:text-white mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <CategoryComboBox
                  value={formData.category}
                  onChange={(category, icon, color) =>
                    setFormData(prev => ({ ...prev, category, icon, color }))
                  }
                  userId={user?.id}
                  placeholder="Select or type a category..."
                />
                <p className="text-[10px] sm:text-xs text-charcoal/40 dark:text-white/40 mt-1">
                  Pick a preset or type your own (e.g. &quot;Spiritual Journey&quot;)
                </p>
              </div>

              {/* Major event checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_major}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_major: e.target.checked }))}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-charcoal/20 dark:border-white/20 text-gold dark:text-teal focus:ring-gold dark:focus:ring-teal"
                />
                <span className="text-xs sm:text-sm font-medium text-charcoal dark:text-white">
                  Mark as major life event ⭐
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 sm:py-2.5 border border-charcoal/20 dark:border-white/20 rounded-lg text-sm font-medium text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 sm:py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                >
                  {editingId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId) }}
        title="Delete this event?"
        message="This will permanently delete this life event. Linked diary entries will not be affected."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EventCard — displays a single life event with linked entries and goals
// ═══════════════════════════════════════════════════════════════════════════════

interface EventCardProps {
  event: LifeEvent
  userCategories: UserCategory[]
  isExpanded: boolean
  linkedEntries: LinkedEntry[]
  loadingEntries: boolean
  onToggleEntries: () => void
  onEdit: () => void
  onDelete: () => void
  // Goal linking
  linkedGoals: LinkedGoal[]
  allGoals: LinkedGoal[]
  showGoalPicker: boolean
  selectedGoalIds: string[]
  onToggleGoalPicker: () => void
  onSelectGoal: (goalId: string) => void
  onLinkGoals: () => void
  onUnlinkGoal: (goalId: string) => void
}

function EventCard({
  event,
  userCategories,
  isExpanded,
  linkedEntries,
  loadingEntries,
  onToggleEntries,
  onEdit,
  onDelete,
  linkedGoals,
  allGoals,
  showGoalPicker,
  selectedGoalIds,
  onToggleGoalPicker,
  onSelectGoal,
  onLinkGoals,
  onUnlinkGoal,
}: EventCardProps) {
  const display = getCategoryDisplay(event.category, userCategories)
  const date = new Date(event.event_date)
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const alreadyLinkedIds = new Set(linkedGoals.map(g => g.id))
  const availableGoals = allGoals.filter(g => !alreadyLinkedIds.has(g.id))

  return (
    <div
      className={`group vintage-card rounded-xl border transition-all ${
        event.is_major
          ? 'border-gold/30 dark:border-teal/30 shadow-md ring-1 ring-gold/10 dark:ring-teal/10'
          : 'border-charcoal/10 dark:border-white/10 shadow-sm'
      } hover:shadow-md`}
    >
      {/* ── Card header ───────────────────────────────────────────────── */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          {/* Icon circle */}
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 text-base sm:text-lg"
            style={{ backgroundColor: `${display.color}20` }}
          >
            {display.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-charcoal dark:text-white leading-snug">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] sm:text-xs text-charcoal/50 dark:text-white/50 flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {dateStr}
                  </span>
                  <span
                    className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                    style={{ backgroundColor: `${display.color}20`, color: display.color }}
                  >
                    {display.label}
                  </span>
                  {event.is_major && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal text-[10px] sm:text-xs font-bold rounded">
                      ⭐ Major
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons — always visible on mobile */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={onEdit} className="p-1.5 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors" title="Edit event">
                  <Pencil className="w-3.5 h-3.5 text-charcoal/40 dark:text-white/40" />
                </button>
                <button onClick={onDelete} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete event">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p className="mt-1.5 text-xs sm:text-sm text-charcoal/60 dark:text-white/60 line-clamp-2">
                {event.description}
              </p>
            )}

            {/* ── Action row: entries toggle + goal chips ─────────────── */}
            <div className="mt-2.5 flex flex-col gap-2">
              {/* Linked entries toggle */}
              <button
                onClick={onToggleEntries}
                className="self-start flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gold dark:text-teal hover:opacity-80 transition-opacity"
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />
                }
                {event.related_entries > 0
                  ? `${event.related_entries} linked entr${event.related_entries === 1 ? 'y' : 'ies'}`
                  : 'No linked entries'
                }
              </button>

              {/* ── Goal chips row ────────────────────────────────────── */}
              {(linkedGoals.length > 0 || allGoals.length > 0) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {linkedGoals.map(goal => (
                    <span
                      key={goal.id}
                      className="inline-flex items-center gap-1 pl-1.5 pr-1 sm:pl-2 sm:pr-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs rounded-full border border-emerald-200/50 dark:border-emerald-700/30"
                    >
                      <Target className="w-2.5 h-2.5 shrink-0" />
                      <span className="max-w-[80px] sm:max-w-[120px] truncate">{goal.title}</span>
                      {goal.is_completed && <span className="text-[10px]">✅</span>}
                      <button
                        onClick={() => onUnlinkGoal(goal.id)}
                        className="ml-0.5 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        title={`Unlink "${goal.title}"`}
                      >
                        <X className="w-2.5 h-2.5 text-emerald-400 hover:text-red-400" />
                      </button>
                    </span>
                  ))}

                  {/* +Link Goal button */}
                  <div className="relative">
                    <button
                      onClick={onToggleGoalPicker}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full border transition-colors ${
                        showGoalPicker
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400'
                          : 'border-dashed border-charcoal/20 dark:border-white/20 text-charcoal/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600'
                      }`}
                      title="Link this event to a goal you're working towards"
                    >
                      <Target className="w-2.5 h-2.5" />
                      <span>{linkedGoals.length > 0 ? '+' : 'Link Goal'}</span>
                    </button>

                    {/* ── Goal picker dropdown ─────────────────────── */}
                    {showGoalPicker && (
                      <div
                        className="absolute left-0 top-full mt-1 z-20 w-56 sm:w-64 vintage-card rounded-lg shadow-xl border border-charcoal/10 dark:border-white/10 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-2 border-b border-charcoal/5 dark:border-white/5">
                          <p className="text-[10px] sm:text-xs font-bold text-charcoal/60 dark:text-white/60">
                            Link to a Goal
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-charcoal/40 dark:text-white/40 mt-0.5">
                            Connect this event to goals it relates to
                          </p>
                        </div>

                        {availableGoals.length === 0 ? (
                          <div className="px-3 py-4 text-center">
                            <Target className="w-5 h-5 mx-auto text-charcoal/20 dark:text-white/20 mb-1" />
                            <p className="text-[10px] sm:text-xs text-charcoal/40 dark:text-white/40">
                              {allGoals.length === 0
                                ? 'No goals yet. Create goals in the Goals page first.'
                                : 'All goals already linked!'}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-40 overflow-y-auto py-1">
                              {availableGoals.map(goal => {
                                const selected = selectedGoalIds.includes(goal.id)
                                return (
                                  <button
                                    key={goal.id}
                                    onClick={() => onSelectGoal(goal.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                                      selected
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                        : 'hover:bg-charcoal/5 dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                      selected
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-charcoal/20 dark:border-white/20'
                                    }`}>
                                      {selected && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-charcoal dark:text-white truncate flex-1">
                                      {goal.title}
                                    </span>
                                    {goal.is_completed && (
                                      <span className="text-[10px] text-emerald-500 shrink-0">Done</span>
                                    )}
                                    {!goal.is_completed && goal.progress > 0 && (
                                      <span className="text-[10px] text-charcoal/40 dark:text-white/40 shrink-0">
                                        {goal.progress}%
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Footer: Cancel / Link */}
                            <div className="flex items-center justify-between px-3 py-2 border-t border-charcoal/5 dark:border-white/5 bg-charcoal/[0.02] dark:bg-white/[0.02]">
                              <button
                                onClick={onToggleGoalPicker}
                                className="text-[10px] sm:text-xs text-charcoal/50 dark:text-white/50 hover:text-charcoal dark:hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={onLinkGoals}
                                disabled={selectedGoalIds.length === 0}
                                className="px-3 py-1 text-[10px] sm:text-xs font-bold bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                Link{selectedGoalIds.length > 0 ? ` (${selectedGoalIds.length})` : ''}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded: linked entries list ─────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-charcoal/5 dark:border-white/5 bg-charcoal/[0.02] dark:bg-white/[0.02] rounded-b-xl">
          {loadingEntries ? (
            <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-charcoal/40 dark:text-white/40">
              Loading linked entries…
            </div>
          ) : linkedEntries.length > 0 ? (
            <div className="p-2.5 sm:p-3 space-y-0.5 sm:space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-charcoal/40 dark:text-white/40 uppercase tracking-wider mb-1.5 px-1">
                Linked Entries
              </p>
              {linkedEntries.map(entry => {
                const entryDate = new Date(entry.entry_date)
                return (
                  <Link
                    key={entry.id}
                    href={`/app/entry/${entry.id}`}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors group/entry"
                  >
                    <span className="text-[10px] sm:text-xs text-charcoal/50 dark:text-white/50 shrink-0 tabular-nums">
                      {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs sm:text-sm text-charcoal dark:text-white truncate flex-1">
                      {entry.title || 'Untitled'}
                    </span>
                    {entry.mood && <span className="text-sm shrink-0">{entry.mood}</span>}
                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-charcoal/20 dark:text-white/20 opacity-0 group-hover/entry:opacity-100 transition-opacity shrink-0" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-charcoal/40 dark:text-white/40">
              No entries linked yet — link entries from the entry detail page.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
