// Custom error logging to Supabase
import { createClient } from '@/lib/supabase/client'

export interface ErrorLog {
  error_type: string
  error_message: string
  error_stack?: string
  user_id?: string
  path?: string
  user_agent?: string
  timestamp: string
  metadata?: Record<string, any>
}

/**
 * Sanitizes error objects to prevent data leaks in production
 */
function sanitizeError(error: Error | string): { message: string; type: string } {
  if (typeof error === 'string') {
    return { message: error, type: 'Error' }
  }
  
  // In production, don't expose detailed error messages
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An error occurred. Please try again.',
      type: error.name || 'Error'
    }
  }
  
  return {
    message: error.message,
    type: error.name || 'Error'
  }
}

/**
 * Safe console logger that doesn't leak data in production
 */
export function safeLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data)
  }
}

/**
 * Safe console error logger that doesn't leak data in production
 */
export function safeError(message: string, error?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error)
  }
  // In production, errors are only logged to Supabase, not console
}

export async function logError(error: Error | string, context?: {
  userId?: string
  path?: string
  metadata?: Record<string, any>
}) {
  try {
    const supabase = createClient()
    const sanitized = sanitizeError(error)
    
    const errorLog: ErrorLog = {
      error_type: sanitized.type,
      error_message: sanitized.message,
      // Never include stack traces in production
      error_stack: process.env.NODE_ENV === 'development' && typeof error !== 'string' ? error.stack : undefined,
      user_id: context?.userId,
      path: context?.path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      metadata: context?.metadata,
    }
    
    // Log to Supabase (only if not in development to avoid DB bloat)
    if (process.env.NODE_ENV !== 'development') {
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert(errorLog)
      
      if (dbError) {
        // Fail silently in production
        safeError('Failed to log error to Supabase:', dbError)
      }
    }
    
    // Only log to console in development
    safeError('Error logged:', errorLog)
  } catch (loggingError) {
    // Fail silently to avoid infinite loops
    safeError('Error logging failed:', loggingError)
  }
}

export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        metadata: { type: 'unhandledRejection' }
      }
    )
  })
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, {
      metadata: { 
        type: 'uncaughtError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })  
}

// Helper to show user-friendly error message
export function getUserFriendlyError(error: Error | string): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Something went wrong. Please try again.'
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return error.message || 'An unexpected error occurred'
}

// Helper to check if we should show detailed errors
export function shouldShowDetailedErrors(): boolean {
  return process.env.NODE_ENV === 'development'
}
