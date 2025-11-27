import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import OnboardingTour from '@/components/ui/OnboardingTour'
import { ToastProvider } from '@/components/ui/ToastContainer'
import KeyboardShortcutsProvider from '@/components/providers/KeyboardShortcutsProvider'

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
        <KeyboardShortcutsProvider />
        <OnboardingTour />
        {children}
        <KeyboardShortcutsHelp />
        <OfflineIndicator />
      </ToastProvider>
    </ErrorBoundary>
  )
}
