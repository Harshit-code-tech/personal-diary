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

export async function logError(error: Error | string, context?: {
  userId?: string
  path?: string
  metadata?: Record<string, any>
}) {
  try {
    const supabase = createClient()
    
    const errorLog: ErrorLog = {
      error_type: typeof error === 'string' ? 'Error' : error.name || 'Error',
      error_message: typeof error === 'string' ? error : error.message,
      error_stack: typeof error === 'string' ? undefined : error.stack,
      user_id: context?.userId,
      path: context?.path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      metadata: context?.metadata,
    }
    
    // Log to Supabase
    const { error: dbError } = await supabase
      .from('error_logs')
      .insert(errorLog)
    
    if (dbError) {
      console.error('Failed to log error to Supabase:', dbError)
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog)
    }
  } catch (loggingError) {
    // Fail silently to avoid infinite loops
    console.error('Error logging failed:', loggingError)
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
