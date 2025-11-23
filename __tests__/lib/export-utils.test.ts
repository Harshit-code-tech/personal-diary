import { describe, it, expect } from 'vitest'
import { stripHtml } from '@/lib/export-utils'

describe('Export Utils', () => {
  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>'
      const result = stripHtml(html)
      expect(result).toBe('Hello World')
    })

    it('handles empty string', () => {
      expect(stripHtml('')).toBe('')
    })

    it('handles text without HTML', () => {
      const text = 'Plain text'
      expect(stripHtml(text)).toBe('Plain text')
    })

    it('removes nested tags', () => {
      const html = '<div><p>Text <span>with <em>nested</em> tags</span></p></div>'
      const result = stripHtml(html)
      expect(result).toContain('Text with nested tags')
    })
  })
})
