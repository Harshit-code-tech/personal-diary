// Rate limiting utilities — Redis-backed for serverless (Vercel)
// Uses Upstash Redis for shared state across serverless invocations.
// Falls back to in-memory only when Redis is unreachable.

import { redis } from '@/lib/redis'

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

// ─── In-memory fallback (used only when Redis is down) ───────────────────────

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const memoryStore: RateLimitStore = {}

// Clean up expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const key of Object.keys(memoryStore)) {
      if (memoryStore[key].resetAt < now) {
        delete memoryStore[key]
      }
    }
  }, 10 * 60 * 1000)
}

function inMemoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()

  if (!memoryStore[key] || memoryStore[key].resetAt < now) {
    memoryStore[key] = { count: 1, resetAt: now + config.interval }
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: memoryStore[key].resetAt,
    }
  }

  if (memoryStore[key].count >= config.limit) {
    const retryAfter = Math.ceil((memoryStore[key].resetAt - now) / 1000)
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: memoryStore[key].resetAt,
      retryAfter,
    }
  }

  memoryStore[key].count++
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - memoryStore[key].count,
    reset: memoryStore[key].resetAt,
  }
}

// ─── Redis-backed check (primary) ───────────────────────────────────────────

async function redisCheck(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return inMemoryCheck(key, config)
  }

  const windowSeconds = Math.ceil(config.interval / 1000)
  const redisKey = `rl:${key}`
  const now = Date.now()

  try {
    // Atomic increment + set expiry on first hit
    const count = await redis.incr(redisKey)

    if (count === 1) {
      // First request in this window — set the TTL
      await redis.expire(redisKey, windowSeconds)
    }

    const ttl = await redis.ttl(redisKey)
    // If TTL is -1 (no expiry set — race condition), set it now
    if (ttl === -1) {
      await redis.expire(redisKey, windowSeconds)
    }

    const resetAt = now + (ttl > 0 ? ttl * 1000 : config.interval)

    if (count > config.limit) {
      const retryAfter = Math.ceil((resetAt - now) / 1000)
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: resetAt,
        retryAfter: retryAfter > 0 ? retryAfter : 1,
      }
    }

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - count,
      reset: resetAt,
    }
  } catch (error) {
    // Redis is down — fall back to in-memory (better than no protection)
    console.error('Redis rate limit error, falling back to in-memory:', error)
    return inMemoryCheck(key, config)
  }
}

// ─── Public API (same interface as before) ──────────────────────────────────

export function rateLimit(config: RateLimitConfig, action: string) {
  return {
    check: async (identifier: string): Promise<RateLimitResult> => {
      const key = `${identifier}:${action}`
      return redisCheck(key, config)
    },
    // Reset for testing purposes
    reset: async (identifier: string) => {
      const key = `${identifier}:${action}`
      delete memoryStore[key]
      if (redis) {
        try {
          await redis.del(`rl:${key}`)
        } catch {
          // Ignore — test utility
        }
      }
    },
  }
}

// ─── Pre-configured limiters ────────────────────────────────────────────────

export const apiLimiter = rateLimit(
  {
    interval: 60 * 1000, // 1 minute
    limit: 20, // 20 requests per minute
  },
  'api'
)

// Auth limiter: stricter to prevent brute force
// Supabase limit: 30 per 5 min; we allow 8 per 1 min
export const authLimiter = rateLimit(
  {
    interval: 60 * 1000, // 1 minute
    limit: 8, // 8 attempts per minute per IP
  },
  'auth'
)

export const uploadLimiter = rateLimit(
  {
    interval: 60 * 1000, // 1 minute
    limit: 5, // 5 uploads per minute
  },
  'upload'
)
