"use client"

import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/lib/error-logger'
import { queryClient } from '@/lib/cache-config'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Setup global error handler on mount
  useEffect(() => {
    setupGlobalErrorHandler()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#D4AF37',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {children}
    </QueryClientProvider>
  )
}
