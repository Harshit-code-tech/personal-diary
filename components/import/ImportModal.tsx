'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Upload, X, FileJson, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface ImportData {
  entries?: Array<{
    title: string
    content: string
    entry_date: string
    mood?: string
    tags?: string[]
    word_count?: number
  }>
  people?: any[]
  stories?: any[]
  exportDate?: string
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportData | null>(null)
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError('')
    setPreview(null)

    // Validate file type
    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a valid JSON file')
      return
    }

    setFile(selectedFile)

    // Parse and preview
    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text) as ImportData

      // Validate structure
      if (!data.entries || !Array.isArray(data.entries)) {
        setError('Invalid file format: missing entries array')
        return
      }

      // Validate each entry has required fields
      const hasValidEntries = data.entries.every(
        entry => entry.title && entry.content && entry.entry_date
      )

      if (!hasValidEntries) {
        setError('Invalid entry format: missing required fields (title, content, entry_date)')
        return
      }

      setPreview(data)
    } catch (err) {
      console.error('Parse error:', err)
      setError('Failed to parse JSON file. Please check the file format.')
    }
  }

  const handleImport = async () => {
    if (!preview || !user) return

    setImporting(true)
    try {
      const entriesToImport = preview.entries?.map(entry => ({
        ...entry,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || []

      // Import entries in batches of 50
      const batchSize = 50
      for (let i = 0; i < entriesToImport.length; i += batchSize) {
        const batch = entriesToImport.slice(i, i + batchSize)
        const { error } = await supabase
          .from('entries')
          .insert(batch)

        if (error) throw error
      }

      // Optionally import people and stories if they exist
      if (preview.people && preview.people.length > 0) {
        const peopleToImport = preview.people.map(person => ({
          ...person,
          user_id: user.id,
          created_at: new Date().toISOString(),
        }))
        await supabase.from('people').insert(peopleToImport)
      }

      if (preview.stories && preview.stories.length > 0) {
        const storiesToImport = preview.stories.map(story => ({
          ...story,
          user_id: user.id,
          created_at: new Date().toISOString(),
        }))
        await supabase.from('stories').insert(storiesToImport)
      }

      toast.success(
        `Successfully imported ${entriesToImport.length} ${entriesToImport.length === 1 ? 'entry' : 'entries'}!`
      )
      onSuccess?.()
      handleClose()
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.message || 'Failed to import data. Please try again.')
      toast.error('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gold/20 dark:border-teal/20">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-graphite border-b border-charcoal/10 dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold/10 dark:bg-teal/10 rounded-lg">
              <Upload className="w-6 h-6 text-gold dark:text-teal" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white">
                Import Entries
              </h2>
              <p className="text-sm text-charcoal/60 dark:text-white/60">
                Upload a JSON export file
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-charcoal dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label
              htmlFor="import-file"
              className="block w-full cursor-pointer"
            >
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                file
                  ? 'border-gold dark:border-teal bg-gold/5 dark:bg-teal/5'
                  : 'border-charcoal/20 dark:border-white/20 hover:border-gold dark:hover:border-teal hover:bg-gold/5 dark:hover:bg-teal/5'
              }`}>
                <FileJson className={`w-12 h-12 mx-auto mb-3 ${
                  file ? 'text-gold dark:text-teal' : 'text-charcoal/40 dark:text-white/40'
                }`} />
                <p className="font-medium text-charcoal dark:text-white mb-1">
                  {file ? file.name : 'Click to select a JSON file'}
                </p>
                <p className="text-sm text-charcoal/60 dark:text-white/60">
                  {file ? 'Click to change file' : 'Or drag and drop your export file here'}
                </p>
              </div>
            </label>
            <input
              id="import-file"
              name="importFile"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800 dark:text-red-200">
                  Import Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !error && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    File validated successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Ready to import {preview.entries?.length || 0} {preview.entries?.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              </div>

              {/* Import Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm text-charcoal/60 dark:text-white/60 mb-1">
                    Entries
                  </p>
                  <p className="text-2xl font-bold text-charcoal dark:text-white">
                    {preview.entries?.length || 0}
                  </p>
                </div>
                {preview.people && preview.people.length > 0 && (
                  <div>
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mb-1">
                      People
                    </p>
                    <p className="text-2xl font-bold text-charcoal dark:text-white">
                      {preview.people.length}
                    </p>
                  </div>
                )}
                {preview.stories && preview.stories.length > 0 && (
                  <div>
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mb-1">
                      Stories
                    </p>
                    <p className="text-2xl font-bold text-charcoal dark:text-white">
                      {preview.stories.length}
                    </p>
                  </div>
                )}
                {preview.exportDate && (
                  <div>
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mb-1">
                      Export Date
                    </p>
                    <p className="text-sm font-medium text-charcoal dark:text-white">
                      {new Date(preview.exportDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This will add the imported entries to your existing journal. Existing entries will not be affected.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-graphite border-t border-charcoal/10 dark:border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            disabled={importing}
            className="flex-1 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl font-semibold text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview || importing || !!error}
            className="flex-1 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <div className="w-5 h-5 border-2 border-white dark:border-midnight border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import {preview?.entries?.length || 0} {preview?.entries?.length === 1 ? 'Entry' : 'Entries'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
