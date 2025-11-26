// CSRF Token generation and validation
import { cookies } from 'next/headers'

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export function generateCSRFToken(): string {
  // Generate a random token
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array)
  } else {
    // Node.js environment
    const crypto = require('crypto')
    crypto.randomFillSync(array)
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = cookies()
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  
  return token
}

export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value
}

export async function validateCSRFToken(headerToken: string): Promise<boolean> {
  const cookieToken = await getCSRFToken()
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  return cookieToken === headerToken
}

export function getCSRFHeaderName(): string {
  return CSRF_HEADER_NAME
}

// Client-side CSRF token retrieval
export function getClientCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_TOKEN_NAME) {
      return value
    }
  }
  return null
}
