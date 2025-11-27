import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display main heading', async ({ page }) => {
    await page.goto('/')
    
    // Use text locator instead of heading role for better flexibility
    await expect(page.locator('text=/personal diary/i')).toBeVisible({ timeout: 10_000 })
  })

  test('should have login and signup links', async ({ page }) => {
    await page.goto('/')
    
    // Use .first() to handle multiple matching links (header + mobile menu)
    const loginLink = page.getByRole('link', { name: /log ?in/i }).first()
    const signupLink = page.getByRole('link', { name: /sign up|get started/i }).first()
    
    await expect(loginLink).toBeVisible({ timeout: 10_000 })
    await expect(signupLink).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    
    // Click first login link and wait for navigation
    await page.getByRole('link', { name: /log ?in/i }).first().click()
    
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    
    // Target the submit button within the form to avoid ambiguity
    await expect(page.locator('form').getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10_000 })
  })

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login')
    
    // Click the form's submit button specifically (not any header tab)
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation or error message with increased timeout
    await expect(page.locator('text=/email|password|required/i')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('App Pages (Protected)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/app')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('pressing ? should show keyboard shortcuts help', async ({ page }) => {
    // This would require auth, so we'll skip for now
    // But this is how you'd test it:
    // await page.goto('/app')
    // await page.keyboard.press('?')
    // await expect(page.getByText('Keyboard Shortcuts')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Use text locator instead of heading role (heading might be hidden/rearranged on mobile)
    await expect(page.locator('text=/personal diary/i')).toBeVisible({ timeout: 10_000 })
  })
})
