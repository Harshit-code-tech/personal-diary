/**
 * Safe toast notifications that don't expose sensitive error details
 */
import toast from 'react-hot-toast'
import { getUserFriendlyError } from './error-logger'

/**
 * Show error toast with sanitized message
 * In production: shows generic error
 * In development: shows actual error message
 */
export function showErrorToast(error: Error | string, customMessage?: string) {
  const message = customMessage || getUserFriendlyError(error)
  toast.error(message)
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message)
}

/**
 * Show info toast
 */
export function showInfoToast(message: string) {
  toast(message)
}

/**
 * Show loading toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message)
}

/**
 * Dismiss toast by id
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId)
}
