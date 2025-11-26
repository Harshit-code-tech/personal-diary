'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Plus, User, ArrowLeft, Search, Filter, SortAsc, X } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

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
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRelationship, setSelectedRelationship] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'entries'>('name')
  const { user } = useAuth()
  const supabase = createClient()

  const relationships = ['all', 'Family', 'Friend', 'Partner', 'Colleague', 'Mentor', 'Acquaintance', 'Other']

  useEffect(() => {
    if (user) {
      fetchPeople()
    }
  }, [user])

  const fetchPeople = async () => {
    try {
      // Fetch people
      const { data: peopleData, error } = await supabase
        .from('people')
        .select('*')
        .order('name')

      if (error) throw error

      // Fetch entry counts using entry_people junction table
      const peopleWithCounts = await Promise.all(
        (peopleData || []).map(async (person) => {
          const { count: entryCount } = await supabase
            .from('entry_people')
            .select('*', { count: 'exact', head: true })
            .eq('person_id', person.id)

          const { count: memoryCount } = await supabase
            .from('memories')
            .select('*', { count: 'exact', head: true })
            .eq('person_id', person.id)

          return {
            ...person,
            entry_count: entryCount || 0,
            memory_count: memoryCount || 0,
          }
        })
      )

      setPeople(peopleWithCounts)
      setFilteredPeople(peopleWithCounts)
    } catch (error) {
      console.error('Error fetching people:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters whenever search, relationship filter, or sort changes
  useEffect(() => {
    let result = [...people]

    // Search filter
    if (searchQuery) {
      result = result.filter(person =>
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Relationship filter
    if (selectedRelationship !== 'all') {
      result = result.filter(person => person.relationship === selectedRelationship)
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'entries') {
      result.sort((a, b) => (b.entry_count || 0) - (a.entry_count || 0))
    }

    setFilteredPeople(result)
  }, [people, searchQuery, selectedRelationship, sortBy])

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

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link
              href="/app/people/new"
              className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Person
            </Link>
          </div>
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
              placeholder="Search people by name or notes..."
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

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Relationship Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-charcoal/60 dark:text-white/60" />
              <select
                value={selectedRelationship}
                onChange={(e) => setSelectedRelationship(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-lg text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              >
                {relationships.map(rel => (
                  <option key={rel} value={rel}>
                    {rel === 'all' ? 'All Relationships' : rel}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-charcoal/60 dark:text-white/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'entries')}
                className="px-4 py-2 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-lg text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              >
                <option value="name">Sort by Name</option>
                <option value="recent">Recently Added</option>
                <option value="entries">Most Entries</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-sm text-charcoal/60 dark:text-white/60">
              {filteredPeople.length} {filteredPeople.length === 1 ? 'person' : 'people'}
            </div>
          </div>
        </div>

        {/* People Grid */}
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
        ) : filteredPeople.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-20 h-20 mx-auto text-charcoal/20 dark:text-white/20 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-white mb-4">
              No People Found
            </h2>
            <p className="text-charcoal/60 dark:text-white/60 mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to find more people.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedRelationship('all')
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white rounded-lg font-semibold hover:bg-charcoal/20 dark:hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPeople.map((person) => (
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
