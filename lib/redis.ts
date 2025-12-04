import { Redis } from '@upstash/redis'

// Initialize Redis client with Upstash
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ,
})

// Cache key prefixes for organization
export const CACHE_KEYS = {
  ENTRY: (userId: string, entryId: string) => `entry:${userId}:${entryId}`,
  ENTRIES: (userId: string) => `entries:${userId}`,
  FOLDERS: (userId: string) => `folders:${userId}`,
  PEOPLE: (userId: string) => `people:${userId}`,
  STORIES: (userId: string) => `stories:${userId}`,
  GOALS: (userId: string) => `goals:${userId}`,
  ANALYTICS: (userId: string) => `analytics:${userId}`,
  STREAKS: (userId: string) => `streaks:${userId}`,
  MOOD: (userId: string) => `mood:${userId}`,
  TAGS: (userId: string) => `tags:${userId}`,
  SEARCH: (userId: string, query: string) => `search:${userId}:${query}`,
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const

// Cache utilities
export const cacheUtils = {
  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Redis set error:', error)
      // Fail silently - app should work without cache
    }
  },

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? (JSON.parse(data as string) as T) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  },

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis del error:', error)
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis delPattern error:', error)
    }
  },

  /**
   * Invalidate all cache for a user
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      const keys = await redis.keys(`*:${userId}:*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis invalidateUser error:', error)
    }
  },

  /**
   * Check if cache is working
   */
  async healthCheck(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  },
}

// Rate limiting utilities
export const rateLimiter = {
  /**
   * Check if user exceeded rate limit
   * @returns { success: boolean, remaining: number, reset: number }
   */
  async check(
    userId: string,
    action: string,
    limit: number = 100,
    window: number = 3600 // 1 hour in seconds
  ): Promise<{ success: boolean; remaining: number; reset: number }> {
    const key = `ratelimit:${userId}:${action}`
    const now = Date.now()
    const windowMs = window * 1000

    try {
      // Get current count
      const current = await redis.get(key)
      const count = current ? parseInt(current as string) : 0

      if (count >= limit) {
        const ttl = await redis.ttl(key)
        return {
          success: false,
          remaining: 0,
          reset: now + ttl * 1000,
        }
      }

      // Increment counter
      await redis.incr(key)
      
      // Set expiry on first request
      if (count === 0) {
        await redis.expire(key, window)
      }

      return {
        success: true,
        remaining: limit - count - 1,
        reset: now + windowMs,
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open - allow request if Redis fails
      return {
        success: true,
        remaining: limit,
        reset: now + windowMs,
      }
    }
  },
}

export default redis
