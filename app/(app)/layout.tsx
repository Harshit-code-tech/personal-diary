import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import OnboardingTour from '@/components/ui/OnboardingTour'
import { ToastProvider } from '@/components/ui/ToastContainer'
import KeyboardShortcutsProvider from '@/components/providers/KeyboardShortcutsProvider'

// Force dynamic rendering for all /app routes (they use authentication/cookies)
export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <KeyboardShortcutsProvider />
        <OnboardingTour />
        <div className="book-page min-h-screen">
          {children}
        </div>
        <KeyboardShortcutsHelp />
        <OfflineIndicator />
      </ToastProvider>
    </ErrorBoundary>
  )
}
