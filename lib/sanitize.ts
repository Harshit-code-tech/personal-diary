/**
 * Secure HTML sanitization utilities
 */

// Lazily create a DOMPurify instance only in the browser to avoid jsdom/parse5 in serverless
let clientPurifier: any = null

function getClientPurifier() {
  if (typeof window === 'undefined') return null
  if (clientPurifier) return clientPurifier

  // dompurify exports a factory that expects a Window instance
  const createDOMPurify = require('dompurify')
  clientPurifier = (createDOMPurify.default || createDOMPurify)(window)
  return clientPurifier
}

/**
 * Safely strip all HTML tags from content
 * Returns plain text only - safe for word counting, previews, etc.
 * 
 * @param html - HTML string to sanitize
 * @returns Plain text with all HTML removed
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''

  // On the client side, use the DOM for reliable HTML stripping
  if (typeof document !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    // Remove script and style elements entirely
    doc.querySelectorAll('script, style').forEach(el => el.remove())
    const text = doc.body.textContent || ''
    return text.replace(/\s+/g, ' ').trim()
  }

  // Server-side fallback: use iterative regex stripping
  let text = html

  // Phase 1: Remove script/style blocks (iterate until fully removed to handle nesting)
  let scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi
  while (scriptPattern.test(text)) {
    text = text.replace(scriptPattern, '')
    scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi
  }
  let stylePattern = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style\s*>/gi
  while (stylePattern.test(text)) {
    text = text.replace(stylePattern, '')
    stylePattern = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style\s*>/gi
  }

  // Phase 2: Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Phase 3: Remove all HTML tags iteratively until stable
  // Use a non-greedy match for tag content to handle attributes safely
  let tagPattern = /<\/?[a-z][a-z0-9]*\b[^>]*\/?>/gi
  let previous = ''
  while (text !== previous) {
    previous = text
    text = text.replace(tagPattern, '')
    tagPattern = /<\/?[a-z][a-z0-9]*\b[^>]*\/?>/gi
  }

  // Phase 4: Remove any orphaned angle brackets
  text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // Decode HTML entities using a safe approach
  const entityMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#x27;': "'",
    '&apos;': "'"
  }
  
  for (const [entity, char] of Object.entries(entityMap)) {
    text = text.split(entity).join(char)
  }
  
  // Normalize whitespace
  return text.replace(/\s+/g, ' ').trim()
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

  // Server-side render: strip tags to avoid pulling in jsdom/parse5
  if (typeof window === 'undefined') {
    return stripHtmlTags(html)
  }

  const purifier = getClientPurifier()
  if (!purifier) return stripHtmlTags(html)

  return purifier.sanitize(html, {
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
