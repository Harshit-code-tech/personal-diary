import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Folder {
  id: string
  name: string
  icon: string
  color: string
  folder_type: string | null
  parent_id: string | null
  is_expanded: boolean
  is_pinned: boolean
  sort_order: number
  description: string | null
  created_at: string
  updated_at: string
  user_id: string
}

export interface FolderNode extends Folder {
  children: FolderNode[]
  entry_count: number
  level: number
}

export function useFolderTree() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [tree, setTree] = useState<FolderNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [entryCounts, setEntryCounts] = useState<Map<string, number>>(new Map())
  
  const supabase = createClient()

  // Fetch entry counts for all folders
  const fetchEntryCounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return new Map()

      const { data, error } = await supabase.rpc('get_folder_entry_counts', {
        user_id_param: user.id
      })

      if (error) throw error

      const countMap = new Map<string, number>()
      data?.forEach((item: { folder_id: string; entry_count: number }) => {
        countMap.set(item.folder_id, Number(item.entry_count))
      })

      return countMap
    } catch (err) {
      console.error('Error fetching entry counts:', err)
      return new Map()
    }
  }, [supabase])

  // Build tree structure from flat folder list
  const buildTree = useCallback((flatFolders: Folder[], counts: Map<string, number>): FolderNode[] => {
    // Create map of all folders
    const folderMap = new Map<string, FolderNode>()
    
    flatFolders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        entry_count: counts.get(folder.id) || 0,
        level: 0
      })
    })

    // Build parent-child relationships and calculate levels
    const rootFolders: FolderNode[] = []
    
    folderMap.forEach(folder => {
      if (folder.parent_id === null) {
        // Root folder
        rootFolders.push(folder)
      } else {
        // Child folder
        const parent = folderMap.get(folder.parent_id)
        if (parent) {
          folder.level = parent.level + 1
          parent.children.push(folder)
        }
      }
    })

    // Sort folders: pinned first, then by sort_order, then by name
    const sortFolders = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1
        }
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        return a.name.localeCompare(b.name)
      })
      
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortFolders(node.children)
        }
      })
    }

    sortFolders(rootFolders)
    return rootFolders
  }, [])

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setFolders([])
        setTree([])
        return
      }

      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')

      if (foldersError) throw foldersError

      // Fetch entry counts
      const counts = await fetchEntryCounts()

      const folderList = foldersData || []
      setFolders(folderList)
      setEntryCounts(counts)
      setTree(buildTree(folderList, counts))
    } catch (err) {
      console.error('Error loading folders:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [supabase, buildTree, fetchEntryCounts])

  // Initial load
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  // Subscribe to folder changes
  useEffect(() => {
    const channel = supabase
      .channel('folder-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        () => {
          loadFolders()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entry_folders'
        },
        () => {
          // Refetch entry counts when junction table changes
          fetchEntryCounts().then(counts => {
            setEntryCounts(counts)
            setTree(prevTree => buildTree(folders, counts))
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadFolders, buildTree, folders, fetchEntryCounts])

  // Toggle folder expansion
  const toggleExpanded = useCallback(async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    const { error } = await supabase
      .from('folders')
      .update({ is_expanded: !folder.is_expanded })
      .eq('id', folderId)

    if (error) {
      console.error('Error toggling folder:', error)
      return
    }

    setFolders(prev =>
      prev.map(f =>
        f.id === folderId ? { ...f, is_expanded: !f.is_expanded } : f
      )
    )
    setTree(buildTree(
      folders.map(f =>
        f.id === folderId ? { ...f, is_expanded: !f.is_expanded } : f
      ),
      entryCounts
    ))
  }, [folders, entryCounts, buildTree, supabase])

  // Find folder by ID
  const findFolder = useCallback((folderId: string): Folder | undefined => {
    return folders.find(f => f.id === folderId)
  }, [folders])

  // Get folder path (breadcrumb)
  const getFolderPath = useCallback((folderId: string): Folder[] => {
    const path: Folder[] = []
    let currentId: string | null = folderId

    while (currentId) {
      const folder = folders.find(f => f.id === currentId)
      if (folder) {
        path.unshift(folder)
        currentId = folder.parent_id
      } else {
        break
      }
    }

    return path
  }, [folders])

  return {
    folders,
    tree,
    loading,
    error,
    entryCounts,
    toggleExpanded,
    findFolder,
    getFolderPath,
    refresh: loadFolders
  }
}
