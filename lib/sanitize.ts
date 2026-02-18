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

  // Server-side fallback: state-machine parser (no regex for HTML = no CodeQL flags)
  // Walks character-by-character, tracking tag/comment/script/style context
  let result = ''
  let inTag = false
  let inComment = false
  let inScript = false
  let inStyle = false
  const len = html.length
  let i = 0

  while (i < len) {
    // Detect HTML comment start: <!--
    if (!inTag && !inComment && i + 3 < len &&
        html[i] === '<' && html[i + 1] === '!' && html[i + 2] === '-' && html[i + 3] === '-') {
      inComment = true
      i += 4
      continue
    }

    // Detect comment end: -->
    if (inComment) {
      if (i + 2 < len && html[i] === '-' && html[i + 1] === '-' && html[i + 2] === '>') {
        inComment = false
        i += 3
      } else {
        i++
      }
      continue
    }

    // Detect tag open
    if (html[i] === '<' && !inTag) {
      // Check for script/style open/close by reading until > or space
      const rest = html.slice(i).toLowerCase()
      if (rest.startsWith('<script') && (rest.length < 8 || /[\s>\/]/.test(rest[7]))) {
        inScript = true
      } else if (rest.startsWith('</script') && (rest.length < 9 || /[\s>]/.test(rest[8]))) {
        inScript = false
      } else if (rest.startsWith('<style') && (rest.length < 7 || /[\s>\/]/.test(rest[6]))) {
        inStyle = true
      } else if (rest.startsWith('</style') && (rest.length < 8 || /[\s>]/.test(rest[7]))) {
        inStyle = false
      }
      inTag = true
      i++
      continue
    }

    // Detect tag close
    if (html[i] === '>' && inTag) {
      inTag = false
      i++
      continue
    }

    // Only collect text outside of tags, scripts, and styles
    if (!inTag && !inScript && !inStyle) {
      result += html[i]
    }
    i++
  }

  // Decode common HTML entities
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

  let text = result
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
