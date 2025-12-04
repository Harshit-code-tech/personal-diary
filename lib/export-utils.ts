import jsPDF from 'jspdf'
import DOMPurify from 'isomorphic-dompurify'

type Entry = {
  id: string
  title: string
  content: string
  entry_date: string
  mood?: string | null
  word_count?: number
  tags?: string[] | null
}

/**
 * Strip HTML tags and return plain text with proper formatting
 */
export function stripHtml(html: string): string {
  // First sanitize to remove all HTML tags
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
  
  // Replace common HTML entities
  return clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Export entries to Markdown format
 */
export function exportToMarkdown(entries: Entry[]): string {
  let markdown = '# Noted. - My Journal Entries\n\n'
  markdown += `> Exported on ${new Date().toLocaleDateString()}\n\n`
  markdown += `Total Entries: ${entries.length}\n\n`
  markdown += '---\n\n'

  entries.forEach((entry, index) => {
    markdown += `## ${index + 1}. ${entry.title}\n\n`
    
    // Metadata
    markdown += `**Date:** ${new Date(entry.entry_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n\n`
    
    if (entry.mood) {
      markdown += `**Mood:** ${entry.mood}\n\n`
    }
    
    if (entry.tags && entry.tags.length > 0) {
      markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`
    }
    
    if (entry.word_count) {
      markdown += `**Word Count:** ${entry.word_count}\n\n`
    }

    // Content
    const plainText = stripHtml(entry.content)
    markdown += `${plainText}\n\n`
    markdown += '---\n\n'
  })

  return markdown
}

/**
 * Export entries to PDF format
 */
export async function exportToPDF(entries: Entry[]): Promise<void> {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Helper to add new page
  const addNewPage = () => {
    pdf.addPage()
    yPosition = margin
  }

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      addNewPage()
    }
  }

  // Title page
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Noted. - Journal Entries', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Exported on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10
  pdf.text(`Total Entries: ${entries.length}`, pageWidth / 2, yPosition, { align: 'center' })
  
  addNewPage()

  // Process each entry
  entries.forEach((entry, index) => {
    // Title
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    checkPageBreak(20)
    const titleLines = pdf.splitTextToSize(`${index + 1}. ${entry.title}`, maxWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 7 + 5

    // Metadata
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'italic')
    checkPageBreak(10)
    
    const date = new Date(entry.entry_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    pdf.text(`Date: ${date}`, margin, yPosition)
    yPosition += 6

    if (entry.mood) {
      checkPageBreak(6)
      pdf.text(`Mood: ${entry.mood}`, margin, yPosition)
      yPosition += 6
    }

    if (entry.tags && entry.tags.length > 0) {
      checkPageBreak(6)
      pdf.text(`Tags: ${entry.tags.join(', ')}`, margin, yPosition)
      yPosition += 6
    }

    if (entry.word_count) {
      checkPageBreak(6)
      pdf.text(`Word Count: ${entry.word_count}`, margin, yPosition)
      yPosition += 6
    }

    yPosition += 5

    // Content
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    const plainText = stripHtml(entry.content)
    const contentLines = pdf.splitTextToSize(plainText, maxWidth)
    
    contentLines.forEach((line: string) => {
      checkPageBreak(7)
      pdf.text(line, margin, yPosition)
      yPosition += 6
    })

    // Separator
    yPosition += 10
    checkPageBreak(5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15
  })

  // Save the PDF
  const fileName = `diary-export-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

/**
 * Download markdown file
 */
export function downloadMarkdown(markdown: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `diary-export-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export single entry to markdown
 */
export function exportSingleEntryToMarkdown(entry: Entry): string {
  let markdown = `# ${entry.title}\n\n`
  
  markdown += `**Date:** ${new Date(entry.entry_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}\n\n`
  
  if (entry.mood) {
    markdown += `**Mood:** ${entry.mood}\n\n`
  }
  
  if (entry.tags && entry.tags.length > 0) {
    markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`
  }
  
  if (entry.word_count) {
    markdown += `**Word Count:** ${entry.word_count}\n\n`
  }

  markdown += '---\n\n'
  
  const plainText = stripHtml(entry.content)
  markdown += `${plainText}\n`

  return markdown
}

/**
 * Export entries to JSON format
 */
export function exportToJSON(entries: Entry[]): string {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries.map(entry => ({
      ...entry,
      content: stripHtml(entry.content) // Convert HTML to plain text
    }))
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * Download JSON file
 */
export function downloadJSON(json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `diary-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export entries to CSV format
 */
export function exportToCSV(entries: Entry[]): string {
  // CSV Headers
  const headers = ['Date', 'Title', 'Content', 'Mood', 'Word Count', 'Tags']
  
  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  
  // Build CSV rows
  const rows = entries.map(entry => {
    const date = new Date(entry.entry_date).toLocaleDateString('en-US')
    // Strip HTML and clean up content thoroughly
    let content = stripHtml(entry.content)
    // Remove multiple spaces and newlines
    content = content.replace(/\s+/g, ' ').trim()
    const tags = entry.tags ? entry.tags.join('; ') : ''
    
    return [
      escapeCSV(date),
      escapeCSV(entry.title),
      escapeCSV(content),
      escapeCSV(entry.mood || ''),
      escapeCSV(entry.word_count || ''),
      escapeCSV(tags)
    ].join(',')
  })
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Download CSV file with UTF-8 BOM for proper emoji support
 */
export function downloadCSV(csv: string): void {
  // Add UTF-8 BOM (Byte Order Mark) to ensure proper encoding
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csv
  
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `diary-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
