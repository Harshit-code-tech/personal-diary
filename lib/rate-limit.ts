// Rate limiting utilities - optimized for Supabase Free Tier
// Supabase free tier: 30 auth attempts per 5 minutes per IP
// Strategy: Client-side limiting to prevent unnecessary requests

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 10 * 60 * 1000)

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

export function rateLimit(config: RateLimitConfig) {
  return {
    check: async (identifier: string): Promise<RateLimitResult> => {
      const now = Date.now()
      const key = `${identifier}`
      
      if (!store[key] || store[key].resetAt < now) {
        store[key] = {
          count: 1,
          resetAt: now + config.interval
        }
        
        return {
          success: true,
          limit: config.limit,
          remaining: config.limit - 1,
          reset: store[key].resetAt
        }
      }
      
      if (store[key].count >= config.limit) {
        const retryAfter = Math.ceil((store[key].resetAt - now) / 1000)
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: store[key].resetAt,
          retryAfter
        }
      }
      
      store[key].count++
      
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - store[key].count,
        reset: store[key].resetAt
      }
    },
    // Reset for testing purposes
    reset: (identifier: string) => {
      delete store[`${identifier}`]
    }
  }
}

// Pre-configured rate limiters
// Supabase Free Tier: 30 attempts per 5 minutes per IP
// Our limits are MORE restrictive to be safe:

export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 20, // 20 requests per minute (conservative)
})

// Auth limiter: More lenient to handle legitimate retries
// Supabase limit: 30 per 5 min, we allow 4 per 1 min = 240 per 2 hours (safe)
export const authLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 4, // 4 attempts per minute
})

export const uploadLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 5, // 5 uploads per minute
})
