'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import FolderNavigation from '@/components/folders/FolderNavigation'
import { BookOpen, Plus, Calendar, Settings, LogOut, Menu, X, Users, BookMarked, TrendingUp, FileText, Smile, Zap, Type } from 'lucide-react'

type Entry = {
  id: string
  title: string
  content: string
  entry_date: string
  word_count: number
  mood: string | null
  folder_id: string | null
  person_id: string | null
  created_at: string
  entry_people?: Array<{
    people: {
      id: string
      name: string
      avatar_url: string | null
    }
  }>
  story_entries?: Array<{
    stories: {
      id: string
      title: string
      icon: string
      color: string
    } | null
  }>
}

type Folder = {
  id: string
  name: string
  icon: string
}

export default function AppPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [entries, setEntries] = useState<Entry[]>([])
  const [fetchingEntries, setFetchingEntries] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [folderName, setFolderName] = useState<string>('All Entries')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalWords: 0,
    peopleCount: 0,
    storiesCount: 0,
    currentStreak: 0,
  })

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user, selectedFolderId])

  const fetchEntries = async () => {
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

      let query = supabase
        .from('entries')
        .select(`
          id, title, content, entry_date, word_count, mood, 
          folder_id, person_id, created_at,
          folders (name, icon),
          entry_people (
            people (id, name, avatar_url)
          ),
          story_entries (
            stories (id, title, icon, color)
          )
        `)
        .order('entry_date', { ascending: false })
        .limit(20)

      if (selectedFolderId) {
        query = query.in('folder_id', folderIds)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data as any || [])
      
      // Calculate statistics
      if (data && data.length > 0) {
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
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const extractTextPreview = (html: string, maxLength: number = 150) => {
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
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
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/app" className="flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-gold dark:text-teal" />
              <span className="font-serif text-2xl font-bold text-charcoal dark:text-teal">
                My Diary
              </span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-6">
            <ThemeSwitcher />
            <Link
              href="/app"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              Entries
            </Link>
            <Link
              href="/app/people"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              People
            </Link>
            <Link
              href="/app/stories"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors flex items-center gap-1"
            >
              <BookMarked className="w-4 h-4" />
              Stories
            </Link>
            <Link
              href="/app/calendar"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              Calendar
            </Link>
            <Link
              href="/app/settings"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:sticky top-[73px] left-0 z-40 w-72 h-[calc(100vh-73px)] bg-white dark:bg-graphite border-r border-charcoal/10 dark:border-white/10 overflow-y-auto transition-transform duration-300 lg:translate-x-0`}
        >
          <div className="p-4">
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
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-teal mb-2">
                  {folderName}
                </h1>
                <p className="text-charcoal/70 dark:text-white/70">
                  Welcome back, {user?.email?.split('@')[0]}
                </p>
              </div>
              <Link
                href="/app/new"
                className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Entry
              </Link>
            </div>

            {/* Statistics Cards */}
            {!selectedFolderId && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Total Entries */}
                <div className="group bg-white dark:bg-graphite rounded-xl shadow-lg hover:shadow-2xl p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gold/10 dark:bg-teal/10 rounded-xl group-hover:bg-gold/20 dark:group-hover:bg-teal/20 transition-colors">
                      <FileText className="w-6 h-6 text-gold dark:text-teal" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-gold/50 dark:text-teal/50" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.totalEntries}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Total Entries
                  </div>
                </div>

                {/* Total Words */}
                <div className="group bg-white dark:bg-graphite rounded-xl shadow-lg hover:shadow-2xl p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-purple-500/10 dark:bg-purple-400/10 rounded-xl group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/20 transition-colors">
                      <Type className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-purple-500/50 dark:text-purple-400/50" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.totalWords.toLocaleString()}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Words Written
                  </div>
                </div>

                {/* People Mentioned */}
                <div className="group bg-white dark:bg-graphite rounded-xl shadow-lg hover:shadow-2xl p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors">
                      <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <Smile className="w-5 h-5 text-blue-500/50 dark:text-blue-400/50" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.peopleCount}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    People Featured
                  </div>
                </div>

                {/* Stories Created */}
                <div className="group bg-white dark:bg-graphite rounded-xl shadow-lg hover:shadow-2xl p-6 border border-gold/10 dark:border-teal/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-orange-500/10 dark:bg-orange-400/10 rounded-xl group-hover:bg-orange-500/20 dark:group-hover:bg-orange-400/20 transition-colors">
                      <BookOpen className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                    </div>
                    <FileText className="w-5 h-5 text-orange-500/50 dark:text-orange-400/50" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                    {stats.storiesCount}
                  </div>
                  <div className="text-sm text-charcoal/60 dark:text-white/60 font-medium">
                    Stories Created
                  </div>
                </div>

                {/* Writing Streak */}
                <div className="group bg-gradient-to-br from-gold/90 via-gold to-gold/80 dark:from-teal/90 dark:via-teal dark:to-teal/80 rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/20 dark:bg-midnight/20 rounded-xl group-hover:bg-white/30 dark:group-hover:bg-midnight/30 transition-colors">
                      <Zap className="w-6 h-6 text-white dark:text-midnight" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-white/70 dark:text-midnight/70" />
                  </div>
                  <div className="text-3xl font-bold text-white dark:text-midnight mb-1">
                    {stats.currentStreak} days
                  </div>
                  <div className="text-sm text-white/90 dark:text-midnight/90 font-medium">
                    Current Streak 🔥
                  </div>
                </div>
              </div>
            )}

            {/* Entries List */}
            {fetchingEntries ? (
              <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-8 text-center">
                <div className="text-charcoal dark:text-white">Loading entries...</div>
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="font-serif text-2xl font-semibold mb-2 text-charcoal dark:text-teal">
                  Your Journal Awaits
                </h3>
                <p className="text-charcoal/70 dark:text-white/70 mb-6">
                  Start writing your first entry to begin your journey
                </p>
                <Link
                  href="/app/new"
                  className="inline-block px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
                >
                  Create First Entry
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/app/entry/${entry.id}`}
                    className="block bg-white dark:bg-graphite rounded-xl shadow-md hover:shadow-2xl p-6 transition-all duration-300 border border-charcoal/5 dark:border-white/5 hover:border-gold/30 dark:hover:border-teal/30 group hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-semibold text-charcoal dark:text-teal group-hover:text-gold dark:group-hover:text-teal mb-2 transition-colors">
                          {entry.title}
                        </h3>
                        {entry.mood && (
                          <span className="inline-block px-3 py-1 bg-gradient-to-r from-gold/10 to-gold/20 dark:from-teal/10 dark:to-teal/20 text-gold dark:text-teal rounded-full text-sm font-medium">
                            {entry.mood}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-charcoal/60 dark:text-white/60 font-medium">
                        {new Date(entry.entry_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    
                    <div
                      className="text-charcoal/70 dark:text-white/70 line-clamp-2 mb-4"
                      dangerouslySetInnerHTML={{ __html: extractTextPreview(entry.content) }}
                    />
                    
                    <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60">
                      <span>{entry.word_count} words</span>
                      {entry.folder_id && (
                        <span className="flex items-center gap-1">
                          <span>📁</span>
                          {(entry as any).folders?.name || 'Folder'}
                        </span>
                      )}
                      {entry.entry_people && entry.entry_people.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <div className="flex gap-1 flex-wrap">
                            {entry.entry_people.map((ep) => (
                              <span
                                key={ep.people.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-xs font-medium"
                              >
                                {ep.people.avatar_url ? (
                                  <img
                                    src={ep.people.avatar_url}
                                    alt={ep.people.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gold/20 dark:bg-teal/20 flex items-center justify-center text-[8px]">
                                    {ep.people.name.charAt(0)}
                                  </div>
                                )}
                                {ep.people.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(entry as any).story_entries && (entry as any).story_entries.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <BookMarked className="w-4 h-4" />
                          {(entry as any).story_entries.slice(0, 2).map((se: any) => (
                            <span
                              key={se.stories.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${se.stories.color}20`, color: se.stories.color }}
                            >
                              <span>{se.stories.icon}</span>
                              <span>{se.stories.title}</span>
                            </span>
                          ))}
                          {(entry as any).story_entries.length > 2 && (
                            <span className="text-xs text-charcoal/50 dark:text-white/50">
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
          </div>
        </main>
      </div>
    </div>
  )
}
