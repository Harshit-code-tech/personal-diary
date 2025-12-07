/**
 * Secure HTML sanitization utilities
 * Using DOMPurify to prevent XSS attacks
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Safely strip all HTML tags from content
 * Returns plain text only - safe for word counting, previews, etc.
 * 
 * @param html - HTML string to sanitize
 * @returns Plain text with all HTML removed
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''
  
  // Use DOMPurify to completely remove all HTML tags
  // ALLOWED_TAGS: [] means no tags are allowed (strip everything)
  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content
  })
  
  return cleaned.trim()
}

/**
 * Sanitize HTML for safe display
 * Allows safe HTML tags, removes dangerous ones
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Count words in HTML content (strips HTML first)
 * 
 * @param html - HTML string
 * @returns Number of words
 */
export function countWords(html: string): number {
  const text = stripHtmlTags(html)
  if (!text) return 0
  
  return text.split(/\s+/).filter(word => word.length > 0).length
}
