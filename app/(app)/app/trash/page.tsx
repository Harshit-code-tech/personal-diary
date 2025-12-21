'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Trash2, RefreshCw, X, Calendar, FileText, AlertCircle } from 'lucide-react'
import { stripHtmlTags } from '@/lib/sanitize'
import AppHeader from '@/components/layout/AppHeader'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Entry {
  id: string
  title: string
  content: string
  entry_date: string
  mood: string | null
  word_count: number
  deleted_at: string
  deleted_by: string
}

export default function TrashPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [permanentlyDeleting, setPermanentlyDeleting] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchTrashedEntries = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user?.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      console.error('Error fetching trash:', err)
      toast.error('Failed to load trash')
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    if (user) {
      fetchTrashedEntries()
    }
  }, [user, fetchTrashedEntries])

  const restoreEntry = async (entryId: string) => {
    try {
      setRestoring(entryId)
      const { error } = await supabase
        .from('entries')
        .update({ deleted_at: null, deleted_by: null })
        .eq('id', entryId)

      if (error) throw error

      toast.success('Entry restored successfully!')
      setEntries(prev => prev.filter(e => e.id !== entryId))
    } catch (err) {
      console.error('Error restoring entry:', err)
      toast.error('Failed to restore entry')
    } finally {
      setRestoring(null)
    }
  }

  const permanentlyDelete = async (entryId: string) => {
    try {
      setPermanentlyDeleting(entryId)
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      toast.success('Entry permanently deleted')
      setEntries(prev => prev.filter(e => e.id !== entryId))
    } catch (err) {
      console.error('Error deleting entry:', err)
      toast.error('Failed to delete entry')
    } finally {
      setPermanentlyDeleting(null)
    }
  }

  const emptyTrash = async () => {
    try {
      setLoading(true)
      const { error} = await supabase
        .from('entries')
        .delete()
        .eq('user_id', user?.id)
        .not('deleted_at', 'is', null)

      if (error) throw error

      toast.success('Trash emptied successfully')
      setEntries([])
    } catch (err) {
      console.error('Error emptying trash:', err)
      toast.error('Failed to empty trash')
    } finally {
      setLoading(false)
    }
  }

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return '😞'
    return mood.split(' ')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-paper to-gold/10 dark:from-midnight dark:via-charcoal dark:to-graphite">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center text-charcoal/60 dark:text-white/60">
            Loading trash...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-paper to-gold/10 dark:from-midnight dark:via-charcoal dark:to-graphite">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-500/10 dark:bg-red-400/10 rounded-xl">
                <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="font-display text-display-lg font-bold text-charcoal dark:text-teal">
                Trash
              </h1>
            </div>
            <p className="text-charcoal/70 dark:text-white/70 ml-1">
              Deleted entries are kept for 30 days before permanent deletion
            </p>
          </div>
          
          {entries.length > 0 && (
            <button
              onClick={() => setConfirmEmpty(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Empty Trash
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-6 bg-charcoal/5 dark:bg-white/5 rounded-full mb-6">
              <Trash2 className="w-16 h-16 text-charcoal/30 dark:text-white/30" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-3">
              Trash is Empty
            </h2>
            <p className="text-charcoal/60 dark:text-white/60 mb-6">
              Deleted entries will appear here for 30 days
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Back to Entries
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const deletedDate = new Date(entry.deleted_at)
              const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)))

              return (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-graphite rounded-2xl p-4 sm:p-6 border-2 border-red-200 dark:border-red-900/30 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                        <h3 className="font-heading text-xl font-semibold text-charcoal dark:text-white truncate">
                          {entry.title || 'Untitled Entry'}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal/60 dark:text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {entry.word_count} words
                        </span>
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          Deletes in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => restoreEntry(entry.id)}
                        disabled={restoring === entry.id}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Restore</span>
                      </button>
                      
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        disabled={permanentlyDeleting === entry.id}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-charcoal/70 dark:text-white/70 line-clamp-2">
                    {stripHtmlTags(entry.content).substring(0, 200)}...
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Confirm delete single entry */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => {
          if (permanentlyDeleting) return
          setConfirmDeleteId(null)
        }}
        onConfirm={() => {
          if (confirmDeleteId) permanentlyDelete(confirmDeleteId)
        }}
        title="Permanently delete this entry?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={!!permanentlyDeleting}
        type="danger"
      />

      {/* Confirm empty trash */}
      <ConfirmDialog
        isOpen={confirmEmpty}
        onClose={() => {
          if (loading) return
          setConfirmEmpty(false)
        }}
        onConfirm={() => {
          emptyTrash()
          setConfirmEmpty(false)
        }}
        title="Empty trash?"
        message={`This will permanently delete ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} and cannot be undone.`}
        confirmText="Empty Trash"
        cancelText="Keep"
        loading={loading}
        type="danger"
      />
    </div>
  )
}
