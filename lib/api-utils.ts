import { NextResponse } from 'next/server'
import { getCSRFHeaderName, validateCSRFToken } from '@/lib/csrf'

/**
 * Sanitize error messages for API responses
 * Prevents exposing sensitive information in production
 */

/**
 * Returns a safe error message for API responses
 * In production: generic message
 * In development: actual error message
 */
export function getApiError(error: any): string {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred while processing your request'
  }
  return error?.message || 'Unknown error'
}

/**
 * Returns a safe error response object
 */
export function getApiErrorResponse(error: any, status: number = 500) {
  return {
    error: getApiError(error),
    status
  }
}

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
