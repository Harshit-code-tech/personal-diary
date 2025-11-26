import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limit'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const identifier = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anonymous'
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
    const identifier = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success } = await authLimiter.check(`auth:${identifier}`)
    
    if (!success) {
      return new NextResponse(
        'Too many authentication attempts. Please try again in 15 minutes.',
        { status: 429 }
      )
    }
  }
  
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

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
  matcher: ['/app/:path*', '/login', '/signup'],
}
