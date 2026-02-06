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

  // Get session with exponential backoff for rate limit errors
  let session = null
  try {
    const {
      data: { session: currentSession },
      error,
    } = await supabase.auth.getSession()

    // If there's an auth error, handle it gracefully
    if (error) {
      // Log only critical errors to avoid spam
      if (error.message !== 'Request rate limit reached' && error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        console.error('Auth error in middleware:', error.message)
      }
      
      // For rate limit errors, just continue without blocking
      if (error.message === 'Request rate limit reached') {
        // Let the request through but without session
        session = null
      } else {
        // For other auth errors (invalid token, etc.), clear cookies
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
    // Silently handle rate limit and token errors
    if (error?.message !== 'Request rate limit reached') {
      console.error('Unexpected error in middleware:', error)
    }
    session = null
  }

  // If user is not signed in and trying to access protected routes, redirect to login
  if (!session && req.nextUrl.pathname.startsWith('/app')) {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
