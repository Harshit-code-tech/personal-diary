import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import { ToastProvider } from '@/components/ui/ToastContainer'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
        <KeyboardShortcutsHelp />
        <OfflineIndicator />
      </ToastProvider>
    </ErrorBoundary>
  )
}
