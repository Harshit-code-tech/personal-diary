import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limit'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname
  const accept = req.headers.get('accept') || ''
  const isHtmlRequest = req.method === 'GET' && accept.includes('text/html')
  const hasCsrfCookie = Boolean(req.cookies.get('csrf_token'))

  const generateCsrfToken = () => {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  const withCsrfCookie = (response: NextResponse) => {
    if (isHtmlRequest && !hasCsrfCookie) {
      response.cookies.set('csrf_token', generateCsrfToken(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
    }
    return response
  }
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const identifier = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const { success, limit, remaining, reset } = await apiLimiter.check(identifier)
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    
    // Add rate limit headers to response
    res.headers.set('X-RateLimit-Limit', limit.toString())
    res.headers.set('X-RateLimit-Remaining', remaining.toString())
    res.headers.set('X-RateLimit-Reset', reset.toString())

    // API routes don't need session refresh logic in middleware.
    // Returning early avoids refresh_token_not_found noise from server-to-server calls.
    return withCsrfCookie(res)
  }
  
  // Strict rate limiting for auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    const identifier = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const { success } = await authLimiter.check(identifier)
    
    if (!success) {
      return new NextResponse(
        'Too many authentication attempts. Please try again in 15 minutes.',
        { status: 429 }
      )
    }
  }
  
  const isProtectedRoute = pathname.startsWith('/app')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const hasSupabaseCookies = req.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'))

  // No cookies + protected route → redirect to login (no API call needed)
  if (isProtectedRoute && !hasSupabaseCookies) {
    return withCsrfCookie(NextResponse.redirect(new URL('/login', req.url)))
  }

  // No cookies + public route → pass through (no API call needed)
  if (!hasSupabaseCookies) {
    return withCsrfCookie(res)
  }

  // Auth routes with cookies: quick session check to redirect logged-in users.
  // If the token is stale, just clear cookies and let them stay on login — NO retry.
  if (isAuthRoute) {
    try {
      const supabase = createMiddlewareClient({ req, res })
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session && !error) {
        return withCsrfCookie(NextResponse.redirect(new URL('/app', req.url)))
      }
    } catch (_) {
      // Ignore — stale token, network issue, etc.
    }
    // Clear stale cookies so the client SDK doesn't retry endlessly
    const authRes = NextResponse.next()
    req.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        authRes.cookies.delete(cookie.name)
      }
    })
    return withCsrfCookie(authRes)
  }

  const clearSupabaseCookies = (response: NextResponse) => {
    req.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name)
      }
    })
  }

  const supabase = createMiddlewareClient({ req, res })

  // Get session — handle network failures gracefully
  let session = null
  let isNetworkFailure = false
  try {
    const {
      data: { session: currentSession },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      const msg = error.message || ''
      const isNetwork = msg.includes('fetch failed') || msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('ECONNREFUSED')
      const isRateLimit = msg === 'Request rate limit reached'
      const isTokenError = msg === 'Invalid Refresh Token: Refresh Token Not Found'

      // Log only unexpected errors (skip rate limits and known token errors)
      if (!isRateLimit && !isTokenError && !isNetwork) {
        console.error('Auth error in middleware:', msg)
      }

      if (isRateLimit || isNetwork) {
        // Network failures / rate limits: let request through, preserve cookies
        session = null
        isNetworkFailure = isNetwork
      } else {
        // Genuine auth errors (invalid token, expired, etc.) — clear cookies
        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/login', req.url))
          : NextResponse.next()
        
        clearSupabaseCookies(response)
        
        return withCsrfCookie(response)
      }
    } else {
      session = currentSession
    }
  } catch (error: any) {
    const msg = error?.message || ''
    const isNetwork = msg.includes('fetch failed') || msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('ECONNREFUSED')
    
    if (!isNetwork && msg !== 'Request rate limit reached') {
      console.error('Unexpected error in middleware:', error)
    }
    session = null
    isNetworkFailure = isNetwork
  }

  // If user is not signed in and trying to access protected routes
  if (!session && isProtectedRoute) {
    // On network failure, let the request through — the user likely has valid
    // cookies that will work once Supabase is reachable again.
    // The client-side auth will handle showing login if truly unauthenticated.
    if (isNetworkFailure) {
      return withCsrfCookie(res)
    }
    return withCsrfCookie(NextResponse.redirect(new URL('/login', req.url)))
  }

  // If user is signed in and trying to access auth pages, redirect to app
  if (session && isAuthRoute) {
    return withCsrfCookie(NextResponse.redirect(new URL('/app', req.url)))
  }

  return withCsrfCookie(res)
}

export const config = {
  matcher: [
    '/api/:path*',
    '/app/:path*',
    '/login',
    '/signup',
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw-custom.js|robots.txt|sitemap.xml|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|map|json|ico|txt|webmanifest)$).*)',
  ],
}
