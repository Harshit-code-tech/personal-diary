'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Users, X, FileText, Calendar } from 'lucide-react'
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
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/app"
            className="group flex items-center gap-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-bold">Back to Diary</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-charcoal text-charcoal dark:text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 border border-charcoal/10 dark:border-white/10 hover:border-gold/40 dark:hover:border-teal/40 hover:scale-105"
            >
              <FileText className="w-4 h-4 group-hover:text-gold dark:group-hover:text-teal transition-colors" />
              Templates
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-bold hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
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

        <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl p-8 md:p-12 border border-gold/10 dark:border-teal/20">
          {/* Title Input */}
          <div className="group mb-8">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full font-serif text-4xl md:text-5xl font-bold text-charcoal dark:text-teal bg-transparent border-none outline-none placeholder:text-charcoal/20 dark:placeholder:text-teal/20 mb-2 focus:placeholder:text-charcoal/40 dark:focus:placeholder:text-teal/40 transition-all"
              autoFocus
            />
            <div className="h-1 bg-gradient-to-r from-gold via-gold/50 to-transparent dark:from-teal dark:via-teal/50 dark:to-transparent rounded-full transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500"></div>
          </div>

          {/* People Selector */}
          {people.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-400/5 dark:to-transparent rounded-xl border border-blue-500/10 dark:border-blue-400/10">
              <label className="block text-sm font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg">
                  <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                Who is this entry about?
              </label>
              <div className="flex flex-wrap gap-3">
                {people.map((person) => {
                  const isSelected = selectedPeople.includes(person.id)
                  return (
                    <button
                      key={person.id}
                      onClick={() => togglePerson(person.id)}
                      className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white shadow-xl scale-105 ring-2 ring-blue-500/30'
                          : 'bg-white dark:bg-charcoal text-charcoal dark:text-white hover:bg-blue-500/10 dark:hover:bg-blue-400/10 border border-charcoal/10 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 hover:scale-105 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.name}
                          className={`w-6 h-6 rounded-full object-cover ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                        />
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-white/20' : 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-500 dark:text-blue-400'
                        }`}>
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <span>{person.name}</span>
                      {isSelected && <X className="w-4 h-4 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Entry Date */}
          <div className="mb-8 flex items-center gap-4">
            <label className="text-sm font-bold text-charcoal dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Entry Date
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="px-4 py-2.5 bg-[#FFF5E6] dark:bg-midnight border-2 border-charcoal/10 dark:border-white/10 rounded-xl text-charcoal dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent transition-all"
            />
          </div>

          {/* Mood Selector */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-charcoal dark:text-white mb-4">
              How are you feeling?
            </label>
            <div className="flex flex-wrap gap-3">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    mood === m
                      ? 'bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight shadow-xl scale-110'
                      : 'bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white hover:bg-charcoal/10 dark:hover:bg-white/10 hover:scale-105 shadow-sm hover:shadow-md'
                  }`}
                >
                  {m}
                </button>
              ))}
              {mood && (
                <button
                  onClick={() => setMood('')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-105"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Date Display */}
          <div className="mb-6 px-4 py-3 bg-gradient-to-r from-gold/5 to-transparent dark:from-teal/5 dark:to-transparent rounded-xl border-l-4 border-gold dark:border-teal">
            <div className="text-sm font-bold text-charcoal/80 dark:text-white/80">
              📅 {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* WYSIWYG Editor */}
          <div className="border-2 border-charcoal/10 dark:border-white/10 rounded-xl overflow-hidden hover:border-gold/30 dark:hover:border-teal/30 transition-all duration-300 focus-within:border-gold/50 dark:focus-within:border-teal/50 focus-within:shadow-xl">
            <WYSIWYGEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
            />
          </div>

          {/* Word Count */}
          <div className="mt-4 px-4 py-2 bg-charcoal/5 dark:bg-white/5 rounded-lg text-sm font-bold text-charcoal/60 dark:text-white/60 text-right">
            ✍️ {calculateWordCount(content)} words
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-8 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent dark:from-teal/10 dark:via-teal/5 dark:to-transparent rounded-2xl border-2 border-gold/20 dark:border-teal/20 shadow-lg">
          <h3 className="font-serif text-xl font-bold text-charcoal dark:text-teal mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Writing Tips
          </h3>
          <ul className="space-y-3 text-sm text-charcoal/80 dark:text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-gold dark:text-teal font-bold">✓</span>
              <span><strong>Write freely</strong> - this is your safe space to express yourself</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold dark:text-teal font-bold">✓</span>
              <span><strong>Format easily</strong> - use the toolbar to style text and add images</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold dark:text-teal font-bold">✓</span>
              <span><strong>Auto-organized</strong> - entries are automatically sorted by date</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold dark:text-teal font-bold">✓</span>
              <span><strong>Private & secure</strong> - only you can see your entries</span>
            </li>
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
