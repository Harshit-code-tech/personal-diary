import { NextResponse } from 'next/server'
import { setCSRFToken } from '@/lib/csrf-server'

export async function GET() {
  const token = await setCSRFToken()
  const response = NextResponse.json({ token })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
