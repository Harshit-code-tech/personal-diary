'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Folder, ChevronRight, ChevronDown, Plus, User, BookOpen, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface FolderItem {
  id: string
  name: string
  icon: string
  color?: string
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
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showEditFolder, setShowEditFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null)
  const [folderName, setFolderName] = useState('')
  const [folderIcon, setFolderIcon] = useState('📁')
  const [folderColor, setFolderColor] = useState('#D4AF37')
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, folder: FolderItem} | null>(null)
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
        .in('folder_type', ['year', 'month', 'day', 'custom']) // Only show date and custom folders
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

  const createCustomFolder = async () => {
    if (!folderName.trim() || !user) return

    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: folderName.trim(),
          folder_type: 'custom',
          icon: folderIcon,
          color: folderColor,
          parent_id: null
        })

      if (error) throw error

      setShowNewFolder(false)
      setFolderName('')
      setFolderIcon('📁')
      setFolderColor('#D4AF37')
      fetchFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder')
    }
  }

  const updateFolder = async () => {
    if (!editingFolder || !folderName.trim()) return

    try {
      const { error } = await supabase
        .from('folders')
        .update({
          name: folderName.trim(),
          icon: folderIcon,
          color: folderColor
        })
        .eq('id', editingFolder.id)

      if (error) throw error

      setShowEditFolder(false)
      setEditingFolder(null)
      setFolderName('')
      fetchFolders()
    } catch (error) {
      console.error('Error updating folder:', error)
      alert('Failed to update folder')
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Entries will not be deleted.')) return

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error
      fetchFolders()
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Failed to delete folder')
    }
  }

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isCustomFolder = folder.folder_type === 'custom'

    return (
      <div key={folder.id} className="relative group">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleFolder(folder.id)
            }
            onFolderSelect?.(folder.id)
          }}
          onContextMenu={(e) => {
            if (isCustomFolder) {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, folder })
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isSelected
              ? 'bg-gradient-to-r from-gold/20 to-gold/10 dark:from-teal/20 dark:to-teal/10 text-charcoal dark:text-teal shadow-sm'
              : 'hover:bg-charcoal/5 dark:hover:bg-white/5 text-charcoal dark:text-white hover:shadow-sm'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <span className="flex-shrink-0 transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="flex-shrink-0 text-lg" style={{ color: folder.color || undefined }}>
            {folder.icon}
          </span>
          <span className="flex-1 text-left text-sm font-medium truncate">{folder.name}</span>
          {folder.entry_count !== undefined && folder.entry_count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60 font-semibold">
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
            onClick={() => setShowNewFolder(true)}
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

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNewFolder(false)}>
          <div className="bg-white dark:bg-graphite rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-charcoal dark:text-teal mb-4">Create Custom Folder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Work, Travel, Dreams"
                  className="w-full px-4 py-2 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['📁', '💼', '✈️', '💭', '🎨', '📚', '🏠', '❤️', '🌟', '🎯'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFolderIcon(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        folderIcon === emoji 
                          ? 'bg-gold/20 dark:bg-teal/20 scale-110' 
                          : 'hover:bg-charcoal/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#D4AF37', '#20B2AA', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFolderColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        folderColor === color ? 'ring-2 ring-offset-2 ring-charcoal dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewFolder(false)}
                className="flex-1 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCustomFolder}
                disabled={!folderName.trim()}
                className="flex-1 px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu for Custom Folders */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-graphite rounded-lg shadow-xl border border-charcoal/10 dark:border-white/10 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                setEditingFolder(contextMenu.folder)
                setFolderName(contextMenu.folder.name)
                setFolderIcon(contextMenu.folder.icon)
                setFolderColor(contextMenu.folder.color || '#D4AF37')
                setShowEditFolder(true)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors text-charcoal dark:text-white"
            >
              ✏️ Edit Folder
            </button>
            <button
              onClick={() => {
                deleteFolder(contextMenu.folder.id)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            >
              🗑️ Delete Folder
            </button>
          </div>
        </>
      )}

      {/* Edit Folder Modal */}
      {showEditFolder && editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEditFolder(false)}>
          <div className="bg-white dark:bg-graphite rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-charcoal dark:text-teal mb-4">Edit Folder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['\ud83d\udcc1', '\ud83d\udcbc', '\u2708\ufe0f', '\ud83d\udcad', '\ud83c\udfa8', '\ud83d\udcda', '\ud83c\udfe0', '\u2764\ufe0f', '\ud83c\udf1f', '\ud83c\udfaf'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFolderIcon(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        folderIcon === emoji 
                          ? 'bg-gold/20 dark:bg-teal/20 scale-110' 
                          : 'hover:bg-charcoal/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#D4AF37', '#20B2AA', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFolderColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        folderColor === color ? 'ring-2 ring-offset-2 ring-charcoal dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditFolder(false)}
                className="flex-1 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateFolder}
                disabled={!folderName.trim()}
                className="flex-1 px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
