import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { CSRF_TOKEN_NAME } from '@/lib/csrf'

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return token
}

export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value
}

export async function validateCSRFToken(headerToken: string): Promise<boolean> {
  const cookieToken = await getCSRFToken()

  if (!cookieToken || !headerToken) {
    return false
  }

  return cookieToken === headerToken
}
