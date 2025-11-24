'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'
import { Folder, ChevronRight, ChevronDown, Plus, User, BookOpen, MoreVertical, Edit2, Trash2, Zap, X } from 'lucide-react'
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
  const [parentFolderId, setParentFolderId] = useState<string | null>(null)
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

      // Get entry counts for each folder using the junction table
      const { data: entryCounts } = await supabase
        .from('entry_folders')
        .select('folder_id, entry_id')

      const countMap = new Map<string, number>()
      entryCounts?.forEach(ef => {
        if (ef.folder_id) {
          countMap.set(ef.folder_id, (countMap.get(ef.folder_id) || 0) + 1)
        }
      })

      // Build tree structure
      const folderMap = new Map<string, FolderItem>()
      const rootFolders: FolderItem[] = []

      // First pass: create all folders with entry counts
      data?.forEach(folder => {
        folderMap.set(folder.id, { 
          ...folder, 
          children: [],
          entry_count: countMap.get(folder.id) || 0
        })
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
          parent_id: parentFolderId
        })

      if (error) throw error

      setShowNewFolder(false)
      setFolderName('')
      setFolderIcon('📁')
      setFolderColor('#D4AF37')
      setParentFolderId(null)
      fetchFolders()
      toast.success('Folder created successfully!')
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder. Please try again.')
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
      toast.success('Folder updated successfully!')
    } catch (error) {
      console.error('Error updating folder:', error)
      toast.error('Failed to update folder. Please try again.')
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
      toast.success('Folder deleted successfully!')
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Failed to delete folder. Please try again.')
    }
  }

  // Helper function to flatten folder tree for parent selector
  const getAllCustomFolders = (folderList: FolderItem[] = folders): FolderItem[] => {
    const result: FolderItem[] = []
    const traverse = (items: FolderItem[], depth = 0) => {
      items.forEach(item => {
        if (item.folder_type === 'custom') {
          result.push({ ...item, name: '  '.repeat(depth) + item.name })
          if (item.children && item.children.length > 0) {
            traverse(item.children, depth + 1)
          }
        }
      })
    }
    traverse(folderList)
    return result
  }

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isCustomFolder = folder.folder_type === 'custom'

    return (
      <div key={folder.id} className="relative group">
        <Link
          href={`/app/folder/${folder.id}`}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault()
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
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
            isSelected
              ? 'bg-gradient-to-r from-gold/20 via-gold/15 to-gold/10 dark:from-teal/20 dark:via-teal/15 dark:to-teal/10 text-charcoal dark:text-teal shadow-lg scale-[1.02] border border-gold/30 dark:border-teal/30'
              : 'hover:bg-gradient-to-r hover:from-charcoal/5 hover:to-transparent dark:hover:from-white/5 dark:hover:to-transparent text-charcoal dark:text-white hover:shadow-md hover:scale-[1.01] border border-transparent'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <span className={`flex-shrink-0 transition-all duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          <span 
            className={`flex-shrink-0 text-xl transition-all duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
            style={{ color: folder.color || undefined }}
          >
            {folder.icon}
          </span>
          <span className="flex-1 text-left text-sm font-semibold truncate">{folder.name}</span>
          {folder.entry_count !== undefined && folder.entry_count > 0 && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
              isSelected 
                ? 'bg-gold/30 dark:bg-teal/30 text-charcoal dark:text-teal' 
                : 'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60 group-hover:bg-charcoal/20 dark:group-hover:bg-white/20'
              }`}>
              {folder.entry_count}
            </span>
          )}
        </Link>

        {isExpanded && hasChildren && (
          <div className="mt-1 space-y-1">
            {folder.children?.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {/* Loading skeleton */}
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gradient-to-r from-charcoal/5 to-charcoal/10 dark:from-white/5 dark:to-white/10 rounded-lg"></div>
          <div className="h-8 bg-gradient-to-r from-charcoal/5 to-charcoal/10 dark:from-white/5 dark:to-white/10 rounded-lg w-5/6"></div>
          <div className="h-8 bg-gradient-to-r from-charcoal/5 to-charcoal/10 dark:from-white/5 dark:to-white/10 rounded-lg w-4/6"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
      {/* Quick Access */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-charcoal/60 dark:text-white/60 uppercase tracking-wider px-3 mb-3 flex items-center gap-2">
          <Zap className="w-3 h-3" />
          Quick Access
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => {
              onFolderSelect?.(null as any)
              window.location.href = '/app'
            }}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-gold/10 hover:to-gold/5 dark:hover:from-teal/10 dark:hover:to-teal/5 transition-all duration-300 text-charcoal dark:text-white hover:shadow-sm"
          >
            <div className="p-1.5 rounded-lg bg-gold/10 dark:bg-teal/10 group-hover:bg-gold/20 dark:group-hover:bg-teal/20 transition-colors">
              <BookOpen className="w-4 h-4 text-gold dark:text-teal" />
            </div>
            <span className="text-sm font-semibold group-hover:text-gold dark:group-hover:text-teal transition-colors">All Entries</span>
          </button>
          <Link
            href="/app/people"
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-500/5 dark:hover:from-blue-400/10 dark:hover:to-blue-400/5 transition-all duration-300 text-charcoal dark:text-white hover:shadow-sm"
          >
            <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors">
              <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">People</span>
          </Link>
        </div>
      </div>

      {/* Folder Tree */}
      <div>
        <div className="flex items-center justify-between px-3 mb-3">
          <h3 className="text-xs font-bold text-charcoal/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
            <Folder className="w-3 h-3" />
            Folders
          </h3>
          <button
            onClick={() => setShowNewFolder(true)}
            className="p-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gold/20 hover:to-gold/10 dark:hover:from-teal/20 dark:hover:to-teal/10 transition-all duration-300 group hover:scale-110"
            title="New Folder"
          >
            <Plus className="w-4 h-4 text-charcoal/60 dark:text-white/60 group-hover:text-gold dark:group-hover:text-teal transition-colors" />
          </button>
        </div>
        <div className="space-y-1">
          {folders.length === 0 ? (
            <div className="px-3 py-12 text-center">
              <div className="text-5xl mb-4 animate-bounce">📁</div>
              <p className="text-sm text-charcoal/60 dark:text-white/60 font-medium mb-2">
                No folders yet
              </p>
              <p className="text-xs text-charcoal/40 dark:text-white/40">
                Create your first entry to start organizing!
              </p>
            </div>
          ) : (
            folders.map(folder => renderFolder(folder))
          )}
        </div>
      </div>
      </div>

      {/* New Folder Modal - Full Screen Centered Overlay */}
      {showNewFolder && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => {
          setShowNewFolder(false)
          setParentFolderId(null)
        }}>
          <div className="bg-white dark:bg-graphite rounded-3xl shadow-2xl w-[90vw] max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-gold/20 dark:border-teal/20 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-white dark:from-graphite to-transparent p-8 pb-6 border-b border-charcoal/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-gold/20 to-gold/10 dark:from-teal/20 dark:to-teal/10 rounded-2xl">
                    <Plus className="w-7 h-7 text-gold dark:text-teal" />
                  </div>
                  <h3 className="text-3xl font-black text-charcoal dark:text-teal">Create Custom Folder</h3>
                </div>
                <button
                  onClick={() => {
                    setShowNewFolder(false)
                    setParentFolderId(null)
                  }}
                  className="p-2 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-charcoal/60 dark:text-white/60" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 space-y-8">
              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Work, Travel, Dreams"
                  className="w-full px-6 py-4 bg-[#FFF5E6] dark:bg-midnight border-2 border-charcoal/20 dark:border-white/20 rounded-xl text-lg text-charcoal dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Parent Folder (Optional)
                  <span className="ml-2 text-xs font-normal text-charcoal/50 dark:text-white/50">Create a subfolder</span>
                </label>
                <select
                  value={parentFolderId || ''}
                  onChange={(e) => setParentFolderId(e.target.value || null)}
                  className="w-full px-6 py-4 bg-[#FFF5E6] dark:bg-midnight border-2 border-charcoal/20 dark:border-white/20 rounded-xl text-lg text-charcoal dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent transition-all"
                >
                  <option value="">No parent (root folder)</option>
                  {getAllCustomFolders().map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon} {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Choose Icon
                </label>
                <div className="grid grid-cols-8 gap-3">
                  {['📁', '💼', '✈️', '💭', '🎨', '📚', '🏠', '❤️', '🌟', '🎯', '👥', '📖', '📝', '💬', '🎵', '🎮', '💡', '🔥', '⚡', '🌈', '🎭', '🎬', '📷', '🎸', '⚽', '🍕', '🌸', '🦋', '🚀', '💎'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFolderIcon(emoji)}
                      className={`text-3xl p-4 rounded-xl transition-all duration-300 ${
                        folderIcon === emoji 
                          ? 'bg-gradient-to-br from-gold to-gold/80 dark:from-teal dark:to-teal/80 scale-110 shadow-xl ring-4 ring-gold/30 dark:ring-teal/30' 
                          : 'bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10 hover:scale-110 hover:shadow-md'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {['#D4AF37', '#20B2AA', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFolderColor(color)}
                      className={`w-full h-16 rounded-xl transition-all duration-300 shadow-md hover:shadow-2xl hover:scale-105 ${
                        folderColor === color ? 'ring-4 ring-offset-4 ring-charcoal/30 dark:ring-white/30 scale-105' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white dark:from-graphite to-transparent p-8 pt-6 border-t border-charcoal/10 dark:border-white/10 flex gap-4">
              <button
                onClick={() => {
                  setShowNewFolder(false)
                  setParentFolderId(null)
                }}
                className="flex-1 px-6 py-4 border-2 border-charcoal/20 dark:border-white/20 rounded-xl hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all font-bold text-lg hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={createCustomFolder}
                disabled={!folderName.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-black text-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Context Menu for Custom Folders */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-graphite rounded-xl shadow-2xl border-2 border-gold/20 dark:border-teal/20 py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-200"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
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
              className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-gradient-to-r hover:from-gold/10 hover:to-transparent dark:hover:from-teal/10 dark:hover:to-transparent transition-all text-charcoal dark:text-white flex items-center gap-3"
            >
              <Edit2 className="w-4 h-4 text-gold dark:text-teal" />
              Edit Folder
            </button>
            <button
              onClick={() => {
                deleteFolder(contextMenu.folder.id)
                setContextMenu(null)
              }}
              className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-red-600 dark:text-red-400 flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4" />
              Delete Folder
            </button>
          </div>
        </>
      )}

      {/* Edit Folder Modal */}
      {showEditFolder && editingFolder && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowEditFolder(false)}>
          <div className="bg-white dark:bg-graphite rounded-3xl shadow-2xl w-[90vw] max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-gold/20 dark:border-teal/20 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-white dark:from-graphite to-transparent p-8 pb-6 border-b border-charcoal/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-gold/20 to-gold/10 dark:from-teal/20 dark:to-teal/10 rounded-2xl">
                    <Edit2 className="w-7 h-7 text-gold dark:text-teal" />
                  </div>
                  <h3 className="text-3xl font-black text-charcoal dark:text-teal">Edit Folder</h3>
                </div>
                <button
                  onClick={() => setShowEditFolder(false)}
                  className="p-2 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-charcoal/60 dark:text-white/60" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 space-y-8">
              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-6 py-4 bg-[#FFF5E6] dark:bg-midnight border-2 border-charcoal/20 dark:border-white/20 rounded-xl text-lg text-charcoal dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Choose Icon
                </label>
                <div className="grid grid-cols-8 gap-3">
                  {['📁', '💼', '✈️', '💭', '🎨', '📚', '🏠', '❤️', '🌟', '🎯', '👥', '📖', '📝', '💬', '🎵', '🎮', '💡', '🔥', '⚡', '🌈', '🎭', '🎬', '📷', '🎸', '⚽', '🍕', '🌸', '🦋', '🚀', '💎'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFolderIcon(emoji)}
                      className={`text-3xl p-4 rounded-xl transition-all duration-300 ${
                        folderIcon === emoji 
                          ? 'bg-gradient-to-br from-gold to-gold/80 dark:from-teal dark:to-teal/80 scale-110 shadow-xl ring-4 ring-gold/30 dark:ring-teal/30' 
                          : 'bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10 hover:scale-110 hover:shadow-md'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-charcoal dark:text-white mb-4">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {['#D4AF37', '#20B2AA', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFolderColor(color)}
                      className={`w-full h-16 rounded-xl transition-all duration-300 shadow-md hover:shadow-2xl hover:scale-105 ${
                        folderColor === color ? 'ring-4 ring-offset-4 ring-charcoal/30 dark:ring-white/30 scale-105' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white dark:from-graphite to-transparent p-8 pt-6 border-t border-charcoal/10 dark:border-white/10 flex gap-4">
              <button
                onClick={() => setShowEditFolder(false)}
                className="flex-1 px-6 py-4 border-2 border-charcoal/20 dark:border-white/20 rounded-xl hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all font-bold text-lg hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={updateFolder}
                disabled={!folderName.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-black text-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
