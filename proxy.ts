import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limit'

export async function proxy(req: NextRequest) {
  // Start with a mutable response that we can pass to Supabase
  let supabaseResponse = NextResponse.next({ request: req })
  const pathname = req.nextUrl.pathname
  const accept = req.headers.get('accept') || ''
  const isHtmlRequest = req.method === 'GET' && accept.includes('text/html')
  const hasCsrfCookie = Boolean(req.cookies.get('csrf_token'))

  // ── HMAC-signed CSRF token (Edge Runtime compatible) ──────────────────
  // Generates `nonce.signature` using Web Crypto API.
  // Must match the HMAC logic in csrf-server.ts (which uses Node crypto).
  const generateSignedCsrfToken = async () => {
    const nonce = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('')

    // Derive the same secret as csrf-server.ts
    const csrfSecret = process.env.CSRF_SECRET
    let secret: string
    if (csrfSecret) {
      secret = csrfSecret
    } else {
      const fallback =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.CRON_SECRET ||
        'personal-diary-csrf-fallback-change-me'
      // Derive secret the same way as csrf-server.ts
      const enc = new TextEncoder()
      const derivationKey = await crypto.subtle.importKey(
        'raw',
        enc.encode('csrf-key-derivation'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const derived = await crypto.subtle.sign('HMAC', derivationKey, enc.encode(fallback))
      secret = Array.from(new Uint8Array(derived), (b) => b.toString(16).padStart(2, '0')).join('')
    }

    // Sign the nonce
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(nonce))
    const signature = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')

    return `${nonce}.${signature}`
  }

  // ── Cookie forwarding for @supabase/ssr ────────────────────────────────
  // Captures cookies that Supabase sets (e.g. refreshed tokens) and applies
  // them to whatever response we ultimately return.
  let supabaseCookiesToForward: { name: string; value: string; options: CookieOptions }[] = []

  const createSupabaseClient = () => {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            // Capture for forwarding to final response
            supabaseCookiesToForward = cookiesToSet
            // Update the request so subsequent reads see refreshed cookies
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            // Update the default response
            supabaseResponse = NextResponse.next({ request: req })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  }

  // Apply Supabase auth cookies to any response we return
  const forwardSupabaseCookies = (response: NextResponse) => {
    supabaseCookiesToForward.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  const withCsrfCookie = async (response: NextResponse) => {
    if (isHtmlRequest && !hasCsrfCookie) {
      const token = await generateSignedCsrfToken()
      response.cookies.set('csrf_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
    }
    return response
  }

  // Helper: finalize any response with both CSRF + Supabase cookies
  const finalizeResponse = async (response: NextResponse) => {
    forwardSupabaseCookies(response)
    return await withCsrfCookie(response)
  }

  // ── Rate limiting for API routes ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Use x-real-ip first — set by Vercel's edge, cannot be spoofed by clients.
    // Fall back to last entry of x-forwarded-for (appended by infrastructure).
    const identifier = req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',').pop()?.trim()
      ?? 'anonymous'
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
    supabaseResponse.headers.set('X-RateLimit-Limit', limit.toString())
    supabaseResponse.headers.set('X-RateLimit-Remaining', remaining.toString())
    supabaseResponse.headers.set('X-RateLimit-Reset', reset.toString())

    // API routes don't need session refresh logic in proxy.
    // Returning early avoids refresh_token_not_found noise from server-to-server calls.
    return await finalizeResponse(supabaseResponse)
  }
  
  // ── Strict rate limiting for auth routes ──────────────────────────────
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    const identifier = req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',').pop()?.trim()
      ?? 'anonymous'
    const { success } = await authLimiter.check(identifier)
    
    if (!success) {
      return new NextResponse(
        'Too many authentication attempts. Please try again later.',
        { status: 429 }
      )
    }
  }
  
  const isProtectedRoute = pathname.startsWith('/app')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isAuthFlowRoute = pathname.startsWith('/auth/') // callback, reset-password etc.
  const hasSupabaseCookies = req.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'))

  // Auth flow routes (callback, reset-password) handle their own token exchange.
  // Do NOT run auth checks or clear cookies — they need code_verifier cookies intact.
  if (isAuthFlowRoute) {
    return await finalizeResponse(supabaseResponse)
  }

  // No cookies + protected route → redirect to login (no API call needed)
  if (isProtectedRoute && !hasSupabaseCookies) {
    return await finalizeResponse(NextResponse.redirect(new URL('/login', req.url)))
  }

  // No cookies + public route → pass through (no API call needed)
  if (!hasSupabaseCookies) {
    return await finalizeResponse(supabaseResponse)
  }

  // ── Auth check using getUser() (server-validated) ─────────────────────
  // getUser() validates the JWT against Supabase's server, unlike getSession()
  // which only decodes the JWT locally without verification.

  const clearSupabaseCookies = (response: NextResponse) => {
    req.cookies.getAll().forEach((cookie) => {
      // Preserve PKCE code_verifier cookies — they are needed for
      // password reset and email verification token exchange
      if (cookie.name.startsWith('sb-') && !cookie.name.includes('code-verifier')) {
        response.cookies.delete(cookie.name)
      }
    })
  }

  const supabase = createSupabaseClient()

  // Auth routes with cookies: quick user check to redirect logged-in users.
  // If the token is stale, just clear cookies and let them stay on login.
  if (isAuthRoute) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        return await finalizeResponse(NextResponse.redirect(new URL('/app', req.url)))
      }
    } catch (_) {
      // Ignore — stale token, network issue, etc.
    }
    // Clear stale cookies so the client SDK doesn't retry endlessly
    const authRes = NextResponse.next({ request: req })
    req.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        authRes.cookies.delete(cookie.name)
      }
    })
    return await finalizeResponse(authRes)
  }

  // Get user — handle network failures gracefully
  let user = null
  let isNetworkFailure = false
  try {
    const {
      data: { user: currentUser },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      const msg = error.message || ''
      const isNetwork = msg.includes('fetch failed') || msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('ECONNREFUSED')
      const isRateLimit = msg === 'Request rate limit reached'
      const isTokenError = msg === 'Invalid Refresh Token: Refresh Token Not Found'

      // Log only unexpected errors (skip rate limits and known token errors)
      if (!isRateLimit && !isTokenError && !isNetwork) {
        console.error('Auth error in proxy:', msg)
      }

      if (isRateLimit || isNetwork) {
        // Network failures / rate limits: mark as network failure
        user = null
        isNetworkFailure = isNetwork
      } else {
        // Genuine auth errors (invalid token, expired, etc.) — clear cookies
        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/login', req.url))
          : NextResponse.next({ request: req })
        
        clearSupabaseCookies(response)
        
        return await finalizeResponse(response)
      }
    } else {
      user = currentUser
    }
  } catch (error: any) {
    const msg = error?.message || ''
    const isNetwork = msg.includes('fetch failed') || msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('ECONNREFUSED')
    
    if (!isNetwork && msg !== 'Request rate limit reached') {
      console.error('Unexpected error in proxy:', error)
    }
    user = null
    isNetworkFailure = isNetwork
  }

  // If user is not authenticated and trying to access protected routes
  if (!user && isProtectedRoute) {
    // On network failure, redirect to login with a reason flag.
    // Previously this let the request through which was a security bypass.
    // The login page can show a "please try again" message.
    if (isNetworkFailure) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('reason', 'offline')
      return await finalizeResponse(NextResponse.redirect(loginUrl))
    }
    return await finalizeResponse(NextResponse.redirect(new URL('/login', req.url)))
  }

  // If user is signed in and trying to access auth pages, redirect to app
  if (user && isAuthRoute) {
    return await finalizeResponse(NextResponse.redirect(new URL('/app', req.url)))
  }

  return await finalizeResponse(supabaseResponse)
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
