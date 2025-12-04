// Enhanced caching utilities for better performance
import { QueryClient } from '@tanstack/react-query'

// Create optimized QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching configuration
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache garbage collection (formerly cacheTime)
      
      // Retry configuration
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false, // Don't refetch on window focus (too aggressive)
      refetchOnReconnect: true, // Refetch when connection restored
      refetchOnMount: false, // Don't refetch if data is fresh
      
      // Error handling
      throwOnError: false,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      
      // Optimistic updates
      onMutate: async () => {
        // Cancel outgoing queries to avoid overwriting optimistic updates
      },
    },
  },
})

// Prefetch strategies for better UX
export const prefetchStrategies = {
  // Prefetch entries when hovering over navigation
  prefetchEntries: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['entries', userId],
      staleTime: 1000 * 60 * 5,
    })
  },
  
  // Prefetch folders
  prefetchFolders: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['folders', userId],
      staleTime: 1000 * 60 * 10, // Folders change less frequently
    })
  },
  
  // Prefetch people
  prefetchPeople: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['people', userId],
      staleTime: 1000 * 60 * 10,
    })
  },
}

// Cache invalidation strategies
export const cacheInvalidation = {
  // Invalidate all entry-related queries
  invalidateEntries: () => {
    queryClient.invalidateQueries({ queryKey: ['entries'] })
    queryClient.invalidateQueries({ queryKey: ['streaks'] })
    queryClient.invalidateQueries({ queryKey: ['insights'] })
  },
  
  // Invalidate folders
  invalidateFolders: () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] })
  },
  
  // Invalidate people
  invalidatePeople: () => {
    queryClient.invalidateQueries({ queryKey: ['people'] })
  },
  
  // Clear all cache
  clearAll: () => {
    queryClient.clear()
  },
}

// Selective revalidation based on mutation type
export const smartInvalidation = {
  onEntryCreate: () => {
    cacheInvalidation.invalidateEntries()
  },
  
  onEntryUpdate: (entryId: string) => {
    queryClient.invalidateQueries({ queryKey: ['entry', entryId] })
    queryClient.invalidateQueries({ queryKey: ['entries'] })
  },
  
  onEntryDelete: () => {
    cacheInvalidation.invalidateEntries()
  },
  
  onFolderChange: () => {
    cacheInvalidation.invalidateFolders()
    queryClient.invalidateQueries({ queryKey: ['entries'] })
  },
}

// Performance monitoring
export const cacheMonitoring = {
  logCacheStats: () => {
    const cache = queryClient.getQueryCache()
    console.log('Cache Stats:', {
      totalQueries: cache.getAll().length,
      activeQueries: cache.getAll().filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: cache.getAll().filter(q => q.isStale()).length,
    })
  },
  
  clearStaleQueries: () => {
    const cache = queryClient.getQueryCache()
    cache.getAll().forEach(query => {
      if (query.isStale()) {
        queryClient.removeQueries({ queryKey: query.queryKey })
      }
    })
  },
}
