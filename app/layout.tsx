import './globals.css'
import type { Metadata } from 'next'
import { Inter, Lora, Playfair_Display, Caveat, Source_Serif_4 } from 'next/font/google'
import QueryProvider from '@/components/providers/QueryProvider'
import ServiceWorkerRegistration from '@/components/providers/ServiceWorkerRegistration'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({ 
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
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
    { media: '(prefers-color-scheme: light)', color: '#8B5E3C' },
    { media: '(prefers-color-scheme: dark)', color: '#D4A44F' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} ${playfair.variable} ${caveat.variable} ${sourceSerif.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          {children}
        </QueryProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
