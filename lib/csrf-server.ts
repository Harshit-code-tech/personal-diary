import { cookies } from 'next/headers'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { CSRF_TOKEN_NAME } from '@/lib/csrf'

// ─── HMAC secret ────────────────────────────────────────────────────────────
// Prefer a dedicated CSRF_SECRET env var. Fall back to a deterministic
// derivation from the Supabase service key so existing deployments don't
// break immediately — but log a warning so devs add the dedicated secret.

function getSecret(): string {
  if (process.env.CSRF_SECRET) {
    return process.env.CSRF_SECRET
  }

  const fallback =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET ||
    'personal-diary-csrf-fallback-change-me'

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[security] CSRF_SECRET env var is not set. ' +
        'Using a derived secret. Set CSRF_SECRET for best security.'
    )
  }

  // Derive a stable secret from whatever we have
  return createHmac('sha256', 'csrf-key-derivation')
    .update(fallback)
    .digest('hex')
}

// ─── Token helpers ──────────────────────────────────────────────────────────

function signNonce(nonce: string): string {
  return createHmac('sha256', getSecret()).update(nonce).digest('hex')
}

/**
 * Generate a signed CSRF token: `nonce.signature`
 * The client reads the full value from the cookie and sends it as a header.
 * The server splits it, re-signs the nonce, and checks the signature.
 */
export function generateCSRFToken(): string {
  const nonce = randomBytes(32).toString('hex')
  const signature = signNonce(nonce)
  return `${nonce}.${signature}`
}

export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false, // Client JS needs to read this to send as header
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

/**
 * Validate a CSRF token by verifying the HMAC signature.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function validateCSRFToken(
  headerToken: string
): Promise<boolean> {
  const cookieToken = await getCSRFToken()

  if (!cookieToken || !headerToken) {
    return false
  }

  // Both cookie and header must carry the same signed token
  if (cookieToken !== headerToken) {
    return false
  }

  // Now verify the HMAC signature is valid
  const dotIndex = headerToken.indexOf('.')
  if (dotIndex === -1) {
    return false
  }

  const nonce = headerToken.slice(0, dotIndex)
  const receivedSig = headerToken.slice(dotIndex + 1)

  if (!nonce || !receivedSig) {
    return false
  }

  const expectedSig = signNonce(nonce)

  // Timing-safe comparison
  try {
    const sigBuffer = Buffer.from(receivedSig, 'hex')
    const expectedBuffer = Buffer.from(expectedSig, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}
