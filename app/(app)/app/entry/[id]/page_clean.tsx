'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { stripHtmlTags } from '@/lib/sanitize'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react'
import WYSIWYGEditor from '@/components/editor/WYSIWYGEditor'

const moods = ['😊 Happy', '😔 Sad', '😡 Angry', '😰 Anxious', '😌 Peaceful', '🎉 Excited', '😴 Tired', '💭 Thoughtful']

export default function EntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    const text = stripHtmlTags(html)
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
          word_count: wordCount,
        })
        .eq('id', params.id)

      if (error) throw error

      setEditing(false)
      fetchEntry()
    } catch (error) {
      console.error('Error updating entry:', error)
      alert('Failed to update entry')
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

      router.push('/app')
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry')
      setDeleting(false)
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
    </div>
  )
}
