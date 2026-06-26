/**
 * Secure HTML sanitization utilities
 *
 * Strategy:
 * - Client-side: DOMPurify (already installed, uses real browser DOM)
 * - Server-side: Aggressive strip — removes ALL HTML and returns plain text.
 *   This is intentionally conservative. The entry content is stored as HTML
 *   and rendered client-side where DOMPurify sanitizes it properly.
 *   Server-side rendering only needs plain text for previews/word count.
 */

// Lazily create a DOMPurify instance only in the browser
let clientPurifier: any = null

function getClientPurifier() {
  if (typeof window === 'undefined') return null
  if (clientPurifier) return clientPurifier

  const createDOMPurify = require('dompurify')
  clientPurifier = (createDOMPurify.default || createDOMPurify)(window)
  return clientPurifier
}

/**
 * Strip ALL HTML tags from content — returns plain text only.
 * Safe for word counting, search indexing, previews.
 *
 * Uses the browser DOM when available, falls back to a state-machine
 * parser on the server. The server parser is intentionally aggressive —
 * when in doubt, it strips rather than preserves.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''

  // Client-side: use the real DOM for reliable stripping
  if (typeof document !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll('script, style, svg, math, template').forEach((el) => el.remove())
    const text = doc.body.textContent || ''
    return text.replace(/\s+/g, ' ').trim()
  }

  // Server-side: state-machine parser. Strips ALL tags (no allowlist).
  // This is safe because server-side only needs plain text.
  let result = ''
  let inTag = false
  let inComment = false
  let inScript = false
  let inStyle = false
  let tagBuffer = '' // Buffer to detect tag names
  const len = html.length
  let i = 0

  while (i < len) {
    // Detect HTML comment start: <!--
    if (
      !inTag &&
      !inComment &&
      i + 3 < len &&
      html[i] === '<' &&
      html[i + 1] === '!' &&
      html[i + 2] === '-' &&
      html[i + 3] === '-'
    ) {
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
      tagBuffer = ''
      i++
      continue
    }

    // Inside a tag — buffer the tag name for detection
    if (inTag) {
      if (html[i] === '>') {
        inTag = false
        tagBuffer = ''
        i++
        continue
      }
      tagBuffer += html[i]
      i++
      continue
    }

    // Only collect text outside of tags, scripts, and styles
    if (!inScript && !inStyle) {
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
    '&apos;': "'",
  }

  let text = result
  for (const [entity, char] of Object.entries(entityMap)) {
    text = text.split(entity).join(char)
  }

  // Decode numeric HTML entities (&#NNN; and &#xHHH;)
  text = text.replace(/&#(\d+);/g, (_, code) => {
    const num = parseInt(code, 10)
    return num > 0 && num < 0x10ffff ? String.fromCodePoint(num) : ''
  })
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
    const num = parseInt(code, 16)
    return num > 0 && num < 0x10ffff ? String.fromCodePoint(num) : ''
  })

  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Sanitize HTML for safe display in the browser.
 * Uses DOMPurify with an explicit allowlist of safe tags/attributes.
 *
 * On the server, falls back to stripping ALL HTML (plain text).
 * This is safe because dangerouslySetInnerHTML only runs client-side
 * in React client components, where DOMPurify will sanitize properly.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Server-side: return plain text (no HTML rendering on server)
  if (typeof window === 'undefined') {
    return stripHtmlTags(html)
  }

  const purifier = getClientPurifier()
  if (!purifier) return stripHtmlTags(html)

  return purifier.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'span', 'div', 'sub', 'sup', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    // Extra hardening
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange'],
  })
}

/**
 * Count words in HTML content (strips HTML first)
 */
export function countWords(html: string): number {
  const text = stripHtmlTags(html)
  if (!text) return 0

  return text.split(/\s+/).filter((word) => word.length > 0).length
}
