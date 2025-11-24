import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Folder as FolderIcon } from 'lucide-react'
import FolderBreadcrumbs from '@/components/folders/FolderBreadcrumbs'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

async function getFolderData(folderId: string) {
  const supabase = await createClient()
  
  // Get folder details
  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('*')
    .eq('id', folderId)
    .single()

  if (folderError || !folder) {
    return null
  }

  // Get entries in folder
  const { data: entries, error: entriesError } = await supabase.rpc('get_folder_entries', {
    folder_id_param: folderId,
    limit_param: 100,
    offset_param: 0
  })

  return {
    folder,
    entries: entries || []
  }
}

export default async function FolderPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  console.log('Folder page params:', params)
  console.log('Folder ID:', params.id)
  console.log('Link will be:', `/app/new?folder=${params.id}`)

  const data = await getFolderData(params.id)

  if (!data) {
    redirect('/app')
  }

  const { folder, entries } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-midnight dark:via-midnight-light dark:to-midnight">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Breadcrumbs */}
          <Suspense fallback={<div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse mb-4" />}>
            <FolderBreadcrumbs folderId={params.id} className="mb-4" />
          </Suspense>

          {/* Folder Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
              >
                {folder.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {folder.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>

            <Link
              href={`/app/new?folder=${params.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Entry
            </Link>
          </div>
        </div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-midnight-light rounded-xl shadow-sm">
            <FolderIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No entries in this folder
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by creating a new entry or add existing entries to this folder
            </p>
            <Link
              href={`/app/new?folder=${params.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Entry
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry: any) => (
              <Link
                key={entry.id}
                href={`/app/entry/${entry.id}`}
                className="bg-white dark:bg-midnight-light rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    {entry.content && (
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 text-sm">
                        {entry.content.replace(/<[^>]*>/g, '').substring(0, 200)}
                        {entry.content.length > 200 && '...'}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>
                        {new Date(entry.entry_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {entry.mood && (
                        <span className="flex items-center gap-1">
                          <span>Mood:</span>
                          <span className="capitalize">{entry.mood}</span>
                        </span>
                      )}
                      {entry.folder_count > 1 && (
                        <span className="flex items-center gap-1">
                          <FolderIcon className="w-3 h-3" />
                          <span>{entry.folder_count} folders</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
