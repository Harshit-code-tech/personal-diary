'use client'

import { useState, useEffect } from 'react'
import { X, FolderPlus, Check, Folder } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Folder as FolderType } from '@/lib/hooks/useFolderTree'
import { toast } from 'sonner'

interface MultiFolderSelectorProps {
  entryId: string
  onUpdate?: () => void
}

export default function MultiFolderSelector({
  entryId,
  onUpdate
}: MultiFolderSelectorProps) {
  const [selectedFolders, setSelectedFolders] = useState<FolderType[]>([])
  const [allFolders, setAllFolders] = useState<FolderType[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  // Load entry's current folders
  useEffect(() => {
    loadEntryFolders()
    loadAllFolders()
  }, [entryId])

  const loadEntryFolders = async () => {
    try {
      const { data, error } = await supabase.rpc('get_entry_folders', {
        entry_id_param: entryId
      })

      if (error) throw error
      setSelectedFolders(data || [])
    } catch (error) {
      console.error('Error loading entry folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      
      // Filter out date folders (year/month/day)
      const customFolders = (data || []).filter(
        f => f.folder_type !== 'year' && f.folder_type !== 'month' && f.folder_type !== 'day'
      )
      setAllFolders(customFolders)
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const isSelected = (folderId: string) => {
    return selectedFolders.some(f => f.id === folderId)
  }

  const toggleFolder = async (folder: FolderType) => {
    setSaving(true)
    try {
      if (isSelected(folder.id)) {
        // Remove from folder
        const { error } = await supabase
          .from('entry_folders')
          .delete()
          .match({ entry_id: entryId, folder_id: folder.id })

        if (error) throw error

        setSelectedFolders(prev => prev.filter(f => f.id !== folder.id))
        toast.success(`Removed from "${folder.name}"`)
      } else {
        // Add to folder
        const { error } = await supabase
          .from('entry_folders')
          .insert({
            entry_id: entryId,
            folder_id: folder.id
          })

        if (error) throw error

        setSelectedFolders(prev => [...prev, folder])
        toast.success(`Added to "${folder.name}"`)
      }

      onUpdate?.()
    } catch (error: any) {
      console.error('Error toggling folder:', error)
      toast.error(error.message || 'Failed to update folders')
    } finally {
      setSaving(false)
    }
  }

  const removeFolder = async (folderId: string) => {
    const folder = selectedFolders.find(f => f.id === folderId)
    if (folder) {
      await toggleFolder(folder)
    }
  }

  // Group folders by parent for better organization
  const getRootFolders = () => {
    return allFolders.filter(f => f.parent_id === null)
  }

  const getChildFolders = (parentId: string) => {
    return allFolders.filter(f => f.parent_id === parentId)
  }

  const renderFolderOption = (folder: FolderType, level: number = 0) => {
    const selected = isSelected(folder.id)
    const children = getChildFolders(folder.id)

    return (
      <div key={folder.id}>
        <button
          onClick={() => toggleFolder(folder)}
          disabled={saving}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
            transition-colors text-left
            ${selected
              ? 'bg-primary/10 text-primary dark:bg-primary/20'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }
            ${saving ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {/* Checkbox */}
          <div className={`
            w-4 h-4 flex items-center justify-center rounded border-2
            ${selected
              ? 'bg-primary border-primary'
              : 'border-gray-300 dark:border-gray-600'
            }
          `}>
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>

          {/* Icon */}
          <span className="text-lg" style={{ color: folder.color }}>
            {folder.icon}
          </span>

          {/* Name */}
          <span className="flex-1 truncate">{folder.name}</span>
        </button>

        {/* Children */}
        {children.length > 0 && (
          <div className="ml-4">
            {children.map(child => renderFolderOption(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Folder className="w-4 h-4 animate-pulse" />
        <span>Loading folders...</span>
      </div>
    )
  }

  return (
    <div className="multi-folder-selector">
      {/* Selected Folders Display */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {selectedFolders.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Not in any folders
          </div>
        ) : (
          selectedFolders.map(folder => (
            <div
              key={folder.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm"
            >
              <span className="text-base" style={{ color: folder.color }}>
                {folder.icon}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {folder.name}
              </span>
              <button
                onClick={() => removeFolder(folder.id)}
                disabled={saving}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}

        {/* Add Folder Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Add to Folder</span>
        </button>
      </div>

      {/* Folder Selection Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
            }
          }}
        >
          <div 
            className="bg-white dark:bg-midnight rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select Folders
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folder List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {allFolders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No folders available</p>
                </div>
              ) : (
                getRootFolders().map(folder => renderFolderOption(folder, 0))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
