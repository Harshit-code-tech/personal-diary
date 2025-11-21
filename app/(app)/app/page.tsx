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
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-gradient-to-r hover:from-gold/10 hover:to-gold/5 dark:hover:from-teal/10 dark:hover:to-teal/5 rounded-xl transition-all duration-300 lg:hidden group hover:scale-110"
            >
              {sidebarOpen ? 
                <X className="w-5 h-5 group-hover:text-gold dark:group-hover:text-teal transition-colors" /> : 
                <Menu className="w-5 h-5 group-hover:text-gold dark:group-hover:text-teal transition-colors" />
              }
            </button>
            <Link href="/app" className="group flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-gold/20 to-gold/10 dark:from-teal/20 dark:to-teal/10 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="w-7 h-7 text-gold dark:text-teal" />
              </div>
              <span className="font-serif text-3xl font-black bg-gradient-to-r from-charcoal to-charcoal/70 dark:from-teal dark:to-teal/70 bg-clip-text text-transparent">
                My Diary
              </span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link
              href="/app"
              className="px-4 py-2 text-sm font-bold text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10"
            >
              Entries
            </Link>
            <Link
              href="/app/people"
              className="px-4 py-2 text-sm font-bold text-charcoal dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-300 rounded-xl hover:bg-blue-500/10 dark:hover:bg-blue-400/10 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              People
            </Link>
            <Link
              href="/app/stories"
              className="px-4 py-2 text-sm font-bold text-charcoal dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300 rounded-xl hover:bg-orange-500/10 dark:hover:bg-orange-400/10 flex items-center gap-2"
            >
              <BookMarked className="w-4 h-4" />
              Stories
            </Link>
            <Link
              href="/app/calendar"
              className="px-4 py-2 text-sm font-bold text-charcoal dark:text-white hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 rounded-xl hover:bg-purple-500/10 dark:hover:bg-purple-400/10 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Link>
            <Link
              href="/app/settings"
              className="p-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2.5 text-charcoal dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
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
          } fixed lg:sticky top-[85px] left-0 z-40 w-80 h-[calc(100vh-85px)] bg-gradient-to-b from-white to-[#FFF9F0] dark:from-graphite dark:to-midnight border-r border-gold/10 dark:border-teal/10 overflow-y-auto transition-all duration-500 lg:translate-x-0 shadow-2xl lg:shadow-none`}
        >
          <div className="p-6">
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
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="font-serif text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-3 leading-tight">
                  {folderName}
                </h1>
                <p className="text-lg text-charcoal/70 dark:text-white/70 font-medium">
                  Welcome back, <span className="text-gold dark:text-teal font-bold">{user?.email?.split('@')[0]}</span> ✨
                </p>
              </div>
              <Link
                href="/app/new"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold via-gold to-gold/80 dark:from-teal dark:via-teal dark:to-teal/80 text-white dark:text-midnight rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
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
              <div className="space-y-6">
                {/* Loading skeleton */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-graphite rounded-xl shadow-md p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-7 bg-gradient-to-r from-charcoal/10 to-charcoal/5 dark:from-white/10 dark:to-white/5 rounded w-3/4"></div>
                        <div className="h-5 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded w-1/4"></div>
                      </div>
                      <div className="h-5 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded"></div>
                      <div className="h-4 bg-gradient-to-r from-charcoal/5 to-transparent dark:from-white/5 dark:to-transparent rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-[#FFF9F0] dark:from-graphite dark:to-midnight rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
                <div className="text-8xl mb-6 animate-bounce">📝</div>
                <h3 className="font-serif text-3xl font-bold mb-3 text-charcoal dark:text-teal bg-gradient-to-r from-gold to-gold/60 dark:from-teal dark:to-teal/60 bg-clip-text text-transparent">
                  Your Journal Awaits
                </h3>
                <p className="text-lg text-charcoal/70 dark:text-white/70 mb-8 max-w-md mx-auto">
                  Start writing your first entry to begin your journey of self-discovery
                </p>
                <Link
                  href="/app/new"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Create First Entry
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/app/entry/${entry.id}`}
                    className="group block bg-white dark:bg-graphite rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 border border-charcoal/5 dark:border-white/5 hover:border-gold/40 dark:hover:border-teal/40 hover:scale-[1.02] hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-bold text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal mb-2 transition-colors duration-300">
                          {entry.title}
                        </h3>
                        {entry.mood && (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-gold/10 via-gold/15 to-gold/20 dark:from-teal/10 dark:via-teal/15 dark:to-teal/20 text-gold dark:text-teal rounded-full text-sm font-bold shadow-sm">
                            <span className="text-base">{entry.mood}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-charcoal/70 dark:text-white/70 font-bold">
                          {new Date(entry.entry_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-charcoal/50 dark:text-white/50">
                          {new Date(entry.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div
                      className="text-charcoal/80 dark:text-white/80 line-clamp-3 mb-5 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: extractTextPreview(entry.content, 200) }}
                    />
                    
                    <div className="flex items-center gap-4 text-sm text-charcoal/60 dark:text-white/60 flex-wrap">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal/5 dark:bg-white/5 rounded-lg font-semibold">
                        <Type className="w-4 h-4" />
                        {entry.word_count} words
                      </span>
                      {entry.folder_id && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal/5 dark:bg-white/5 rounded-lg font-semibold">
                          <span className="text-base">{(entry as any).folders?.icon || '📁'}</span>
                          {(entry as any).folders?.name || 'Folder'}
                        </span>
                      )}
                      {entry.entry_people && entry.entry_people.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-wrap">
                            {entry.entry_people.map((ep) => (
                              <span
                                key={ep.people.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20 dark:hover:bg-blue-400/20 transition-colors"
                              >
                                {ep.people.avatar_url ? (
                                  <img
                                    src={ep.people.avatar_url}
                                    alt={ep.people.name}
                                    className="w-5 h-5 rounded-full object-cover ring-2 ring-blue-500/20"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-blue-500/30 dark:bg-blue-400/30 flex items-center justify-center text-[10px] font-bold">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(entry as any).story_entries.slice(0, 2).map((se: any) => (
                            <span
                              key={se.stories.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all"
                              style={{ 
                                backgroundColor: `${se.stories.color}15`, 
                                color: se.stories.color,
                                border: `1px solid ${se.stories.color}30`
                              }}
                            >
                              <span className="text-sm">{se.stories.icon}</span>
                              <span>{se.stories.title}</span>
                            </span>
                          ))}
                          {(entry as any).story_entries.length > 2 && (
                            <span className="text-xs px-2 py-1 bg-charcoal/10 dark:bg-white/10 rounded-lg font-semibold">
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
