import './globals.css'
import type { Metadata } from 'next'
import { Inter, Crimson_Pro, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import QueryProvider from '@/components/providers/QueryProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const crimsonPro = Crimson_Pro({ 
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Noted. - Your Private Journaling Space',
    template: '%s | Noted.'
  },
  description: 'A secure, private journaling platform built with Next.js and Supabase. Write, organize, and reflect on your thoughts with rich text editing, folders, mood tracking, and more.',
  keywords: ['diary', 'journal', 'personal journal', 'digital diary', 'private notes', 'journaling app', 'mood tracker', 'daily journal', 'noted'],
  authors: [{ name: 'Noted.' }],
  creator: 'Noted.',
  publisher: 'Noted.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Noted.',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Noted. - Your Private Journaling Space',
    description: 'A secure, private journaling platform for your thoughts, memories, and reflections.',
    siteName: 'Noted.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noted. - Your Private Journaling Space',
    description: 'A secure, private journaling platform for your thoughts, memories, and reflections.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#D4A44F' },
    { media: '(prefers-color-scheme: dark)', color: '#5EEAD4' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${crimsonPro.variable} ${playfair.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
