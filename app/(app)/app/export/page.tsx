'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, FileDown, Calendar, Filter, Check } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { exportToMarkdown, exportToPDF, downloadMarkdown } from '@/lib/export-utils'
import toast from 'react-hot-toast'

export default function ExportPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<any[]>([])
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'year' | 'custom'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user, dateRange, startDate, endDate])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('entries')
        .select('id, title, content, entry_date, mood, word_count, tags')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false })

      // Apply date filter
      if (dateRange === 'month') {
        const date = new Date()
        date.setMonth(date.getMonth() - 1)
        query = query.gte('entry_date', date.toISOString().split('T')[0])
      } else if (dateRange === 'year') {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 1)
        query = query.gte('entry_date', date.toISOString().split('T')[0])
      } else if (dateRange === 'custom' && startDate && endDate) {
        query = query.gte('entry_date', startDate).lte('entry_date', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      setEntries(data || [])
      // Select all by default
      setSelectedEntries(new Set(data?.map(e => e.id) || []))
    } catch (err) {
      console.error('Error fetching entries:', err)
      toast.error('Failed to load entries')
    } finally {
      setLoading(false)
    }
  }

  const toggleEntry = (id: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEntries(newSelected)
  }

  const selectAll = () => {
    setSelectedEntries(new Set(entries.map(e => e.id)))
  }

  const deselectAll = () => {
    setSelectedEntries(new Set())
  }

  const handleExport = async (format: 'markdown' | 'pdf') => {
    if (selectedEntries.size === 0) {
      toast.error('Please select at least one entry to export')
      return
    }

    setExporting(true)
    try {
      const entriesToExport = entries
        .filter(e => selectedEntries.has(e.id))
        .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())

      if (format === 'markdown') {
        const markdown = exportToMarkdown(entriesToExport)
        downloadMarkdown(markdown)
        toast.success('Exported to Markdown successfully!')
      } else {
        await exportToPDF(entriesToExport)
        toast.success('Exported to PDF successfully!')
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export entries')
    } finally {
      setExporting(false)
    }
  }

  if (authLoading || loading) {
    return <PageLoadingSkeleton />
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
            <span className="font-bold text-lg">Back</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-3 leading-tight flex items-center gap-4">
            <Download className="w-12 h-12 text-gold dark:text-teal" />
            Export Entries
          </h1>
          <p className="text-lg text-charcoal/70 dark:text-white/70 font-medium">
            Download your diary entries in Markdown or PDF format
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gold dark:text-teal" />
            <h3 className="text-lg font-bold text-charcoal dark:text-white">Filter by Date</h3>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {(['all', 'month', 'year', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  dateRange === range
                    ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg scale-105'
                    : 'bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white hover:bg-charcoal/10 dark:hover:bg-white/10'
                }`}
              >
                {range === 'all' && 'All Time'}
                {range === 'month' && 'Last Month'}
                {range === 'year' && 'Last Year'}
                {range === 'custom' && 'Custom Range'}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                />
              </div>
            </div>
          )}
        </div>

        {/* Entry Selection */}
        <div className="mb-6 bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border border-gold/20 dark:border-teal/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-charcoal dark:text-white">
                Select Entries ({selectedEntries.size} of {entries.length})
              </h3>
              <p className="text-sm text-charcoal/60 dark:text-white/60">
                Choose which entries to include in your export
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 text-sm font-medium text-gold dark:text-teal hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 text-sm font-medium text-charcoal/60 dark:text-white/60 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-charcoal/50 dark:text-white/50 py-8">
              No entries found for the selected date range
            </p>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => toggleEntry(entry.id)}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                    selectedEntries.has(entry.id)
                      ? 'border-gold dark:border-teal bg-gold/10 dark:bg-teal/10'
                      : 'border-charcoal/10 dark:border-white/10 bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    selectedEntries.has(entry.id)
                      ? 'border-gold dark:border-teal bg-gold dark:bg-teal'
                      : 'border-charcoal/30 dark:border-white/30'
                  }`}>
                    {selectedEntries.has(entry.id) && <Check className="w-4 h-4 text-white dark:text-midnight" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-charcoal dark:text-white mb-1 truncate">
                      {entry.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-charcoal/60 dark:text-white/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </span>
                      {entry.mood && <span>{entry.mood.split(' ')[0]}</span>}
                      <span>{entry.word_count} words</span>
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="text-orange-500 dark:text-orange-400">
                          🏷️ {entry.tags.length}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleExport('markdown')}
            disabled={selectedEntries.size === 0 || exporting}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="relative z-10">
              <FileText className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Export as Markdown</h3>
              <p className="text-white/80 text-sm">
                Plain text format perfect for editing and version control
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={selectedEntries.size === 0 || exporting}
            className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="relative z-10">
              <FileDown className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Export as PDF</h3>
              <p className="text-white/80 text-sm">
                Professional format ideal for printing and archiving
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {exporting && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gold/10 dark:bg-teal/10 text-gold dark:text-teal rounded-xl font-medium">
              <div className="w-5 h-5 border-2 border-gold dark:border-teal border-t-transparent rounded-full animate-spin" />
              Exporting...
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
