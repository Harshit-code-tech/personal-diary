'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSavedSearches } from '@/lib/hooks/useSavedSearches'
import Link from 'next/link'
import { Search, Filter, Calendar, User, BookMarked, X, ArrowLeft, Smile, Save, Star, Trash2, FolderOpen } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import DOMPurify from 'isomorphic-dompurify'
import { useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'

interface SearchResult {
  id: string
  title: string
  content: string
  entry_date: string
  mood: string | null
  word_count: number
  folder_id: string | null
  folder_name: string | null
  folder_icon: string | null
  created_at: string
  updated_at: string
  rank: number
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    mood: '',
    folderId: '',
    personId: '',
    storyId: ''
  })
  const [people, setPeople] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches()

  // Auto-focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Load folder context from URL
  useEffect(() => {
    const folderId = searchParams?.get('folder')
    if (folderId && folders.length > 0) {
      const folder = folders.find(f => f.id === folderId)
      if (folder) {
        setCurrentFolderName(folder.name)
        setFilters(prev => ({ ...prev, folderId }))
      }
    }
  }, [searchParams, folders])

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchFiltersData()
    }
  }, [user])

  const fetchFiltersData = async () => {
    const [peopleRes, storiesRes, foldersRes] = await Promise.all([
      supabase.from('people').select('id, name').eq('user_id', user?.id),
      supabase.from('stories').select('id, title, icon').eq('user_id', user?.id),
      supabase.from('folders').select('id, name, icon').eq('user_id', user?.id).eq('folder_type', 'custom')
    ])
    
    setPeople(peopleRes.data || [])
    setStories(storiesRes.data || [])
    setFolders(foldersRes.data || [])
  }

  const handleSearch = async (searchQuery?: string) => {
    if (!user) return
    
    const queryToSearch = searchQuery || query
    
    // Allow search with just filters (no query text required)
    const hasFilters = filters.dateFrom || filters.dateTo || filters.mood || filters.folderId || filters.personId || filters.storyId
    if (!queryToSearch && !hasFilters) return // Only return if no query AND no filters
    
    // Save to search history (only if there's actual text)
    if (queryToSearch && queryToSearch.trim() && !searchHistory.includes(queryToSearch)) {
      const newHistory = [queryToSearch, ...searchHistory].slice(0, 10) // Keep last 10
      setSearchHistory(newHistory)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    }
    setShowSuggestions(false)
    
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('search_entries', {
        search_query: queryToSearch || '',
        user_id_param: user.id,
        date_from: filters.dateFrom || null,
        date_to: filters.dateTo || null,
        mood_filter: filters.mood || null,
        folder_id_param: filters.folderId || null,
        person_id_param: filters.personId || null,
        story_id_param: filters.storyId || null,
        limit_count: 50,
        offset_count: 0
      })

      if (error) throw error
      
      // Fetch folder data for results with folder_id
      const resultsWithFolders = await Promise.all(
        (data || []).map(async (result: any) => {
          if (result.folder_id) {
            const { data: folderData } = await supabase
              .from('folders')
              .select('name, icon')
              .eq('id', result.folder_id)
              .single()
            return {
              ...result,
              folder_name: folderData?.name || null,
              folder_icon: folderData?.icon || null
            }
          }
          return { ...result, folder_name: null, folder_icon: null }
        })
      )
      
      setResults(resultsWithFolders)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate suggestions based on search history and query
  const generateSuggestions = (inputQuery: string) => {
    if (!inputQuery.trim()) {
      setSuggestions(searchHistory.slice(0, 5))
      return
    }
    
    const filtered = searchHistory.filter(h => 
      h.toLowerCase().includes(inputQuery.toLowerCase())
    ).slice(0, 5)
    setSuggestions(filtered)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    generateSuggestions(value)
    setShowSuggestions(true)
  }

  const extractTextPreview = (html: string, maxLength: number = 200) => {
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })
    const text = sanitized.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    // Split query into words and escape special regex characters
    const words = query.split(/\s+/).filter(w => w.length > 0)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (words.length === 0) return text
    // Create regex with word boundaries for better matching
    const regex = new RegExp(`(${words.join('|')})`, 'gi')
    return text.replace(regex, '<mark class="bg-gold/30 dark:bg-teal/30 px-0.5 rounded">$1</mark>')
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      mood: '',
      folderId: '',
      personId: '',
      storyId: ''
    })
    setCurrentFolderName(null)
  }

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return
    
    saveSearch(saveSearchName, query, filters)
    setSaveSearchName('')
    setShowSavedSearches(false)
    
    // Show success with confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const loadSavedSearch = (search: any) => {
    setQuery(search.query)
    setFilters(search.filters)
    handleSearch(search.query)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/app"
              className="p-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-charcoal dark:text-white">
              Search Your Diary
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-white/40" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search titles, content, moods... (Ctrl+K)"
                aria-label="Search your diary entries - Press Ctrl+K from anywhere"
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-xl text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2">
                    <div className="text-xs font-bold text-charcoal/60 dark:text-white/60 px-3 py-2">
                      {query ? 'Suggestions' : 'Recent Searches'}
                    </div>
                    {(suggestions.length > 0 ? suggestions : searchHistory.slice(0, 5)).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(suggestion)
                          handleSearch(suggestion)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg text-charcoal dark:text-white flex items-center gap-2"
                      >
                        <Search className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
                        <span className="flex-1 truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              aria-label="Execute search"
              className="px-6 py-3 bg-gold dark:bg-teal text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            
            {/* Save Search Button */}
            {query && (
              <button
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                aria-label="Save this search"
                className="p-3 rounded-xl border-2 border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                title="Save this search"
              >
                <Save className="w-5 h-5" />
              </button>
            )}
            
            {/* Saved Searches Button */}
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              aria-label="View saved searches"
              className={`p-3 rounded-xl border-2 transition-colors ${
                savedSearches.length > 0
                  ? 'border-gold dark:border-teal text-gold dark:text-teal'
                  : 'border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white'
              } hover:bg-charcoal/5 dark:hover:bg-white/5`}
              title={`${savedSearches.length} saved searches`}
            >
              <Star className={savedSearches.length > 0 ? 'w-5 h-5 fill-current' : 'w-5 h-5'} />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? 'Hide search filters' : 'Show search filters'}
              aria-expanded={showFilters}
              aria-controls="search-filters"
              className={`p-3 rounded-xl border-2 transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-gold/10 dark:bg-teal/10 border-gold dark:border-teal text-gold dark:text-teal'
                  : 'border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5'
              }`}
            >
              <Filter className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          {/* Save Search Modal */}
          {showSavedSearches && query && (
            <div className="mt-4 p-4 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-3">Save This Search</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
                  placeholder="Enter a name for this search..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleSaveSearch}
                  disabled={!saveSearchName.trim()}
                  className="px-4 py-2 bg-gold dark:bg-teal text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSavedSearches(false)}
                  className="px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Saved Searches List */}
          {showSavedSearches && !query && savedSearches.length > 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 fill-gold dark:fill-teal text-gold dark:text-teal" />
                Saved Searches
              </h3>
              <div className="space-y-2">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center gap-3 p-3 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg group"
                  >
                    <button
                      onClick={() => loadSavedSearch(search)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-charcoal dark:text-white">{search.name}</div>
                      <div className="text-sm text-charcoal/60 dark:text-white/60">
                        {search.query}
                        {Object.values(search.filters).some(v => v) && ' • With filters'}
                      </div>
                    </button>
                    <button
                      onClick={() => deleteSearch(search.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      aria-label={`Delete ${search.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Folder Context */}
          {currentFolderName && (
            <div className="mt-4 flex items-center gap-2 text-sm text-charcoal/60 dark:text-white/60">
              <FolderOpen className="w-4 h-4" />
              <span>Searching in: <span className="font-semibold text-charcoal dark:text-white">{currentFolderName}</span></span>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div 
              id="search-filters"
              className="mt-4 p-4 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10"
              role="region"
              aria-label="Search filters"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-charcoal dark:text-white">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    aria-label="Clear all filters"
                    className="text-sm text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  />
                </div>

                {/* Mood Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    <Smile className="w-4 h-4 inline mr-1" />
                    Mood
                  </label>
                  <select
                    value={filters.mood}
                    onChange={(e) => setFilters({ ...filters, mood: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  >
                    <option value="">All Moods</option>
                    <option value="😊 Happy">😊 Happy</option>
                    <option value="😔 Sad">😔 Sad</option>
                    <option value="😡 Angry">😡 Angry</option>
                    <option value="😰 Anxious">😰 Anxious</option>
                    <option value="😌 Peaceful">😌 Peaceful</option>
                    <option value="🎉 Excited">🎉 Excited</option>
                    <option value="😴 Tired">😴 Tired</option>
                    <option value="💭 Thoughtful">💭 Thoughtful</option>
                  </select>
                </div>

                {/* Person Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Person
                  </label>
                  <select
                    value={filters.personId}
                    onChange={(e) => setFilters({ ...filters, personId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  >
                    <option value="">All People</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Story Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    <BookMarked className="w-4 h-4 inline mr-1" />
                    Story
                  </label>
                  <select
                    value={filters.storyId}
                    onChange={(e) => setFilters({ ...filters, storyId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  >
                    <option value="">All Stories</option>
                    {stories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.icon} {story.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Folder Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    📁 Folder
                  </label>
                  <select
                    value={filters.folderId}
                    onChange={(e) => setFilters({ ...filters, folderId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white"
                  >
                    <option value="">All Folders</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.icon} {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <ListSkeleton count={5} />
        ) : results.length > 0 ? (
          <>
            <div className="mb-6 text-charcoal/60 dark:text-white/60">
              Found {results.length} {results.length === 1 ? 'entry' : 'entries'}
            </div>
            <div className="space-y-4">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/app/entry/${result.id}`}
                  className="block bg-white dark:bg-graphite p-6 rounded-xl shadow-sm border border-charcoal/10 dark:border-white/10 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 
                      className="text-xl font-bold text-charcoal dark:text-white flex-1"
                      dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
                    />
                    {result.mood && (
                      <span className="px-3 py-1 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium">
                        {result.mood}
                      </span>
                    )}
                  </div>

                  <p 
                    className="text-charcoal/70 dark:text-white/70 mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: highlightText(extractTextPreview(result.content, 250), query) }}
                  />

                  <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60">
                    {result.folder_name && (
                      <>
                        <span className="flex items-center gap-1">
                          <span>{result.folder_icon || '📁'}</span>
                          <span>{result.folder_name}</span>
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {new Date(result.entry_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{result.word_count} words</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : query || hasActiveFilters ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto mb-4 text-charcoal/20 dark:text-white/20" />
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-charcoal/60 dark:text-white/60">
              Try adjusting your search query or filters
            </p>
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto mb-4 text-charcoal/20 dark:text-white/20" />
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
              Search your diary
            </h3>
            <p className="text-charcoal/60 dark:text-white/60">
              Enter a search term to find entries, or use filters to narrow down
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
