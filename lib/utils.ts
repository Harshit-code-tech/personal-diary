import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate word count from markdown content
 */
export function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Calculate reading time in seconds (average 200 words per minute)
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200
  const minutes = wordCount / wordsPerMinute
  return Math.ceil(minutes * 60)
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'readable':
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * Format reading time to human-readable string
 */
export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return '< 1 min read'
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} min read`
}

/**
 * Debounce function for auto-save
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate a random color for tags
 */
export function generateRandomColor(): string {
  const colors = [
    '#D4A44F', // gold
    '#5EEAD4', // teal
    '#F87171', // red
    '#60A5FA', // blue
    '#34D399', // green
    '#A78BFA', // purple
    '#FBBF24', // yellow
    '#FB7185', // pink
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
