'use client'

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 300) // Match animation duration
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />
  }

  const styles = {
    success: 'bg-green-500 dark:bg-green-600 text-white',
    error: 'bg-red-500 dark:bg-red-600 text-white',
    info: 'bg-blue-500 dark:bg-blue-600 text-white',
    warning: 'bg-amber-500 dark:bg-amber-600 text-white'
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-lg border border-white/10
        ${styles[type]}
        ${isExiting ? 'animate-slideOut' : 'animate-slideIn'}
        min-w-[320px] max-w-md
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold mb-0.5">{title}</h4>
        {message && (
          <p className="text-sm opacity-90 line-clamp-2">{message}</p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors active:scale-95"
        aria-label="Close notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

export default Toast
