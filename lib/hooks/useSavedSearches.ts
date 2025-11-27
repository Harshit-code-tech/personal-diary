import { useState, useEffect } from 'react'

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: {
    dateFrom?: string
    dateTo?: string
    mood?: string
    folderId?: string
    personId?: string
    storyId?: string
  }
  createdAt: number
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('savedSearches')
      if (stored) {
        setSavedSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error)
    }
  }, [])

  // Save a new search
  const saveSearch = (name: string, query: string, filters: SavedSearch['filters']) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      createdAt: Date.now(),
    }

    const updated = [newSearch, ...savedSearches]
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    return newSearch
  }

  // Delete a saved search
  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
  }

  // Update a saved search
  const updateSearch = (id: string, updates: Partial<SavedSearch>) => {
    const updated = savedSearches.map(s => 
      s.id === id ? { ...s, ...updates } : s
    )
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
  }

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    updateSearch,
  }
}
