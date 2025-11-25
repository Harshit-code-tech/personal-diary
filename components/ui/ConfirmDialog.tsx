'use client'

import { AlertTriangle, Trash2, X } from 'lucide-react'
import { ReactNode, useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: ReactNode
  loading?: boolean
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon,
  loading = false
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && !loading) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose, loading])

  if (!isOpen) return null

  const defaultIcons = {
    danger: <Trash2 className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    info: <AlertTriangle className="w-6 h-6 text-blue-500" />
  }

  const buttonStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white'
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        ref={dialogRef}
        className="bg-white dark:bg-graphite rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-gray-100 dark:bg-midnight">
            {icon || defaultIcons[type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3
              id="dialog-title"
              className="text-xl font-bold text-charcoal dark:text-white mb-2"
            >
              {title}
            </h3>
            <p
              id="dialog-description"
              className="text-charcoal/70 dark:text-white/70"
            >
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-charcoal/20 dark:border-white/20 font-semibold text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            onClick={() => {
              onConfirm()
              // Don't auto-close, let parent handle it after async operation
            }}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${buttonStyles[type]}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
