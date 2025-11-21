'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Plus, User, ArrowLeft } from 'lucide-react'

interface Person {
  id: string
  name: string
  relationship: string
  avatar_url: string | null
  birthday: string | null
  notes: string | null
  created_at: string
  entry_count?: number
  memory_count?: number
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchPeople()
    }
  }, [user])

  const fetchPeople = async () => {
    try {
      // Fetch people with counts
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          entries:entries(count),
          memories:memories(count)
        `)
        .order('name')

      if (error) throw error

      // Transform data to include counts
      const peopleWithCounts = data?.map(person => ({
        ...person,
        entry_count: person.entries?.[0]?.count || 0,
        memory_count: person.memories?.[0]?.count || 0,
      })) || []

      setPeople(peopleWithCounts)
    } catch (error) {
      console.error('Error fetching people:', error)
    } finally {
      setLoading(false)
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading people...</div>
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
              <User className="w-6 h-6" />
              People
            </h1>
          </div>

          <Link
            href="/app/people/new"
            className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Person
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {people.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-20 h-20 mx-auto text-charcoal/20 dark:text-white/20 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-white mb-4">
              No People Yet
            </h2>
            <p className="text-charcoal/60 dark:text-white/60 mb-8 max-w-md mx-auto">
              Add people you write about in your diary. Track memories, birthdays, and all your entries about them.
            </p>
            <Link
              href="/app/people/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Your First Person
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/app/people/${person.id}`}
                className="bg-white dark:bg-graphite rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105 border border-charcoal/10 dark:border-white/10 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gold/20 dark:border-teal/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gold/10 dark:bg-teal/10 flex items-center justify-center border-4 border-gold/20 dark:border-teal/20">
                        <span className="text-3xl font-bold text-gold dark:text-teal">
                          {getInitials(person.name)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-serif font-bold text-center text-charcoal dark:text-white mb-2 group-hover:text-gold dark:group-hover:text-teal transition-colors">
                    {person.name}
                  </h3>

                  {/* Relationship */}
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium">
                      {person.relationship}
                    </span>
                  </div>

                  {/* Birthday */}
                  {person.birthday && (
                    <div className="text-center text-sm text-charcoal/60 dark:text-white/60 mb-4">
                      🎂 {formatBirthday(person.birthday)}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-center gap-6 pt-4 border-t border-charcoal/10 dark:border-white/10">
                    <div className="text-center">
                      <div className="text-lg font-bold text-charcoal dark:text-white">
                        {person.entry_count}
                      </div>
                      <div className="text-xs text-charcoal/60 dark:text-white/60">
                        {person.entry_count === 1 ? 'Entry' : 'Entries'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-charcoal dark:text-white">
                        {person.memory_count}
                      </div>
                      <div className="text-xs text-charcoal/60 dark:text-white/60">
                        {person.memory_count === 1 ? 'Memory' : 'Memories'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
