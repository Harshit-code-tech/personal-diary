'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let cancelled = false

    const registerServiceWorker = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()

        await Promise.all(
          registrations
            .filter((registration) => {
              const scriptUrl =
                registration.active?.scriptURL ||
                registration.installing?.scriptURL ||
                registration.waiting?.scriptURL ||
                ''

              return !scriptUrl.endsWith('/sw-custom.js')
            })
            .map((registration) => registration.unregister())
        )

        if (!cancelled && process.env.NODE_ENV === 'production') {
          await navigator.serviceWorker.register('/sw-custom.js', { scope: '/' })
        }
      } catch (error) {
        console.error('Failed to register service worker:', error)
      }
    }

    if (document.readyState === 'complete') {
      void registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', registerServiceWorker)
    }
  }, [])

  return null
}