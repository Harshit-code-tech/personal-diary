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
  
  // Use regex to strip HTML tags (server-side safe, no DOM needed)
  // Loop until stable to prevent bypass via nested tags like <scr<script>ipt>
  let text = html
  let prev = ''
  
  // Iteratively remove script/style tags and all HTML tags until no changes
  do {
    prev = text
    // Remove script and style tags with their content
    text = text
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove HTML comments (can hide malicious content)
    text = text.replace(/<!--[\s\S]*?-->/g, '')
    // Remove all other HTML tags
    text = text.replace(/<\/?[a-z][^>]*>/gi, '')
    // Remove any remaining angle-bracket fragments (e.g. orphaned < or >)
    text = text.replace(/<[^>]*$/g, '').replace(/^[^<]*>/g, '')
  } while (text !== prev)
  
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
  
  // Replace entities in a single pass to avoid double-escaping
  // Use a more robust replacement that handles entities properly
  for (const [entity, char] of Object.entries(entityMap)) {
    // Use a regex with global flag to replace all occurrences
    text = text.replace(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), char)
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
