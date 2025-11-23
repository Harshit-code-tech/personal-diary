'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Save, X, Users, BookMarked, Plus } from 'lucide-react'
import WYSIWYGEditor from '@/components/editor/WYSIWYGEditor'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

const moods = ['😊 Happy', '😔 Sad', '😡 Angry', '😰 Anxious', '😌 Peaceful', '🎉 Excited', '😴 Tired', '💭 Thoughtful']

export default function EntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [linkedPeople, setLinkedPeople] = useState<any[]>([])
  const [linkedStories, setLinkedStories] = useState<any[]>([])
  const [showAddStories, setShowAddStories] = useState(false)
  const [allStories, setAllStories] = useState<any[]>([])
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchEntry()
    }
  }, [user, params.id])

  const fetchEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setEntry(data)
      setTitle(data.title)
      setContent(data.content)
      setMood(data.mood || '')
      setEntryDate(data.entry_date || '')

      // Fetch linked people
      const { data: peopleData, error: peopleError } = await supabase
        .from('entry_people')
        .select(`
          people (
            id, name, avatar_url, relationship
          )
        `)
        .eq('entry_id', params.id)

      if (!peopleError && peopleData) {
        setLinkedPeople(peopleData.map(ep => ep.people).filter(Boolean))
      }

      // Fetch linked stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('story_entries')
        .select(`
          stories (
            id, title, icon, color, status
          )
        `)
        .eq('entry_id', params.id)

      if (!storiesError && storiesData) {
        setLinkedStories(storiesData.map(se => se.stories).filter(Boolean))
      }

      // Fetch all user stories for adding
      const { data: allStoriesData, error: allStoriesError } = await supabase
        .from('stories')
        .select('id, title, icon, color')
        .eq('user_id', user?.id)

      if (!allStoriesError && allStoriesData) {
        const storyIds = new Set(storiesData?.map((s: any) => s.stories?.id).filter(Boolean))
        setAllStories(allStoriesData.filter(s => !storyIds.has(s.id)))
      }
    } catch (error) {
      console.error('Error fetching entry:', error)
      router.push('/app')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('diary-images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const calculateWordCount = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, '').trim()
    return text.split(/\s+/).filter(word => word.length > 0).length
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      const wordCount = calculateWordCount(content)

      const { error } = await supabase
        .from('entries')
        .update({
          title: title.trim(),
          content: content,
          mood: mood || null,
          entry_date: entryDate,
          word_count: wordCount,
        })
        .eq('id', params.id)

      if (error) throw error

      setEditing(false)
      fetchEntry()
      toast.success('Entry updated successfully!')
    } catch (error) {
      console.error('Error updating entry:', error)
      toast.error('Failed to update entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast.success('Entry deleted successfully!')
      router.push('/app')
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry. Please try again.')
      setDeleting(false)
    }
  }

  const addStoriesToEntry = async () => {
    if (selectedStories.length === 0) return

    try {
      const links = selectedStories.map(storyId => ({
        story_id: storyId,
        entry_id: params.id,
      }))

      const { error } = await supabase
        .from('story_entries')
        .insert(links)

      if (error) throw error

      setShowAddStories(false)
      setSelectedStories([])
      fetchEntry()
      toast.success('Added to story successfully!')
    } catch (error) {
      console.error('Error adding to stories:', error)
      toast.error('Failed to add to story. Please try again.')
    }
  }

  const removeFromStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('story_entries')
        .delete()
        .eq('story_id', storyId)
        .eq('entry_id', params.id)

      if (error) throw error

      fetchEntry()
    } catch (error) {
      console.error('Error removing from story:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading entry...</div>
      </div>
    )
  }

  if (!entry) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Diary</span>
          </Link>

          <div className="flex gap-3">
            <ThemeSwitcher />
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(false)
                    setTitle(entry.title)
                    setContent(entry.content)
                    setMood(entry.mood || '')
                  }}
                  className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || !content.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {!editing ? (
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8 space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-teal">
              {entry.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 items-center">
              {entry.mood && (
                <span className="px-4 py-2 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium">
                  {entry.mood}
                </span>
              )}
              <span className="text-sm text-charcoal/60 dark:text-white/60">
                {new Date(entry.entry_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-sm text-charcoal/60 dark:text-white/60">
                • {entry.word_count} words
              </span>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-charcoal/70 dark:text-white/70">
                  🏷️
                </span>
                {entry.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-orange-500/10 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Linked People */}
            {linkedPeople.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-charcoal/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-sm font-medium text-charcoal/70 dark:text-white/70">
                  <Users className="w-4 h-4" />
                  <span>About:</span>
                </div>
                {linkedPeople.map((person: any) => (
                  <Link
                    key={person.id}
                    href={`/app/people/${person.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium hover:bg-gold/20 dark:hover:bg-teal/20 transition-colors"
                  >
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gold/20 dark:bg-teal/20 flex items-center justify-center text-xs">
                        {person.name.charAt(0)}
                      </div>
                    )}
                    <span>{person.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Linked Stories */}
            <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-charcoal/10 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm font-medium text-charcoal/70 dark:text-white/70">
                <BookMarked className="w-4 h-4" />
                <span>Stories:</span>
              </div>
              {linkedStories.length > 0 ? (
                <>
                  {linkedStories.map((story: any) => (
                    <div key={story.id} className="group relative">
                      <Link
                        href={`/app/stories/${story.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-colors"
                        style={{ backgroundColor: `${story.color}20`, color: story.color }}
                      >
                        <span>{story.icon}</span>
                        <span>{story.title}</span>
                      </Link>
                      <button
                        onClick={() => removeFromStory(story.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowAddStories(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-charcoal/30 dark:border-white/30 text-charcoal/60 dark:text-white/60 rounded-full text-sm font-medium hover:border-gold dark:hover:border-teal hover:text-gold dark:hover:text-teal transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Story</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAddStories(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-charcoal/30 dark:border-white/30 text-charcoal/60 dark:text-white/60 rounded-full text-sm font-medium hover:border-gold dark:hover:border-teal hover:text-gold dark:hover:text-teal transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Story</span>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div 
                className="text-charcoal/90 dark:text-white/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8 space-y-6">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry Title"
              className="w-full font-serif text-4xl font-bold text-charcoal dark:text-teal bg-transparent border-none outline-none placeholder:text-charcoal/30 dark:placeholder:text-teal/30"
            />

            {/* Mood Selector */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      mood === m
                        ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-md'
                        : 'bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white hover:bg-charcoal/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
                {mood && (
                  <button
                    onClick={() => setMood('')}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-charcoal/5 dark:bg-white/5 text-charcoal/60 dark:text-white/60 hover:bg-charcoal/10 dark:hover:bg-white/10"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Entry Date */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Entry Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="px-4 py-2 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              />
            </div>

            {/* Date Display */}
            <div className="text-sm text-charcoal/60 dark:text-white/60">
              {new Date(entry.entry_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            {/* WYSIWYG Editor */}
            <div className="border border-charcoal/10 dark:border-white/10 rounded-lg overflow-hidden">
              <WYSIWYGEditor
                content={content}
                onChange={setContent}
                onImageUpload={handleImageUpload}
              />
            </div>

            {/* Word Count */}
            <div className="text-sm text-charcoal/60 dark:text-white/60 text-right">
              {calculateWordCount(content)} words
            </div>
          </div>
        )}
      </main>

      {/* Add to Stories Modal */}
      {showAddStories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-graphite rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-bold text-charcoal dark:text-teal">
                  Add to Stories
                </h3>
                <button
                  onClick={() => {
                    setShowAddStories(false)
                    setSelectedStories([])
                  }}
                  className="p-2 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {allStories.length === 0 ? (
                <div className="text-center py-8">
                  <BookMarked className="w-12 h-12 mx-auto text-charcoal/20 dark:text-white/20 mb-3" />
                  <p className="text-charcoal/60 dark:text-white/60 mb-4">
                    {linkedStories.length > 0
                      ? 'This entry is already in all your stories'
                      : 'No stories yet'}
                  </p>
                  <Link
                    href="/app/stories/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-medium hover:opacity-90 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create a Story
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {allStories.map((story) => (
                    <label
                      key={story.id}
                      className="flex items-center gap-3 p-3 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStories.includes(story.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStories([...selectedStories, story.id])
                          } else {
                            setSelectedStories(selectedStories.filter(id => id !== story.id))
                          }
                        }}
                      />
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: story.color }}
                      >
                        {story.icon}
                      </div>
                      <span className="font-medium text-charcoal dark:text-white">{story.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {allStories.length > 0 && (
              <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setShowAddStories(false)
                    setSelectedStories([])
                  }}
                  className="flex-1 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addStoriesToEntry}
                  disabled={selectedStories.length === 0}
                  className="flex-1 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedStories.length > 0 ? `to ${selectedStories.length}` : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
