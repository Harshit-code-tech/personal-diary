'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import WYSIWYGEditor from '@/components/editor/WYSIWYGEditor'

const moods = ['😊 Happy', '😔 Sad', '😡 Angry', '😰 Anxious', '😌 Peaceful', '🎉 Excited', '😴 Tired', '💭 Thoughtful']

export default function NewEntryPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

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
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content')
      return
    }

    if (!user) {
      setError('You must be logged in to create entries')
      return
    }

    setSaving(true)
    setError('')

    try {
      const wordCount = calculateWordCount(content)
      const today = new Date().toISOString().split('T')[0]

      const { data, error: insertError } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content,
          mood: mood || null,
          entry_date: today,
          word_count: wordCount,
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/app/entry/${data.id}`)
    } catch (err: any) {
      console.error('Error saving entry:', err)
      setError(err.message || 'Failed to save entry')
      setSaving(false)
    }
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

          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Entry
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry Title"
            className="w-full font-serif text-4xl font-bold text-charcoal dark:text-teal bg-transparent border-none outline-none placeholder:text-charcoal/30 dark:placeholder:text-teal/30 mb-6"
            autoFocus
          />

          {/* Mood Selector */}
          <div className="mb-6">
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
          <div className="mb-6 text-sm text-charcoal/60 dark:text-white/60">
            {new Date().toLocaleDateString('en-US', {
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
          <div className="mt-4 text-sm text-charcoal/60 dark:text-white/60 text-right">
            {calculateWordCount(content)} words
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-gold/10 dark:bg-teal/10 rounded-lg border border-gold/20 dark:border-teal/20">
          <h3 className="font-serif text-lg font-semibold text-charcoal dark:text-teal mb-2">
            💡 Writing Tips
          </h3>
          <ul className="space-y-2 text-sm text-charcoal/70 dark:text-white/70">
            <li>• Write freely - this is your safe space</li>
            <li>• Use the toolbar to format your text and add images</li>
            <li>• Your entry will automatically be organized by date</li>
            <li>• Click Save when you're done - your entry is private</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
