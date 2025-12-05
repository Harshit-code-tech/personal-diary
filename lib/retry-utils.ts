// Exponential backoff retry utility for auth failures
// Helps handle Supabase rate limits gracefully

export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,    // Start with 500ms
  maxDelayMs: 5000,       // Max wait 5 seconds
  backoffMultiplier: 2,   // Double each time
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config }
  let lastError: Error | null = null
  let delay = finalConfig.initialDelayMs

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on non-network errors
      if (
        error instanceof Error &&
        !error.message.includes('rate limit') &&
        !error.message.includes('too many') &&
        !error.message.includes('429') &&
        !error.message.includes('timeout')
      ) {
        throw error
      }

      // Last attempt - throw error
      if (attempt === finalConfig.maxAttempts) {
        throw error
      }

      // Wait before retrying
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs)
    }
  }

  throw lastError || new Error('Retry failed')
}

// Exponential backoff with jitter (better for distributed systems)
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config }
  let lastError: Error | null = null
  let delay = finalConfig.initialDelayMs

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (
        error instanceof Error &&
        !error.message.includes('rate limit') &&
        !error.message.includes('too many') &&
        !error.message.includes('429')
      ) {
        throw error
      }

      if (attempt === finalConfig.maxAttempts) {
        throw error
      }

      // Add random jitter to prevent thundering herd
      const jitter = Math.random() * delay
      const actualDelay = delay + jitter
      
      console.log(`Attempt ${attempt} failed, retrying in ${Math.round(actualDelay)}ms with jitter...`)
      await new Promise(resolve => setTimeout(resolve, actualDelay))
      
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs)
    }
  }

  throw lastError
}
