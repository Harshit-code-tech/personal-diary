'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Plus, ArrowLeft, BookOpen, Calendar, FileText, Star, Archive, Search, Filter, X } from 'lucide-react'

interface Story {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  icon: string
  color: string
  start_date: string | null
  end_date: string | null
  status: 'ongoing' | 'completed' | 'archived'
  category: string | null
  is_favorite: boolean
  created_at: string
  entry_count?: number
  total_words?: number
}

const categories = ['All', 'Trip', 'Project', 'Life Event', 'Hobby', 'Relationship', 'Career', 'Other']
const statuses = ['all', 'ongoing', 'completed', 'archived']

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [filteredStories, setFilteredStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchStories()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [stories, searchQuery, selectedCategory, selectedStatus])

  const fetchStories = async () => {
    try {
      // Fetch stories with entry counts
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_entries (count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data
      const storiesWithCounts = data?.map(story => ({
        ...story,
        entry_count: story.story_entries?.[0]?.count || 0,
      })) || []

      setStories(storiesWithCounts)
      setFilteredStories(storiesWithCounts)
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...stories]

    // Search filter
    if (searchQuery) {
      result = result.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(story => story.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter(story => story.status === selectedStatus)
    }

    setFilteredStories(result)
  }

  const toggleFavorite = async (storyId: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ is_favorite: !currentFavorite })
        .eq('id', storyId)

      if (error) throw error

      // Update local state
      setStories(stories.map(story =>
        story.id === storyId ? { ...story, is_favorite: !currentFavorite } : story
      ))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
      default:
        return 'bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '🔄'
      case 'completed':
        return '✅'
      case 'archived':
        return '📦'
      default:
        return '📖'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading stories...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Diary</span>
            </Link>
            <div className="h-6 w-px bg-charcoal/20 dark:bg-white/20" />
            <h1 className="text-2xl font-serif font-bold text-charcoal dark:text-teal flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              My Stories
            </h1>
          </div>

          <Link
            href="/app/stories/new"
            className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Story
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories by title or description..."
              className="w-full pl-12 pr-12 py-4 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-charcoal/60 dark:text-white/60" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-charcoal/60 dark:text-white/60" />
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-md'
                      : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-charcoal/10 dark:hover:bg-white/10 border border-charcoal/20 dark:border-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-charcoal/60 dark:text-white/60">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-lg text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-sm text-charcoal/60 dark:text-white/60">
              {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 mx-auto text-charcoal/20 dark:text-white/20 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-white mb-4">
              No Stories Yet
            </h2>
            <p className="text-charcoal/60 dark:text-white/60 mb-8 max-w-md mx-auto">
              Create stories to organize your diary entries into meaningful narratives. Perfect for trips, projects, or life events.
            </p>
            <Link
              href="/app/stories/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Your First Story
            </Link>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-20 h-20 mx-auto text-charcoal/20 dark:text-white/20 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-white mb-4">
              No Stories Found
            </h2>
            <p className="text-charcoal/60 dark:text-white/60 mb-8">
              Try adjusting your filters to find more stories.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setSelectedStatus('all')
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white rounded-lg font-semibold hover:bg-charcoal/20 dark:hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white dark:bg-graphite rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-charcoal/10 dark:border-white/10 overflow-hidden group"
              >
                {/* Cover Image or Color */}
                {story.cover_image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div
                    className="h-48 flex items-center justify-center"
                    style={{ backgroundColor: story.color }}
                  >
                    <span className="text-6xl">{story.icon}</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Header with Favorite */}
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/app/stories/${story.id}`}
                      className="flex-1"
                    >
                      <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors line-clamp-2">
                        {story.title}
                      </h3>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleFavorite(story.id, story.is_favorite)
                      }}
                      className="p-1 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          story.is_favorite
                            ? 'fill-gold text-gold dark:fill-teal dark:text-teal'
                            : 'text-charcoal/40 dark:text-white/40'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Description */}
                  {story.description && (
                    <p className="text-charcoal/70 dark:text-white/70 text-sm mb-4 line-clamp-2">
                      {story.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-4 text-xs text-charcoal/60 dark:text-white/60">
                    {story.category && (
                      <span className="px-2 py-1 bg-charcoal/10 dark:bg-white/10 rounded">
                        {story.category}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded ${getStatusColor(story.status)}`}>
                      {getStatusIcon(story.status)} {story.status}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60 pt-4 border-t border-charcoal/10 dark:border-white/10">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {story.entry_count || 0}
                    </span>
                    {story.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(story.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
