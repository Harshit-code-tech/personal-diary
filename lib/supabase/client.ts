import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null
let cleanupScheduled = false

export const createClient = () => {
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // One-time check: if the stored token is stale, sign out immediately
    // to stop the SDK from retrying /token endlessly
    if (!cleanupScheduled && typeof window !== 'undefined') {
      cleanupScheduled = true
      clientInstance.auth.getSession().then(({ error }) => {
        if (
          error &&
          (error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('Invalid Refresh Token'))
        ) {
          console.warn('[auth] Stale refresh token detected — signing out to clear cookies')
          clientInstance?.auth.signOut().catch(() => {})
        }
      })
    }
  }
  return clientInstance
}
