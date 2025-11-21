'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Folder, ChevronRight, ChevronDown, Plus, User, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface FolderItem {
  id: string
  name: string
  icon: string
  folder_type: string
  parent_id: string | null
  children?: FolderItem[]
  entry_count?: number
}

interface FolderNavigationProps {
  onFolderSelect?: (folderId: string) => void
  selectedFolderId?: string | null
}

export default function FolderNavigation({ onFolderSelect, selectedFolderId }: FolderNavigationProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchFolders()
    }
  }, [user])

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error

      // Build tree structure
      const folderMap = new Map<string, FolderItem>()
      const rootFolders: FolderItem[] = []

      // First pass: create all folders
      data?.forEach(folder => {
        folderMap.set(folder.id, { ...folder, children: [] })
      })

      // Second pass: build tree
      data?.forEach(folder => {
        const folderItem = folderMap.get(folder.id)!
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id)
          if (parent) {
            parent.children = parent.children || []
            parent.children.push(folderItem)
          }
        } else {
          rootFolders.push(folderItem)
        }
      })

      setFolders(rootFolders)
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleFolder(folder.id)
            }
            onFolderSelect?.(folder.id)
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isSelected
              ? 'bg-gold/20 dark:bg-teal/20 text-charcoal dark:text-teal'
              : 'hover:bg-charcoal/5 dark:hover:bg-white/5 text-charcoal dark:text-white'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="flex-shrink-0 text-lg">{folder.icon}</span>
          <span className="flex-1 text-left text-sm font-medium truncate">{folder.name}</span>
          {folder.entry_count !== undefined && folder.entry_count > 0 && (
            <span className="text-xs text-charcoal/50 dark:text-white/50">
              {folder.entry_count}
            </span>
          )}
        </button>

        {isExpanded && hasChildren && (
          <div>
            {folder.children?.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-charcoal/50 dark:text-white/50">
        Loading folders...
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Quick Access */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-charcoal/50 dark:text-white/50 uppercase px-3 mb-2">
          Quick Access
        </h3>
        <Link
          href="/app"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors text-charcoal dark:text-white"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">All Entries</span>
        </Link>
        <Link
          href="/app/people"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors text-charcoal dark:text-white"
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">People</span>
        </Link>
      </div>

      {/* Folder Tree */}
      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-xs font-semibold text-charcoal/50 dark:text-white/50 uppercase">
            Folders
          </h3>
          <button
            className="p-1 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 transition-colors"
            title="New Folder"
          >
            <Plus className="w-4 h-4 text-charcoal/50 dark:text-white/50" />
          </button>
        </div>
        <div className="space-y-1">
          {folders.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-charcoal/50 dark:text-white/50">
              No folders yet. Create your first entry to start organizing!
            </div>
          ) : (
            folders.map(folder => renderFolder(folder))
          )}
        </div>
      </div>
    </div>
  )
}
