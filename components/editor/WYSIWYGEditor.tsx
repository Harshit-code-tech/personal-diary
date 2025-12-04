'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, 
  Quote, Heading2, Image as ImageIcon, Link as LinkIcon, Undo, Redo,
  Table as TableIcon, Code
} from 'lucide-react'

// Create lowlight instance
const lowlight = createLowlight(common)

interface WYSIWYGEditorProps {
  content: string
  onChange: (html: string) => void
  onImageUpload?: (file: File) => Promise<string>
  placeholder?: string
}

export default function WYSIWYGEditor({ content, onChange, onImageUpload, placeholder }: WYSIWYGEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // Disable default code block
        link: false, // Exclude link from StarterKit to avoid duplication
      }),
      Underline.configure(),  // Explicitly configure to avoid duplication
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-charcoal/5 dark:bg-white/5 rounded-lg p-4 my-4 font-mono text-sm',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-charcoal/20 dark:border-white/20',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-charcoal/20 dark:border-white/20 bg-gold/10 dark:bg-teal/10 font-bold p-2 text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-charcoal/20 dark:border-white/20 p-2',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-gold dark:text-teal underline',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your diary entry...',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] text-charcoal dark:text-white',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync editor content when content prop changes (e.g., from template selection)
  // MUST be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const addImage = async () => {
    if (!onImageUpload) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const url = await onImageUpload(file)
          editor.chain().focus().setImage({ src: url }).run()
        } catch (error) {
          console.error('Failed to upload image:', error)
          toast.error('Failed to upload image. Please try again.')
        }
      }
    }
    input.click()
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border border-charcoal/20 dark:border-white/20 rounded-lg overflow-hidden bg-white dark:bg-graphite">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-charcoal/10 dark:border-white/10 bg-paper/50 dark:bg-midnight/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('bold') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4 text-charcoal dark:text-white" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('italic') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('underline') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('strike') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <div className="w-px h-6 bg-charcoal/10 dark:bg-white/10 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Heading"
        >
          <Heading2 className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('blockquote') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('codeBlock') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <div className="w-px h-6 bg-charcoal/10 dark:bg-white/10 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('table') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <div className="w-px h-6 bg-charcoal/10 dark:bg-white/10 mx-1"></div>

        {onImageUpload && (
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors"
            title="Add Image"
          >
            <ImageIcon className="w-4 h-4 text-charcoal dark:text-white" />
          </button>
        )}

        <button
          onClick={addLink}
          className={`p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors ${
            editor.isActive('link') ? 'bg-gold/20 dark:bg-teal/20' : ''
          }`}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <div className="w-px h-6 bg-charcoal/10 dark:bg-white/10 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4 text-charcoal dark:text-white" />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors disabled:opacity-30"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4 text-charcoal dark:text-white" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
