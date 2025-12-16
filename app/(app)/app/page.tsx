'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AppHeader from '@/components/layout/AppHeader'
import FolderNavigation from '@/components/folders/FolderNavigation'
import { Plus, Menu, X, Users, BookMarked, TrendingUp, FileText, Smile, Zap, Type, Star, Trash2 } from 'lucide-react'
import { stripHtmlTags } from '@/lib/sanitize'
import type { Entry, Folder, Stats } from '@/lib/types'

export default function AppPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  // Username state
  const [username, setUsername] = useState<string>('')
  
  // Read folder from URL query parameter
  const [urlFolderId, setUrlFolderId] = useState<string | null>(null)
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const folderId = params.get('folder')
    setUrlFolderId(folderId)
    setSelectedFolderId(folderId)
  }, [])
  const [entries, setEntries] = useState<Entry[]>([])
  const [fetchingEntries, setFetchingEntries] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [folderName, setFolderName] = useState<string>('All Entries')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 20
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEntries: 0,
    totalWords: 0,
    peopleCount: 0,
    storiesCount: 0,
    currentStreak: 0,
  })

  const fetchEntries = useCallback(async () => {
    setFetchingEntries(true)
    try {
      let folderIds = [selectedFolderId]

      // If a folder is selected, get all its descendants too
      if (selectedFolderId) {
        const { data: descendants, error: descError } = await supabase
          .rpc('get_folder_descendants', { p_folder_id: selectedFolderId })

        if (!descError && descendants) {
          folderIds = descendants.map((d: any) => d.folder_id)
        }
      }

      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      // If folder is selected, query through entry_folders junction table
      let entryIds: string[] | null = null
      if (selectedFolderId) {
        const { data: entryFolders, error: efError } = await supabase
          .from('entry_folders')
          .select('entry_id')
          .in('folder_id', folderIds)
        
        if (!efError && entryFolders) {
          entryIds = entryFolders.map(ef => ef.entry_id)
          
          // If no entries in selected folders, return early
          if (entryIds.length === 0) {
            setEntries([])
            setTotalCount(0)
            setHasMore(false)
            setStats({
              totalEntries: 0,
              totalWords: 0,
              peopleCount: 0,
              storiesCount: 0,
              currentStreak: 0,
            })
            setFetchingEntries(false)
            return
          }
        }
      }

      let query = supabase
        .from('entries')
        .select(`
          id, title, content, entry_date, word_count, mood, 
          folder_id, created_at, tags,
          folders!entries_folder_id_fkey (name, icon),
          entry_people (
            people (id, name, avatar_url)
          ),
          story_entries (
            stories (id, title, icon, color)
          )
        `, { count: 'exact' })
        .is('deleted_at', null) // Exclude soft-deleted entries
        .order('entry_date', { ascending: false })
        .range(from, to)

      if (entryIds) {
        query = query.in('id', entryIds)
      }

      if (selectedTag) {
        query = query.contains('tags', [selectedTag])
      }

      const { data, error, count } = await query

      if (error) throw error
      
      if (page === 1) {
        setEntries(data as any || [])
      } else {
        setEntries(prev => [...prev, ...(data as any || [])])
      }
      
      setTotalCount(count || 0)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
      
      // Calculate statistics (only for first page)
      if (page === 1 && data && data.length > 0) {
        const totalWords = data.reduce((sum, entry) => sum + (entry.word_count || 0), 0)
        
        // Count unique people
        const peopleIds = new Set<string>()
        data.forEach(entry => {
          const entryPeople = entry.entry_people as any
          if (Array.isArray(entryPeople)) {
            entryPeople.forEach((ep: any) => {
              if (ep.people?.id) peopleIds.add(ep.people.id)
            })
          }
        })
        
        // Count unique stories
        const storyIds = new Set<string>()
        data.forEach(entry => {
          const storyEntries = entry.story_entries as any
          if (Array.isArray(storyEntries)) {
            storyEntries.forEach((se: any) => {
              if (se.stories?.id) storyIds.add(se.stories.id)
            })
          }
        })
        
        // Calculate writing streak
        const sortedDates = Array.from(new Set(data.map(e => e.entry_date))).sort().reverse()
        let streak = 0
        let checkDate = new Date()
        
        for (let i = 0; i < sortedDates.length; i++) {
          const date = checkDate.toISOString().split('T')[0]
          if (sortedDates.includes(date)) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
        
        setStats({
          totalEntries: data.length,
          totalWords,
          peopleCount: peopleIds.size,
          storiesCount: storyIds.size,
          currentStreak: streak,
        })
      } else {
        setStats({
          totalEntries: 0,
          totalWords: 0,
          peopleCount: 0,
          storiesCount: 0,
          currentStreak: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setFetchingEntries(false)
    }
  }, [selectedFolderId, selectedTag, page, supabase])

  const fetchAllTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('tags')
        .eq('user_id', user?.id)
        .is('deleted_at', null)
        .not('tags', 'is', null)

      if (error) throw error

      // Flatten and count tags
      const tagCount: Record<string, number> = {}
      data?.forEach((entry: any) => {
        entry.tags?.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      })

      // Sort by frequency
      const sortedTags = Object.entries(tagCount)
        .sort(([, a], [, b]) => b - a)
        .map(([tag]) => tag)

      setAllTags(sortedTags)
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }, [user?.id, supabase])

  const fetchUsername = useCallback(async () => {
    try {
      // Get username from user metadata
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.user_metadata?.username) {
        setUsername(authUser.user_metadata.username)
      } else if (authUser?.email) {
        // Fallback to email username
        setUsername(authUser.email.split('@')[0])
      }
    } catch (error) {
      console.error('Error fetching username:', error)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      setPage(1) // Reset to page 1 when folder changes
      setEntries([]) // Clear entries
      fetchEntries()
      fetchAllTags()
      fetchUsername()
    }
  }, [user, selectedFolderId, selectedTag, fetchEntries, fetchAllTags, fetchUsername])

  useEffect(() => {
    if (user && page > 1) {
      fetchEntries() // Load more when page changes
    }
  }, [page, user, fetchEntries])

  const extractTextPreview = (html: string, maxLength: number = 150) => {
    // stripHtmlTags already handles sanitization
    const text = stripHtmlTags(html)
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <AppHeader />

      <div className="flex relative">
        {/* Sidebar Toggle Button for Mobile - Floating */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-gold via-gold to-gold/80 dark:from-teal dark:via-teal dark:to-teal/80 text-white dark:text-midnight rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
          aria-label={sidebarOpen ? 'Close folders' : 'Open folders'}
        >
          {sidebarOpen ? 
            <X className="w-6 h-6" /> : 
            <Menu className="w-6 h-6" />
          }
        </button>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 dark:bg-black/50 z-30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:sticky top-[73px] left-0 z-40 w-80 h-[calc(100vh-73px)] bg-gradient-to-b from-white to-[#FFF9F0] dark:from-graphite dark:to-midnight border-r border-gold/10 dark:border-teal/10 overflow-y-auto transition-all duration-500 lg:translate-x-0 shadow-2xl lg:shadow-none`}
          data-tour="folders"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h2 className="font-serif text-2xl font-bold text-charcoal dark:text-teal">Folders</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FolderNavigation
              onFolderSelect={(folderId) => {
                setSelectedFolderId(folderId)
                setSidebarOpen(false)
              }}
              selectedFolderId={selectedFolderId}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
              <div className="flex-1">
                <h1 className="font-display text-display-lg font-bold tracking-tight text-charcoal dark:text-teal mb-2 sm:mb-3 leading-tight">
                  {folderName}
                </h1>
                <p className="text-base sm:text-lg text-charcoal/70 dark:text-white/70 font-medium">
                  Welcome back{username ? `, ${username}` : ''} ✨
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  href={selectedFolderId ? `/app/new?folder=${selectedFolderId}` : "/app/new"}
                  className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gold via-gold to-gold/80 dark:from-teal dark:via-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl sm:rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 justify-center"
                  data-tour="new-entry"
                >
                  <Plus className="w-5 sm:w-6 h-5 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-sm sm:text-base">New Entry</span>
                </Link>
                
                {/* Quick Access Buttons */}
                <div className="flex gap-3 sm:gap-3" data-tour="quick-access">
                  <Link
                    href="/app/bookmarks"
                    className="group flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 bg-white dark:bg-graphite border-2 border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 rounded-xl font-semibold hover:shadow-xl hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all duration-300 hover:scale-105"
                    title="View bookmarked entries"
                  >
                    <Star className="w-4 sm:w-5 h-4 sm:h-5 group-hover:fill-current transition-all" />
                    <span className="hidden sm:inline text-sm">Bookmarks</span>
                  </Link>
                  
                  <Link
                    href="/app/trash"
                    className="group flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 bg-white dark:bg-graphite border-2 border-red-500/20 dark:border-red-400/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:shadow-xl hover:border-red-500/40 dark:hover:border-red-400/40 transition-all duration-300 hover:scale-105"
                    title="View deleted entries"
                  >
                    <Trash2 className="w-4 sm:w-5 h-4 sm:h-5 group-hover:shake transition-all" />
                    <span className="hidden sm:inline text-sm">Trash</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {!selectedFolderId && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Total Entries */}
                <div className="group bg-white dark:bg-graphite rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-gold/10 dark:bg-teal/10 rounded-lg sm:rounded-xl group-hover:bg-gold/20 dark:group-hover:bg-teal/20 transition-colors">
                      <FileText className="w-4 sm:w-6 h-4 sm:h-6 text-gold dark:text-teal" />
                    </div>
                    <TrendingUp className="w-3 sm:w-5 h-3 sm:h-5 text-gold/50 dark:text-teal/50" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.totalEntries}
                  </div>
                  <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Total Entries
                  </div>
                </div>

                {/* Total Words */}
                <div className="group bg-white dark:bg-graphite rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-purple-500/10 dark:bg-purple-400/10 rounded-lg sm:rounded-xl group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/20 transition-colors">
                      <Type className="w-4 sm:w-6 h-4 sm:h-6 text-purple-500 dark:text-purple-400" />
                    </div>
                    <TrendingUp className="w-3 sm:w-5 h-3 sm:h-5 text-purple-500/50 dark:text-purple-400/50" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.totalWords.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Words Written
                  </div>
                </div>

                {/* People Mentioned */}
                <div className="group bg-white dark:bg-graphite rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg sm:rounded-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors">
                      <Users className="w-4 sm:w-6 h-4 sm:h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <Smile className="w-3 sm:w-5 h-3 sm:h-5 text-blue-500/50 dark:text-blue-400/50" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.peopleCount}
                  </div>
                  <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    People Featured
                  </div>
                </div>

                {/* Stories Created */}
                <div className="group bg-white dark:bg-graphite rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-orange-500/10 dark:bg-orange-400/10 rounded-lg sm:rounded-xl group-hover:bg-orange-500/20 dark:group-hover:bg-orange-400/20 transition-colors">
                      <BookMarked className="w-4 sm:w-6 h-4 sm:h-6 text-orange-500 dark:text-orange-400" />
                    </div>
                    <FileText className="w-3 sm:w-5 h-3 sm:h-5 text-orange-500/50 dark:text-orange-400/50" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.storiesCount}
                  </div>
                  <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Stories Created
                  </div>
                </div>

                {/* Writing Streak */}
                <div className="group bg-gradient-to-br from-gold/90 via-gold to-gold/80 dark:from-teal/90 dark:via-teal dark:to-teal/80 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-105 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-white/20 dark:bg-midnight/20 rounded-lg sm:rounded-xl group-hover:bg-white/30 dark:group-hover:bg-midnight/30 transition-colors">
                      <Zap className="w-4 sm:w-6 h-4 sm:h-6 text-white dark:text-midnight" />
                    </div>
                    <TrendingUp className="w-3 sm:w-5 h-3 sm:h-5 text-white/70 dark:text-midnight/70" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white dark:text-midnight mb-1">
                    {stats.currentStreak} days
                  </div>
                  <div className="text-xs sm:text-sm text-white/90 dark:text-midnight/90 font-medium">
                    Current Streak 🔥
                  </div>
                </div>
              </div>
            )}

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white dark:bg-graphite rounded-lg sm:rounded-xl shadow-lg border border-orange-500/10 dark:border-orange-400/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">🏷️</span>
                    <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white">Filter by Tag</h3>
                  </div>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="sm:ml-auto text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 15).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                        selectedTag === tag
                          ? 'bg-orange-500 dark:bg-orange-400 text-white shadow-lg scale-105'
                          : 'bg-orange-500/10 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 dark:hover:bg-orange-400/20 hover:scale-105'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {allTags.length > 15 && (
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-charcoal/50 dark:text-white/50">
                      +{allTags.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Entries List */}
            {fetchingEntries ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Loading skeleton */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-graphite rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-6 sm:h-7 bg-gradient-to-r from-charcoal/10 to-charcoal/5 dark:from-white/10 dark:to-white/5 rounded w-3/4"></div>
                        <div className="h-4 sm:h-5 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded w-1/4"></div>
                      </div>
                      <div className="h-4 sm:h-5 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded w-20 sm:w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 sm:h-4 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded"></div>
                      <div className="h-3 sm:h-4 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-[#FFF9F0] dark:from-graphite dark:to-midnight rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 lg:p-16 text-center border border-gold/20 dark:border-teal/20">
                <div className="text-6xl sm:text-7xl lg:text-8xl mb-4 sm:mb-6">📝</div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-charcoal dark:text-teal bg-gradient-to-r from-gold to-gold/60 dark:from-teal dark:to-teal/60 bg-clip-text text-transparent">
                  Your Journal Awaits
                </h3>
                <p className="text-base sm:text-lg text-charcoal/70 dark:text-white/70 mb-6 sm:mb-8 max-w-md mx-auto">
                  Start writing your first entry to begin your journey of self-discovery
                </p>
                <Link
                  href={selectedFolderId ? `/app/new?folder=${selectedFolderId}` : "/app/new"}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                >
                  <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                  Create First Entry
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/app/entry/${entry.id}`}
                    className="group block bg-white dark:bg-graphite rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl p-4 sm:p-6 transition-all duration-300 border border-charcoal/5 dark:border-white/5 hover:border-gold/40 dark:hover:border-teal/40 hover:scale-[1.01] sm:hover:scale-[1.02] hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal mb-2 transition-colors duration-300 line-clamp-2">
                          {entry.title}
                        </h3>
                        {entry.mood && (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-gold/10 via-gold/15 to-gold/20 dark:from-teal/10 dark:via-teal/15 dark:to-teal/20 text-gold dark:text-teal rounded-full text-xs sm:text-sm font-bold shadow-sm">
                            <span className="text-sm sm:text-base">{entry.mood}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-charcoal/70 dark:text-white/70 font-bold whitespace-nowrap">
                          {new Date(entry.entry_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] sm:text-xs text-charcoal/50 dark:text-white/50 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm sm:text-base text-charcoal/80 dark:text-white/80 line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-5 leading-relaxed">
                      {extractTextPreview(entry.content, 200)}
                    </p>
                    
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-charcoal/60 dark:text-white/60 flex-wrap">
                      <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-charcoal/5 dark:bg-white/5 rounded-lg font-semibold">
                        <Type className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="hidden xs:inline">{entry.word_count} words</span>
                        <span className="xs:hidden">{entry.word_count}w</span>
                      </span>
                      {entry.folder_id && (
                        <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-charcoal/5 dark:bg-white/5 rounded-lg font-semibold">
                          <span className="text-sm sm:text-base">{(entry as any).folders?.icon || '📁'}</span>
                          <span className="hidden sm:inline">{(entry as any).folders?.name || 'Folder'}</span>
                        </span>
                      )}
                      {entry.entry_people && entry.entry_people.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                            {entry.entry_people.slice(0, 2).map((ep) => (
                              <span
                                key={ep.people.id}
                                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-blue-500/20 dark:hover:bg-blue-400/20 transition-colors"
                              >
                                {ep.people.avatar_url ? (
                                  <Image
                                    src={ep.people.avatar_url}
                                    alt={ep.people.name}
                                    width={20}
                                    height={20}
                                    className="w-4 sm:w-5 h-4 sm:h-5 rounded-full object-cover ring-2 ring-blue-500/20"
                                  />
                                ) : (
                                  <div className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-blue-500/30 dark:bg-blue-400/30 flex items-center justify-center text-[8px] sm:text-[10px] font-bold">
                                    {ep.people.name.charAt(0)}
                                  </div>
                                )}
                                <span className="hidden sm:inline">{ep.people.name}</span>
                              </span>
                            ))}
                            {entry.entry_people.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold">
                                +{entry.entry_people.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {(entry as any).story_entries && (entry as any).story_entries.length > 0 && (
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          {(entry as any).story_entries.slice(0, 2).map((se: any) => (
                            <span
                              key={se.stories.id}
                              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-sm hover:shadow-md transition-all"
                              style={{ 
                                backgroundColor: `${se.stories.color}15`, 
                                color: se.stories.color,
                                border: `1px solid ${se.stories.color}30`
                              }}
                            >
                              <span className="text-xs sm:text-sm">{se.stories.icon}</span>
                              <span className="hidden sm:inline">{se.stories.title}</span>
                            </span>
                          ))}
                          {(entry as any).story_entries.length > 2 && (
                            <span className="text-[10px] sm:text-xs px-2 py-1 bg-charcoal/10 dark:bg-white/10 rounded-lg font-semibold">
                              +{(entry as any).story_entries.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {!fetchingEntries && hasMore && entries.length > 0 && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    setPage(prev => prev + 1)
                    fetchEntries()
                  }}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gold dark:bg-teal text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm sm:text-base"
                >
                  Load More Entries
                </button>
              </div>
            )}

            {/* End of results message */}
            {!fetchingEntries && !hasMore && entries.length > 0 && (
              <div className="text-center mt-6 sm:mt-8 text-charcoal/60 dark:text-white/60">
                <p className="text-sm sm:text-base">You&apos;ve reached the end of your entries</p>
                <p className="text-xs sm:text-sm mt-1">Total: {totalCount} {totalCount === 1 ? 'entry' : 'entries'}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
