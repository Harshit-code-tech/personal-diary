// Rate limiting utilities using in-memory storage
// For production, consider using Redis or Upstash

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
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: store[key].resetAt
        }
      }
      
      store[key].count++
      
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - store[key].count,
        reset: store[key].resetAt
      }
    }
  }
}

// Pre-configured rate limiters
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
})

export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
})

export const uploadLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 uploads per minute
})
