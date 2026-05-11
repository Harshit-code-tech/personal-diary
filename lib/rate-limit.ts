// Rate limiting utilities - optimized for Supabase Free Tier
// Supabase free tier: 30 auth attempts per 5 minutes per IP
// Strategy: Use Upstash Redis when configured, fallback to in-memory

import { rateLimiter as upstashRateLimiter } from '@/lib/redis'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}
const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

export interface RateLimitConfig {
  interval: number // in milliseconds
  limit: number // max requests per interval
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number // Seconds to wait before retry
}

function inMemoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()

  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + config.interval,
    }

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: store[key].resetAt,
    }
  }

  if (store[key].count >= config.limit) {
    const retryAfter = Math.ceil((store[key].resetAt - now) / 1000)
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: store[key].resetAt,
      retryAfter,
    }
  }

  store[key].count++

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - store[key].count,
    reset: store[key].resetAt,
  }
}

export function rateLimit(config: RateLimitConfig, action: string) {
  return {
    check: async (identifier: string): Promise<RateLimitResult> => {
      if (isUpstashConfigured) {
        const windowSeconds = Math.max(1, Math.ceil(config.interval / 1000))
        const result = await upstashRateLimiter.check(
          identifier,
          action,
          config.limit,
          windowSeconds
        )

        const retryAfter = result.success
          ? undefined
          : Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))

        return {
          success: result.success,
          limit: config.limit,
          remaining: result.remaining,
          reset: result.reset,
          retryAfter,
        }
      }

      const key = `${identifier}:${action}`
      return inMemoryCheck(key, config)
    },
    // Reset for testing purposes
    reset: (identifier: string) => {
      delete store[`${identifier}:${action}`]
    },
  }
}

// Pre-configured rate limiters
// Supabase Free Tier: 30 attempts per 5 minutes per IP
// Our limits are MORE restrictive to be safe:

export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 20, // 20 requests per minute (conservative)
}, 'api')

// Auth limiter: Lenient for legitimate user retries on mobile
// Supabase limit: 30 per 5 min, we allow 8 per 1 min = 480 per 1 hour (safe)
// Mobile users often retry on slow networks, so we're lenient
export const authLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 8, // 8 attempts per minute per IP - more generous for mobile
}, 'auth')

export const uploadLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 5, // 5 uploads per minute
}, 'upload')
