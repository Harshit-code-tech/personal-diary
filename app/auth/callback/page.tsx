'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams?.get('code')
      
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error && data.user) {
          // Create default user settings if first time
          const { data: existingSettings } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', data.user.id)
            .single()
          
          if (!existingSettings) {
            const metadataUsername =
              (data.user.user_metadata?.username as string | undefined) ??
              (data.user.user_metadata?.display_name as string | undefined) ??
              (data.user.user_metadata?.name as string | undefined) ??
              null

            await supabase.from('user_settings').insert({
              user_id: data.user.id,
              email_reminders_enabled: false,
              ...(metadataUsername ? { username: metadataUsername.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 30) } : {}),
            })
          }
          
          router.push('/app')
        } else {
          router.push('/login?error=verification_failed')
        }
      }
    }

    handleCallback()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center book-page">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-charcoal/70 dark:text-white/70">Verifying your email...</p>
      </div>
    </div>
  )
}
