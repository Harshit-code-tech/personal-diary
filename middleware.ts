import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limit'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
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
    return res
  }
  
  // Strict rate limiting for auth routes
  if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
    const identifier = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const { success } = await authLimiter.check(`auth:${identifier}`)
    
    if (!success) {
      return new NextResponse(
        'Too many authentication attempts. Please try again in 15 minutes.',
        { status: 429 }
      )
    }
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
        const response = req.nextUrl.pathname.startsWith('/app')
          ? NextResponse.redirect(new URL('/login', req.url))
          : NextResponse.next()
        
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        
        return response
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
  if (!session && req.nextUrl.pathname.startsWith('/app')) {
    // On network failure, let the request through — the user likely has valid
    // cookies that will work once Supabase is reachable again.
    // The client-side auth will handle showing login if truly unauthenticated.
    if (isNetworkFailure) {
      return res
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is signed in and trying to access auth pages, redirect to app
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', req.url))
  }

  return res
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
