import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

const supabase = createClient()

// Query Keys
export const queryKeys = {
  entries: (userId: string, folderId?: string | null, tag?: string | null) => 
    ['entries', userId, folderId, tag],
  entry: (id: string) => ['entry', id],
  people: (userId: string) => ['people', userId],
  stories: (userId: string) => ['stories', userId],
  folders: (userId: string) => ['folders', userId],
  goals: (userId: string) => ['goals', userId],
  reminders: (userId: string) => ['reminders', userId],
  tags: (userId: string) => ['tags', userId],
}

// Fetch Entries Hook with Caching
export function useEntries(folderId?: string | null, tag?: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.entries(user?.id || '', folderId, tag),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('entries')
        .select(`
          id, title, content, entry_date, word_count, mood, 
          folder_id, person_id, created_at, tags,
          folders (name, icon),
          entry_people (
            people (id, name, avatar_url)
          ),
          story_entries (
            stories (id, title, icon, color)
          )
        `)
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(20)

      if (folderId) {
        // Get folder descendants
        const { data: descendants } = await supabase.rpc('get_folder_descendants', {
          p_folder_id: folderId,
        })
        const folderIds = descendants?.map((d: any) => d.folder_id) || [folderId]
        query = query.in('folder_id', folderIds)
      }

      if (tag) {
        query = query.contains('tags', [tag])
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3, // 3 minutes
  })
}

// Fetch Single Entry Hook
export function useEntry(entryId: string) {
  return useQuery({
    queryKey: queryKeys.entry(entryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select(`
          *,
          folders (name, icon),
          entry_people (
            people (id, name, avatar_url, relationship)
          ),
          story_entries (
            stories (id, title, icon, color)
          )
        `)
        .eq('id', entryId)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Fetch People Hook
export function usePeople() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.people(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes (people change less frequently)
  })
}

// Fetch Stories Hook
export function useStories() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.stories(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  })
}

// Fetch Folders Hook
export function useFolders() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.folders(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes (folders change rarely)
  })
}

// Create Entry Mutation
export function useCreateEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (entryData: any) => {
      const { data, error } = await supabase.from('entries').insert(entryData).select().single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate entries cache
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })
}

// Update Entry Mutation
export function useUpdateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await supabase
        .from('entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Update both the entry detail cache and entries list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.entry(data.id) })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })
}

// Delete Entry Mutation
export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('entries').delete().eq('id', entryId)

      if (error) throw error
      return entryId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })
}

// Prefetch entry (for hover states)
export function usePrefetchEntry() {
  const queryClient = useQueryClient()

  return (entryId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.entry(entryId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', entryId)
          .single()

        if (error) throw error
        return data
      },
      staleTime: 1000 * 60 * 5,
    })
  }
}
