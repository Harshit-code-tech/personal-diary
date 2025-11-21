'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import FolderNavigation from '@/components/folders/FolderNavigation'
import { BookOpen, Plus, Calendar, Settings, LogOut, Menu, X } from 'lucide-react'

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

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user, selectedFolderId])

  const fetchEntries = async () => {
    try {
      let query = supabase
        .from('entries')
        .select(`
          id, title, content, entry_date, word_count, mood, 
          folder_id, person_id, created_at,
          folders (name, icon)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data || [])
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
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
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
                    className="block bg-white dark:bg-graphite rounded-lg shadow-sm p-6 hover:shadow-md transition-all border border-transparent hover:border-gold dark:hover:border-teal group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-semibold text-charcoal dark:text-teal group-hover:text-gold dark:group-hover:text-teal mb-2">
                          {entry.title}
                        </h3>
                        {entry.mood && (
                          <span className="inline-block px-3 py-1 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-full text-sm font-medium">
                            {entry.mood}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-charcoal/60 dark:text-white/60">
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
