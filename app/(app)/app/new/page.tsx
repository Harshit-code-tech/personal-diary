'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useToast } from '@/components/ui/ToastContainer'
import { entrySchema, formatZodErrors } from '@/lib/validation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save, Loader2, Users, X, FileText, Calendar, Folder, ChevronRight, ChevronDown, Clock, AlertCircle } from 'lucide-react'
import TagInput from '@/components/tags/TagInput'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { useAutoSaveDraft, formatTimeAgo } from '@/lib/hooks/useAutoSaveDraft'
import { stripHtmlTags, countWords } from '@/lib/sanitize'

// Lazy load heavy components
const WYSIWYGEditor = dynamic(() => import('@/components/editor/WYSIWYGEditor'), {
  ssr: false,
  loading: () => (
    <div className="border-2 border-charcoal/10 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-6 text-center text-charcoal/60 dark:text-white/60">
        Loading editor...
      </div>
    </div>
  )
})

const moods = ['😊 Happy', '😔 Sad', '😡 Angry', '😰 Anxious', '😌 Peaceful', '🎉 Excited', '😴 Tired', '💭 Thoughtful', '🤔 Others']

interface Person {
  id: string
  name: string
  avatar_url: string | null
}

export default function NewEntryPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [customMood, setCustomMood] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tags, setTags] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [showFolderSelector, setShowFolderSelector] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get folder parameter early for draft key
  const folderParam = searchParams.get('folder')
  const draftKey = user?.id 
    ? folderParam 
      ? `new-entry-${user.id}-folder-${folderParam}` 
      : `new-entry-${user.id}`
    : 'new-entry'

  // Auto-save draft system (user-specific + folder-specific key)
  const { saveDraft, clearDraft, hasDraft, lastSaved, isDirty } = useAutoSaveDraft({
    key: draftKey,
    autoSaveDelay: 3000, // Auto-save after 3 seconds of inactivity
    onRestore: (draft) => {
      // Restore draft data on mount
      if (draft.title) setTitle(draft.title)
      if (draft.content) setContent(draft.content)
      if (draft.mood) setMood(draft.mood)
      // Don't restore entryDate - always use current date
      if (draft.tags) setTags(draft.tags)
      if (draft.selectedPeople) setSelectedPeople(draft.selectedPeople)
      if (draft.selectedFolders) setSelectedFolders(draft.selectedFolders)
    },
  })

  // Auto-save on content changes
  useEffect(() => {
    if (title || content || mood || tags.length > 0 || selectedPeople.length > 0 || selectedFolders.length > 0) {
      saveDraft({
        title,
        content,
        mood,
        entryDate,
        tags,
        selectedPeople,
        selectedFolders,
      })
    }
  }, [title, content, mood, entryDate, tags, selectedPeople, selectedFolders, saveDraft])

  useEffect(() => {
    // Pre-fill date from URL parameter (from calendar)
    const dateParam = searchParams.get('date')
    if (dateParam) {
      setEntryDate(dateParam)
    }
    
    // Pre-select folder from URL (when clicking from folder view)
    // folderParam already defined at component level
    if (folderParam) {
      setSelectedFolders([folderParam])
    }
  }, [searchParams, folderParam])

  const fetchPeople = useCallback(async () => {
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
  }, [user?.id, supabase])

  const fetchFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name, icon, color, parent_id, is_expanded, sort_order, folder_type')
        .eq('user_id', user?.id)
        .order('sort_order')

      if (error) throw error
      setFolders(data || [])
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }, [user?.id, supabase])

  const fetchPopularTags = useCallback(async () => {
    try {
      // Get all tags from user's entries and count occurrences
      const { data, error } = await supabase
        .from('entries')
        .select('tags')
        .eq('user_id', user?.id)
        .not('tags', 'is', null)

      if (error) throw error
      
      // Flatten and count tags
      const tagCount: Record<string, number> = {}
      data?.forEach((entry: any) => {
        entry.tags?.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      })

      // Sort by frequency and take top 10
      const popular = Object.entries(tagCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag)

      setPopularTags(popular)
    } catch (err) {
      console.error('Error fetching popular tags:', err)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (user) {
      fetchPeople()
      fetchFolders()
      fetchPopularTags()
    }
  }, [user, fetchPeople, fetchFolders, fetchPopularTags])

  const togglePerson = (personId: string) => {
    setSelectedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }



  const handleImageUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      toast.error('Image must be less than 5MB')
      throw new Error('Image too large')
    }

    // Count existing images in content
    const imageCount = (content.match(/<img/g) || []).length
    if (imageCount >= 5) {
      toast.error('Maximum 5 images per entry')
      throw new Error('Too many images')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('diary-images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSave = async () => {
    // Clear previous errors
    setErrors({})

    // Validate input
    const validation = entrySchema.safeParse({
      title: title.trim(),
      content: content.trim(),
      mood: mood || null,
      entry_date: entryDate,
    })

    if (!validation.success) {
      const formattedErrors = formatZodErrors(validation.error)
      setErrors(formattedErrors)
      toast.error('Please check the form for errors')
      return
    }

    if (!user) {
      toast.error('You must be logged in to create entries')
      return
    }

    setSaving(true)

    try {
      const wordCount = countWords(content)
      
      // Use custom mood if "Others" is selected and custom mood is provided
      const finalMood = mood === '🤔 Others' && customMood.trim() 
        ? `🤔 ${customMood.trim()}` 
        : mood || null

      // Entry will be auto-assigned to date folder by trigger
      const { data, error: insertError } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content,
          mood: finalMood,
          entry_date: entryDate,
          word_count: wordCount,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Link to selected folders (in addition to auto date folder)
      if (selectedFolders.length > 0) {
        const folderLinks = selectedFolders.map(folderId => ({
          entry_id: data.id,
          folder_id: folderId,
        }))

        const { error: folderError } = await supabase
          .from('entry_folders')
          .insert(folderLinks)

        if (folderError) {
          console.error('Error linking folders:', folderError)
          // Continue - entry is saved
        }
      }

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

      toast.success('Entry created successfully!')
      clearDraft() // Clear draft after successful save
      router.push(`/app/entry/${data.id}`)
    } catch (err: any) {
      console.error('Error saving entry:', err)
      toast.error(err.message || 'Failed to save entry')
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
            {/* Draft Status Indicator */}
            {hasDraft && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                {isDirty ? (
                  <>
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Saving draft...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Draft saved {formatTimeAgo(lastSaved)}
                    </span>
                  </>
                )}
              </div>
            )}

            <ThemeSwitcher />

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
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-red-800 dark:text-red-200">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl p-8 md:p-12 border border-gold/10 dark:border-teal/20">
          {/* Title Input */}
          <div className="group mb-8">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) {
                  const newErrors = { ...errors }
                  delete newErrors.title
                  setErrors(newErrors)
                }
              }}
              placeholder="What's on your mind?"
              className="w-full font-display text-4xl md:text-5xl font-bold text-charcoal dark:text-teal bg-transparent border-none outline-none placeholder:text-charcoal/20 dark:placeholder:text-teal/20 mb-2 focus:placeholder:text-charcoal/40 dark:focus:placeholder:text-teal/40 transition-all"
              autoFocus
            />
            <div className="h-1 bg-gradient-to-r from-gold via-gold/50 to-transparent dark:from-teal dark:via-teal/50 dark:to-transparent rounded-full transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500"></div>
          </div>

          {/* People Selector */}
          {people.length > 0 && (
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-400/5 dark:to-transparent rounded-xl border border-blue-500/10 dark:border-blue-400/10">
              <label className="block text-xs md:text-sm font-bold font-heading text-charcoal dark:text-white mb-3 md:mb-4 flex items-center gap-2">
                <div className="p-1.5 md:p-2 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg">
                  <Users className="w-3.5 md:w-4 h-3.5 md:h-4 text-blue-500 dark:text-blue-400" />
                </div>
                Who is this entry about?
              </label>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {people.map((person) => {
                  const isSelected = selectedPeople.includes(person.id)
                  return (
                    <button
                      key={person.id}
                      onClick={() => togglePerson(person.id)}
                      className={`group flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white shadow-xl scale-105 ring-2 ring-blue-500/30'
                          : 'bg-white dark:bg-charcoal text-charcoal dark:text-white hover:bg-blue-500/10 dark:hover:bg-blue-400/10 border border-charcoal/10 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 hover:scale-105 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {person.avatar_url ? (
                        <Image
                          src={person.avatar_url}
                          alt={person.name}
                          width={24}
                          height={24}
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

          {/* Folder Selector */}
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-400/5 dark:to-transparent rounded-xl border border-purple-500/10 dark:border-purple-400/10">
            <label className="block text-xs md:text-sm font-bold text-charcoal dark:text-white mb-3 md:mb-4 flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 md:p-2 bg-purple-500/10 dark:bg-purple-400/10 rounded-lg">
                  <Folder className="w-3.5 md:w-4 h-3.5 md:h-4 text-purple-500 dark:text-purple-400" />
                </div>
                <span>Additional Folders</span>
              </div>
              <span className="text-xs font-normal text-charcoal/50 dark:text-white/50 md:ml-auto">
                Auto-saves to date folder{selectedFolders.length > 0 ? ` + ${selectedFolders.length} more` : ''}
              </span>
            </label>
            
            {/* Selected Folders Display */}
            {selectedFolders.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedFolders.map(folderId => {
                  const folder = folders.find(f => f.id === folderId)
                  if (!folder) return null
                  return (
                    <div
                      key={folder.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                    >
                      <span>{folder.icon}</span>
                      <span>{folder.name}</span>
                      <button
                        onClick={() => setSelectedFolders(prev => prev.filter(id => id !== folderId))}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            
            <button
              onClick={() => setShowFolderSelector(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-purple-500/30 dark:border-purple-400/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-500/5 dark:hover:bg-purple-400/5 transition-all"
            >
              <Folder className="w-4 h-4" />
              <span>Select Folders</span>
            </button>
            
            <p className="text-xs text-charcoal/50 dark:text-white/50 mt-3">
              💡 Entry will automatically be saved to its date folder (e.g., &quot;2025 → November → 23&quot;)
            </p>
          </div>

          {/* Entry Date */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
            <label className="text-xs md:text-sm font-bold font-heading text-charcoal dark:text-white flex items-center gap-2">
              <Calendar className="w-3.5 md:w-4 h-3.5 md:h-4" />
              Entry Date
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-[#FFF5E6] dark:bg-midnight border-2 border-charcoal/10 dark:border-white/10 rounded-lg md:rounded-xl text-sm md:text-base text-charcoal dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent transition-all"
            />
          </div>

          {/* Mood Selector */}
          <div className="mb-6 md:mb-8">
            <label className="block text-xs md:text-sm font-bold font-heading text-charcoal dark:text-white mb-3 md:mb-4">
              How are you feeling?
            </label>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMood(m)
                    if (m !== '🤔 Others') {
                      setCustomMood('')
                    }
                  }}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                    mood === m
                      ? 'bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight shadow-xl'
                      : 'bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white hover:bg-charcoal/10 dark:hover:bg-white/10 shadow-sm hover:shadow-md'
                  }`}
                >
                  {m}
                </button>
              ))}
              {mood && (
                <button
                  onClick={() => {
                    setMood('')
                    setCustomMood('')
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:opacity-90"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Custom Mood Input */}
            {mood === '🤔 Others' && (
              <div className="mt-4 animate-slide-down">
                <input
                  type="text"
                  value={customMood}
                  onChange={(e) => setCustomMood(e.target.value)}
                  placeholder="Describe your mood..."
                  className="w-full px-4 py-3 bg-charcoal/5 dark:bg-white/5 border-2 border-gold/20 dark:border-teal/20 rounded-xl text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal transition-all"
                  maxLength={50}
                />
                <p className="mt-2 text-xs text-charcoal/50 dark:text-white/50">
                  {customMood.length}/50 characters
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mb-8 p-6 bg-gradient-to-br from-orange-500/5 to-transparent dark:from-orange-400/5 dark:to-transparent rounded-xl border border-orange-500/10 dark:border-orange-400/10">
            <label className="block text-sm font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 dark:bg-orange-400/10 rounded-lg">
                <span className="text-orange-500 dark:text-orange-400">🏷️</span>
              </div>
              Tags
              <span className="ml-auto text-xs font-normal text-charcoal/50 dark:text-white/50">
                Press Enter to add, Backspace to remove
              </span>
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={popularTags}
              placeholder="Add tags (e.g., work, travel, family)..."
              maxTags={10}
            />
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
            ✍️ {countWords(content)} words
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

      {/* Folder Selector Modal */}
      {showFolderSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-graphite rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-bold text-charcoal dark:text-teal flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Select Folders
                </h3>
                <button
                  onClick={() => setShowFolderSelector(false)}
                  className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-charcoal/60 dark:text-white/60 mt-2">
                Choose additional folders for this entry
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {folders.filter(f => f.folder_type !== 'year' && f.folder_type !== 'month' && f.folder_type !== 'day').length === 0 ? (
                <p className="text-center text-charcoal/50 dark:text-white/50 py-8">
                  No custom folders available. Date folders are auto-assigned.
                </p>
              ) : (
                <div className="space-y-1">
                  {folders
                    .filter(f => !f.parent_id && f.folder_type !== 'year' && f.folder_type !== 'month' && f.folder_type !== 'day')
                    .map(folder => renderFolderTreeItem(folder, 0))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 dark:border-white/10">
              <button
                onClick={() => setShowFolderSelector(false)}
                className="w-full px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Done ({selectedFolders.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function renderFolderTreeItem(folder: any, level: number): React.ReactNode {
    // Skip date-based folders (year, month, day)
    if (folder.folder_type === 'year' || folder.folder_type === 'month' || folder.folder_type === 'day') {
      return null
    }

    const isSelected = selectedFolders.includes(folder.id)
    const hasChildren = folders.some(f => f.parent_id === folder.id && f.folder_type !== 'year' && f.folder_type !== 'month' && f.folder_type !== 'day')
    const isExpanded = expandedFolders.has(folder.id)

    return (
      <div key={folder.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedFolders(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(folder.id)) {
                    newSet.delete(folder.id)
                  } else {
                    newSet.add(folder.id)
                  }
                  return newSet
                })
              }}
              className="p-0.5 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {
                setSelectedFolders(prev =>
                  prev.includes(folder.id)
                    ? prev.filter(id => id !== folder.id)
                    : [...prev, folder.id]
                )
              }}
              className="w-4 h-4 rounded border-2 border-charcoal/30 dark:border-white/30 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-lg">{folder.icon}</span>
            <span className="font-medium text-charcoal dark:text-white">{folder.name}</span>
          </label>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folders
              .filter(f => f.parent_id === folder.id && f.folder_type !== 'year' && f.folder_type !== 'month' && f.folder_type !== 'day')
              .map(child => renderFolderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }
}
