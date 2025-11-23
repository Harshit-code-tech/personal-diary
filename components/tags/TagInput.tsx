'use client'

import { useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  suggestions?: string[]
}

export default function TagInput({ 
  tags, 
  onChange, 
  placeholder = "Add tag...",
  maxTags = 10,
  suggestions = []
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag])
      setInput('')
      setShowSuggestions(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-xl focus-within:ring-2 focus-within:ring-gold dark:focus-within:ring-teal min-h-[48px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal rounded-full text-sm font-medium group hover:bg-gold/30 dark:hover:bg-teal/30 transition-colors"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-gold-dark dark:hover:text-teal-dark transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        
        {tags.length < maxTags && (
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(input.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
          />
        )}

        {tags.length >= maxTags && (
          <span className="text-sm text-charcoal/60 dark:text-white/60 py-1.5">
            Max {maxTags} tags
          </span>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
              <span>#{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="mt-2 text-xs text-charcoal/60 dark:text-white/60">
        Press Enter to add tags. {tags.length}/{maxTags} tags used.
      </p>
    </div>
  )
}
