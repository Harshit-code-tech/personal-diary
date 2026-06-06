'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PresetCategory, UserCategory } from '@/lib/types'
import { ChevronDown, X, Plus } from 'lucide-react'

// ─── Preset categories (always available) ────────────────────────────────────
export const PRESET_CATEGORIES: PresetCategory[] = [
  { value: 'milestone', label: 'Milestone', icon: '🎯', color: '#FFD700' },
  { value: 'achievement', label: 'Achievement', icon: '🏆', color: '#4CAF50' },
  { value: 'relationship', label: 'Relationship', icon: '❤️', color: '#E91E63' },
  { value: 'travel', label: 'Travel', icon: '✈️', color: '#2196F3' },
  { value: 'work', label: 'Work', icon: '💼', color: '#9C27B0' },
  { value: 'education', label: 'Education', icon: '🎓', color: '#FF9800' },
  { value: 'health', label: 'Health', icon: '💪', color: '#00BCD4' },
  { value: 'other', label: 'Other', icon: '⭐', color: '#607D8B' },
]

// ─── Helper: Check if a category value matches a preset ──────────────────────
export function isPresetCategory(value: string): boolean {
  return PRESET_CATEGORIES.some(c => c.value === value)
}

// ─── Helper: Get display info for any category value ─────────────────────────
export function getCategoryDisplay(value: string, userCategories?: UserCategory[]): {
  label: string
  icon: string
  color: string
} {
  // Check presets first
  const preset = PRESET_CATEGORIES.find(c => c.value === value)
  if (preset) return { label: preset.label, icon: preset.icon, color: preset.color }

  // Check user's custom categories
  const custom = userCategories?.find(c => c.name === value)
  if (custom) return { label: custom.name, icon: custom.icon, color: custom.color }

  // Fallback: display the raw value with default styling
  return { label: value, icon: '⭐', color: '#607D8B' }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface CategoryComboBoxProps {
  value: string             // Current category value
  onChange: (category: string, icon: string, color: string) => void
  userId: string | undefined
  placeholder?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CategoryComboBox({
  value,
  onChange,
  userId,
  placeholder = 'Select or type a category...',
}: CategoryComboBoxProps) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Fetch user's custom categories ──────────────────────────────────────

  const fetchUserCategories = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false })

      if (!error && data) {
        setUserCategories(data)
      }
    } catch (err) {
      console.error('Error fetching user categories:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchUserCategories()
  }, [fetchUserCategories])

  // ─── Close dropdown when clicking outside ────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchText('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── Build the suggestions list ──────────────────────────────────────────

  const query = searchText.toLowerCase().trim()

  // Filter preset categories by search
  const filteredPresets = PRESET_CATEGORIES.filter(c =>
    !query || c.label.toLowerCase().includes(query) || c.value.toLowerCase().includes(query)
  )

  // Filter user custom categories by search (exclude ones matching preset keys)
  const filteredCustom = userCategories.filter(c =>
    !isPresetCategory(c.name) &&
    (!query || c.name.toLowerCase().includes(query))
  )

  // Check if search text matches any existing option exactly
  const exactMatch = filteredPresets.some(c =>
    c.label.toLowerCase() === query || c.value.toLowerCase() === query
  ) || filteredCustom.some(c => c.name.toLowerCase() === query)

  // Show "Create new" option if user typed something that doesn't match
  const showCreateOption = query.length > 0 && !exactMatch

  // ─── Handle selecting a category ─────────────────────────────────────────

  const handleSelectPreset = (cat: PresetCategory) => {
    onChange(cat.value, cat.icon, cat.color)
    setIsOpen(false)
    setSearchText('')
  }

  const handleSelectCustom = (cat: UserCategory) => {
    onChange(cat.name, cat.icon, cat.color)
    setIsOpen(false)
    setSearchText('')
  }

  const handleCreateNew = async () => {
    if (!userId || !query) return

    const newName = searchText.trim()
    const defaultIcon = '⭐'
    const defaultColor = '#607D8B'

    try {
      // Save to user_categories for future suggestions
      await supabase
        .from('user_categories')
        .upsert({
          user_id: userId,
          name: newName,
          icon: defaultIcon,
          color: defaultColor,
          usage_count: 1,
        }, {
          onConflict: 'user_id,name',
        })

      // Update local state
      setUserCategories(prev => {
        const existing = prev.find(c => c.name === newName)
        if (existing) return prev
        return [...prev, {
          id: crypto.randomUUID(),
          user_id: userId,
          name: newName,
          icon: defaultIcon,
          color: defaultColor,
          usage_count: 1,
        }]
      })

      onChange(newName, defaultIcon, defaultColor)
    } catch (err) {
      console.error('Error creating category:', err)
      // Still apply locally even if save fails
      onChange(newName, defaultIcon, defaultColor)
    }

    setIsOpen(false)
    setSearchText('')
  }

  // ─── Current display value ───────────────────────────────────────────────

  const display = getCategoryDisplay(value, userCategories)

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      {/* Selected value / input field */}
      <div
        className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg cursor-pointer hover:border-charcoal/30 dark:hover:border-white/30 transition-colors"
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showCreateOption) {
                e.preventDefault()
                handleCreateNew()
              }
              if (e.key === 'Escape') {
                setIsOpen(false)
                setSearchText('')
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40"
            autoFocus
          />
        ) : (
          <div className="flex-1 flex items-center gap-2 text-sm">
            <span>{display.icon}</span>
            <span className="text-charcoal dark:text-white font-medium truncate">
              {display.label}
            </span>
          </div>
        )}

        {isOpen && searchText ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSearchText('')
              inputRef.current?.focus()
            }}
            className="p-0.5 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded"
          >
            <X className="w-3.5 h-3.5 text-charcoal/50 dark:text-white/50" />
          </button>
        ) : (
          <ChevronDown className={`w-4 h-4 text-charcoal/50 dark:text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 vintage-card border border-charcoal/10 dark:border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-charcoal/50 dark:text-white/50">
              Loading...
            </div>
          )}

          {/* Preset categories section */}
          {filteredPresets.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-charcoal/40 dark:text-white/40 uppercase tracking-wider">
                Presets
              </div>
              {filteredPresets.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleSelectPreset(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors ${
                    value === cat.value ? 'bg-gold/10 dark:bg-teal/10 font-medium' : ''
                  }`}
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="text-charcoal dark:text-white truncate">{cat.label}</span>
                  {value === cat.value && (
                    <span className="ml-auto text-gold dark:text-teal text-xs">✓</span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* User custom categories section */}
          {filteredCustom.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-charcoal/40 dark:text-white/40 uppercase tracking-wider border-t border-charcoal/10 dark:border-white/10 mt-1">
                Your Categories
              </div>
              {filteredCustom.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCustom(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors ${
                    value === cat.name ? 'bg-gold/10 dark:bg-teal/10 font-medium' : ''
                  }`}
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="text-charcoal dark:text-white truncate">{cat.name}</span>
                  <span className="ml-auto text-xs text-charcoal/40 dark:text-white/40">
                    {cat.usage_count}x
                  </span>
                  {value === cat.name && (
                    <span className="text-gold dark:text-teal text-xs ml-1">✓</span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Create new category option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors border-t border-charcoal/10 dark:border-white/10"
            >
              <Plus className="w-4 h-4 text-gold dark:text-teal flex-shrink-0" />
              <span className="text-gold dark:text-teal font-medium truncate">
                Create &quot;{searchText.trim()}&quot;
              </span>
            </button>
          )}

          {/* No results */}
          {filteredPresets.length === 0 && filteredCustom.length === 0 && !showCreateOption && (
            <div className="px-3 py-4 text-center text-sm text-charcoal/50 dark:text-white/50">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
