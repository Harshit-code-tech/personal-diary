const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export function getCSRFHeaderName(): string {
  return CSRF_HEADER_NAME
}

export { CSRF_TOKEN_NAME }

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
