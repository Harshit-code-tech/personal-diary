import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

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
      {children}
    </ErrorBoundary>
  )
}
