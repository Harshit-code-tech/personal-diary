'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { stripHtmlTags } from '@/lib/sanitize'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Edit, Trash2, Calendar, FileText, Star, Plus, X, Clock, TrendingUp } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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
  updated_at: string
}

interface Entry {
  id: string
  title: string
  content: string
  entry_date: string
  mood: string | null
  word_count: number
}

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteStory, setConfirmDeleteStory] = useState(false)
  const [showAddEntries, setShowAddEntries] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const fetchStoryData = useCallback(async () => {
    try {
      // Fetch story details
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', params.id)
        .single()

      if (storyError) throw storyError
      setStory(storyData)

      // Fetch entries in this story
      const { data: storyEntriesData, error: storyEntriesError } = await supabase
        .from('story_entries')
        .select(`
          entries (
            id, title, content, entry_date, mood, word_count
          )
        `)
        .eq('story_id', params.id)
        .order('order_index')

      if (storyEntriesError) throw storyEntriesError

      const entriesData = storyEntriesData
        ?.map(se => se.entries)
        .filter(Boolean)
        .flat() || []

      setEntries(entriesData)

      // Fetch all user entries for adding
      const { data: allEntriesData, error: allEntriesError } = await supabase
        .from('entries')
        .select('id, title, content, entry_date, mood, word_count')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false })

      if (!allEntriesError && allEntriesData) {
        // Filter out entries already in this story
        const entryIds = new Set(entriesData.map((e: any) => e.id))
        setAllEntries(allEntriesData.filter(e => !entryIds.has(e.id)))
      }
    } catch (error) {
      console.error('Error fetching story data:', error)
      router.push('/app/stories')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id, user?.id, router])

  useEffect(() => {
    if (user) {
      fetchStoryData()
    }
  }, [user, params.id, fetchStoryData])

  const toggleFavorite = async () => {
    if (!story) return

    try {
      const { error } = await supabase
        .from('stories')
        .update({ is_favorite: !story.is_favorite })
        .eq('id', params.id)

      if (error) throw error

      setStory({ ...story, is_favorite: !story.is_favorite })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast.success('Story deleted successfully!')
      router.push('/app/stories')
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story. Please try again.')
      setDeleting(false)
    }
  }

  const addEntriesToStory = async () => {
    if (selectedEntries.length === 0) return

    try {
      const links = selectedEntries.map((entryId, index) => ({
        story_id: params.id,
        entry_id: entryId,
        order_index: entries.length + index,
      }))

      const { error } = await supabase
        .from('story_entries')
        .insert(links)

      if (error) throw error

      setShowAddEntries(false)
      setSelectedEntries([])
      fetchStoryData()
      toast.success('Entries added to story successfully!')
    } catch (error) {
      console.error('Error adding entries:', error)
      toast.error('Failed to add entries to story. Please try again.')
    }
  }

  const removeEntryFromStory = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('story_entries')
        .delete()
        .eq('story_id', params.id)
        .eq('entry_id', entryId)

      if (error) throw error

      fetchStoryData()
    } catch (error) {
      console.error('Error removing entry:', error)
    }
  }

  const getPreview = (content: string) => {
    const text = stripHtmlTags(content)
    return text.length > 120 ? text.slice(0, 120) + '...' : text
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
        return 'bg-charcoal/10 dark:bg-white/10'
    }
  }

  const totalWords = entries.reduce((sum, entry) => sum + entry.word_count, 0)
  const dateRange = entries.length > 0
    ? `${new Date(entries[entries.length - 1].entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(entries[0].entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'No entries yet'

  const filteredAvailableEntries = allEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading story...</div>
      </div>
    )
  }

  if (!story) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href="/app/stories"
            className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Stories</span>
          </Link>

          <div className="flex gap-3">
            <Link
              href={`/app/stories/${params.id}/edit`}
              className="p-3 border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
            >
              <Edit className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
            </Link>

            <button
              onClick={toggleFavorite}
              className="p-3 border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
            >
              <Star
                className={`w-5 h-5 ${
                  story.is_favorite
                    ? 'fill-gold text-gold dark:fill-teal dark:text-teal'
                    : 'text-charcoal/60 dark:text-white/60'
                }`}
              />
            </button>
            <Link
              href={`/app/stories/${params.id}/edit`}
              className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              <Edit className="w-5 h-5" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Story Header */}
        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Cover */}
          {story.cover_image_url ? (
            <div className="h-64 md:h-80 overflow-hidden">
              <Image
                src={story.cover_image_url}
                alt={story.title}
                width={1200}
                height={320}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="h-64 md:h-80 flex items-center justify-center"
              style={{ backgroundColor: story.color }}
            >
              <span className="text-8xl">{story.icon}</span>
            </div>
          )}

          {/* Info */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-teal mb-3">
                  {story.title}
                </h1>
                {story.description && (
                  <p className="text-charcoal/70 dark:text-white/70 text-lg leading-relaxed mb-4">
                    {story.description}
                  </p>
                )}
              </div>
            </div>

            {/* Meta Tags */}
            <div className="flex flex-wrap gap-3 mb-6">
              {story.category && (
                <span className="px-4 py-2 bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white rounded-full text-sm font-medium">
                  {story.category}
                </span>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
              </span>
              {story.start_date && (
                <span className="px-4 py-2 bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white rounded-full text-sm font-medium">
                  📅 {new Date(story.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {story.end_date && ` - ${new Date(story.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                </span>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-charcoal/10 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2 text-charcoal/60 dark:text-white/60 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Entries</span>
                </div>
                <div className="text-3xl font-bold text-charcoal dark:text-white">{entries.length}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-charcoal/60 dark:text-white/60 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total Words</span>
                </div>
                <div className="text-3xl font-bold text-charcoal dark:text-white">{totalWords.toLocaleString()}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-charcoal/60 dark:text-white/60 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Date Range</span>
                </div>
                <div className="text-sm font-medium text-charcoal dark:text-white">{dateRange}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-charcoal/60 dark:text-white/60 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Duration</span>
                </div>
                <div className="text-sm font-medium text-charcoal dark:text-white">
                  {entries.length > 0 ? `${Math.ceil((new Date(entries[0].entry_date).getTime() - new Date(entries[entries.length - 1].entry_date).getTime()) / (1000 * 60 * 60 * 24))} days` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entries Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-teal">
            Story Entries
          </h2>
          <button
            onClick={() => setShowAddEntries(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-medium hover:opacity-90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Entries
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-charcoal/20 dark:text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-2">
              No Entries Yet
            </h3>
            <p className="text-charcoal/60 dark:text-white/60 mb-6">
              Add diary entries to build your story timeline.
            </p>
            <button
              onClick={() => setShowAddEntries(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Your First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-graphite rounded-lg shadow-sm p-6 hover:shadow-md transition-all border border-charcoal/10 dark:border-white/10 group"
              >
                <div className="flex items-start justify-between">
                  <Link href={`/app/entry/${entry.id}`} className="flex-1">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-charcoal/40 dark:text-white/40 text-sm font-medium min-w-[100px]">
                        {new Date(entry.entry_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors mb-2">
                          {entry.title}
                        </h3>
                        {entry.mood && (
                          <span className="inline-block px-3 py-1 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium mb-2">
                            {entry.mood}
                          </span>
                        )}
                        <p className="text-charcoal/70 dark:text-white/70 text-sm">
                          {getPreview(entry.content)}
                        </p>
                        <div className="text-xs text-charcoal/50 dark:text-white/50 mt-2">
                          {entry.word_count} words
                        </div>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeEntryFromStory(entry.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from story"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Entries Modal */}
      {showAddEntries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-graphite rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-serif font-bold text-charcoal dark:text-teal">
                  Add Entries to Story
                </h3>
                <button
                  onClick={() => {
                    setShowAddEntries(false)
                    setSelectedEntries([])
                    setSearchQuery('')
                  }}
                  className="p-2 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full px-4 py-2 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              />
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {filteredAvailableEntries.length === 0 ? (
                <p className="text-center text-charcoal/60 dark:text-white/60 py-8">
                  {searchQuery ? 'No entries found' : 'All entries are already in this story'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex items-start gap-3 p-4 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntries([...selectedEntries, entry.id])
                          } else {
                            setSelectedEntries(selectedEntries.filter(id => id !== entry.id))
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-charcoal dark:text-white">{entry.title}</div>
                        <div className="text-sm text-charcoal/60 dark:text-white/60">
                          {new Date(entry.entry_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowAddEntries(false)
                  setSelectedEntries([])
                  setSearchQuery('')
                }}
                className="flex-1 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEntriesToStory}
                disabled={selectedEntries.length === 0}
                className="flex-1 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {selectedEntries.length > 0 ? `${selectedEntries.length} ` : ''}Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete story dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteStory}
        onClose={() => setConfirmDeleteStory(false)}
        onConfirm={() => {
          handleDelete()
          setConfirmDeleteStory(false)
        }}
        title="Delete this story?"
        message="This won't delete the diary entries."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        type="danger"
      />
    </div>
  )
}
