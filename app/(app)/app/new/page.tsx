'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Users, X, FileText } from 'lucide-react'
import WYSIWYGEditor from '@/components/editor/WYSIWYGEditor'
import TemplateModal from '@/components/templates/TemplateModal'

const moods = ['😊 Happy', '😔 Sad', '😡 Angry', '😰 Anxious', '😌 Peaceful', '🎉 Excited', '😴 Tired', '💭 Thoughtful']

interface Person {
  id: string
  name: string
  avatar_url: string | null
}

export default function NewEntryPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Pre-fill date from URL parameter (from calendar)
    const dateParam = searchParams.get('date')
    if (dateParam) {
      setEntryDate(dateParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchPeople()
    }
  }, [user])

  const fetchPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, name, avatar_url')
        .eq('user_id', user?.id)
        .order('name')

      if (error) throw error
      setPeople(data || [])
    } catch (err) {
      console.error('Error fetching people:', err)
    }
  }

  const togglePerson = (personId: string) => {
    setSelectedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }

  const handleTemplateSelect = (template: any) => {
    if (template.content_template) {
      setContent(template.content_template)
    }
    if (template.name !== 'Blank' && !title) {
      setTitle(`${template.name} - ${new Date().toLocaleDateString()}`)
    }
    setShowTemplates(false)
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

      // Auto-create date folder (prevents duplicates!)
      const { data: folderData, error: folderError } = await supabase
        .rpc('get_or_create_date_folder', {
          p_user_id: user.id,
          p_date: entryDate || new Date().toISOString().split('T')[0]
        })

      if (folderError) {
        console.error('Folder creation error:', folderError)
        // Continue anyway - entry can exist without folder
      }

      const { data, error: insertError } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content,
          mood: mood || null,
          entry_date: entryDate,
          word_count: wordCount,
          folder_id: folderData || null, // Auto-assign to date folder
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Link selected people to this entry
      if (selectedPeople.length > 0) {
        const peopleLinks = selectedPeople.map(personId => ({
          entry_id: data.id,
          person_id: personId,
        }))

        const { error: linkError } = await supabase
          .from('entry_people')
          .insert(peopleLinks)

        if (linkError) {
          console.error('Error linking people:', linkError)
          // Don't throw - entry is saved, just log the error
        }
      }

      router.push(`/app/entry/${data.id}`)
    } catch (err: any) {
      console.error('Error saving entry:', err)
      setError(err.message || 'Failed to save entry')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-midnight/70 border-b border-gold/20 dark:border-teal/20 shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Diary</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-charcoal text-charcoal dark:text-white rounded-lg font-medium hover:shadow-md transition-all border border-charcoal/10 dark:border-white/10"
            >
              <FileText className="w-4 h-4" />
              Templates
            </button>

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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl p-8 border border-gold/10 dark:border-teal/20">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry Title"
            className="w-full font-serif text-4xl font-bold text-charcoal dark:text-teal bg-transparent border-none outline-none placeholder:text-charcoal/30 dark:placeholder:text-teal/30 mb-6 focus:placeholder:text-charcoal/50 dark:focus:placeholder:text-teal/50 transition-colors"
            autoFocus
          />

          {/* People Selector */}
          {people.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Who is this entry about?
              </label>
              <div className="flex flex-wrap gap-2">
                {people.map((person) => {
                  const isSelected = selectedPeople.includes(person.id)
                  return (
                    <button
                      key={person.id}
                      onClick={() => togglePerson(person.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight shadow-lg scale-105'
                          : 'bg-white dark:bg-charcoal/50 text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10 hover:border-gold/30 dark:hover:border-teal/30 hover:scale-105'
                      }`}
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
                      {isSelected && <X className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Entry Date */}
          <div className="mb-6">
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

      {/* Template Modal */}
      {showTemplates && (
        <TemplateModal
          onClose={() => setShowTemplates(false)}
          onSelect={handleTemplateSelect}
        />
      )}
    </div>
  )
}
