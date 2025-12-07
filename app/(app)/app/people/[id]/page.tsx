'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { stripHtmlTags } from '@/lib/sanitize'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Calendar, BookOpen, Heart, TrendingUp, Clock, MessageCircle, Sparkles } from 'lucide-react'

interface Person {
  id: string
  name: string
  relationship: string
  avatar_url: string | null
  birthday: string | null
  notes: string | null
  created_at: string
}

interface Entry {
  id: string
  title: string
  content: string
  entry_date: string
  mood: string | null
  word_count: number
}

interface Memory {
  id: string
  title: string
  description: string
  memory_date: string
  emotions: string[]
  tags: string[]
}

export default function PersonDetailPage({ params }: { params: { id: string } }) {
  const [person, setPerson] = useState<Person | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchPersonData()
    }
  }, [user, params.id])

  const fetchPersonData = async () => {
    try {
      // Fetch person details
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
        .eq('id', params.id)
        .single()

      if (personError) throw personError
      setPerson(personData)

      // Fetch entries linked to this person via entry_people junction table
      const { data: entryPeopleData, error: entryPeopleError } = await supabase
        .from('entry_people')
        .select(`
          entries (
            id, title, content, entry_date, mood, word_count
          )
        `)
        .eq('person_id', params.id)
        .order('created_at', { ascending: false })

      if (entryPeopleError) throw entryPeopleError
      
      // Extract entries from junction table results
      const entriesData = entryPeopleData
        ?.map(ep => ep.entries)
        .filter(Boolean)
        .flat() || []
      
      // Sort by entry_date
      entriesData.sort((a: any, b: any) => 
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      )
      
      setEntries(entriesData)

      // Fetch memories about this person
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('memories')
        .select('*')
        .eq('person_id', params.id)
        .order('memory_date', { ascending: false })

      if (memoriesError && memoriesError.code !== 'PGRST116') {
        console.error('Error fetching memories:', memoriesError)
      }
      setMemories(memoriesData || [])
    } catch (error) {
      console.error('Error fetching person data:', error)
      router.push('/app/people')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${person?.name}? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast.success('Person deleted successfully!')
      router.push('/app/people')
    } catch (error) {
      console.error('Error deleting person:', error)
      toast.error('Failed to delete person. Please try again.')
      setDeleting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatBirthday = (birthday: string | null) => {
    if (!birthday) return null
    const date = new Date(birthday)
    const today = new Date()
    const nextBirthday = new Date(today.getFullYear(), date.getMonth(), date.getDate())
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1)
    }
    
    const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      daysUntil,
    }
  }

  const getPreview = (content: string) => {
    const text = stripHtmlTags(content)
    return text.length > 150 ? text.slice(0, 150) + '...' : text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!person) {
    return null
  }

  const birthdayInfo = formatBirthday(person.birthday)

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href="/app/people"
            className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to People</span>
          </Link>

          <div className="flex gap-3">
            <Link
              href={`/app/people/${params.id}/edit`}
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
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt={person.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gold/20 dark:border-teal/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gold/10 dark:bg-teal/10 flex items-center justify-center border-4 border-gold/20 dark:border-teal/20">
                  <span className="text-5xl font-bold text-gold dark:text-teal">
                    {getInitials(person.name)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-teal mb-3">
                {person.name}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                <span className="px-4 py-2 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium">
                  {person.relationship}
                </span>
                {birthdayInfo && (
                  <span className="px-4 py-2 bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white rounded-full text-sm font-medium">
                    🎂 {birthdayInfo.date} ({birthdayInfo.daysUntil} days away)
                  </span>
                )}
              </div>

              {person.notes && (
                <p className="text-charcoal/70 dark:text-white/70 leading-relaxed mb-6">
                  {person.notes}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-6 border-t border-charcoal/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold dark:text-teal" />
                  <div>
                    <span className="text-2xl font-bold text-charcoal dark:text-white">{entries.length}</span>
                    <span className="text-sm text-charcoal/60 dark:text-white/60 ml-2">
                      {entries.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-gold dark:text-teal" />
                  <div>
                    <span className="text-2xl font-bold text-charcoal dark:text-white">{memories.length}</span>
                    <span className="text-sm text-charcoal/60 dark:text-white/60 ml-2">
                      {memories.length === 1 ? 'Memory' : 'Memories'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entries Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-teal mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Diary Entries
          </h2>
          
          {entries.length === 0 ? (
            <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-8 text-center">
              <p className="text-charcoal/60 dark:text-white/60">
                No diary entries about {person.name} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/app/entry/${entry.id}`}
                  className="block bg-white dark:bg-graphite rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 p-6 border border-charcoal/10 dark:border-white/10 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal transition-colors">
                      {entry.title}
                    </h3>
                    {entry.mood && (
                      <span className="text-2xl">{entry.mood.split(' ')[0]}</span>
                    )}
                  </div>
                  
                  <p className="text-charcoal/70 dark:text-white/70 mb-4 leading-relaxed">
                    {getPreview(entry.content)}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.entry_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{entry.word_count} words</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Memories Section */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-teal mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6" />
            Special Memories
          </h2>
          
          {memories.length === 0 ? (
            <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-8 text-center">
              <p className="text-charcoal/60 dark:text-white/60 mb-4">
                No memories about {person.name} yet.
              </p>
              <p className="text-sm text-charcoal/50 dark:text-white/50">
                Memories feature coming soon!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-white dark:bg-graphite rounded-lg shadow-sm p-6 border border-charcoal/10 dark:border-white/10"
                >
                  <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white mb-2">
                    {memory.title}
                  </h3>
                  <p className="text-charcoal/70 dark:text-white/70 mb-4">
                    {memory.description}
                  </p>
                  <div className="text-sm text-charcoal/60 dark:text-white/60">
                    {new Date(memory.memory_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
