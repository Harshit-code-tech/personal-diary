/**
 * Sanitize error messages for API responses
 * Prevents exposing sensitive information in production
 */

/**
 * Returns a safe error message for API responses
 * In production: generic message
 * In development: actual error message
 */
export function getApiError(error: any): string {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred while processing your request'
  }
  return error?.message || 'Unknown error'
}

/**
 * Returns a safe error response object
 */
export function getApiErrorResponse(error: any, status: number = 500) {
  return {
    error: getApiError(error),
    status
  }
}

/**
 * Enforce same-origin + CSRF token for state-changing requests
 */
