import { NextResponse } from 'next/server'
import { getCSRFHeaderName } from '@/lib/csrf'
import { validateCSRFToken } from '@/lib/csrf-server'

/**
 * Enforce same-origin + CSRF token for state-changing requests
 */
export async function requireCsrf(request: Request) {
  const origin = request.headers.get('origin')

  if (origin) {
    let requestOrigin = ''
    try {
      requestOrigin = new URL(request.url).origin
    } catch {
      requestOrigin = ''
    }

    if (requestOrigin && origin !== requestOrigin) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  const headerToken = request.headers.get(getCSRFHeaderName()) || ''
  const isValid = await validateCSRFToken(headerToken)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  return null
}
