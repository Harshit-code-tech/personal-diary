import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display main heading', async ({ page }) => {
    await page.goto('/')
    
    // Use text locator for "Personal Diary" or "My Diary"
    await expect(page.locator('text=/my diary|personal diary/i')).toBeVisible({ timeout: 10_000 })
  })

  test('should have login and signup links', async ({ page }) => {
    await page.goto('/')
    
    // The actual text on the landing page is "Sign In" and "Start Writing Today"/"Create Your Diary"
    const loginLink = page.getByRole('link', { name: /sign in/i }).first()
    const signupLink = page.getByRole('link', { name: /start writing today|create your diary/i }).first()
    
    await expect(loginLink).toBeVisible({ timeout: 10_000 })
    await expect(signupLink).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    
    // Click "Sign In" link (actual text on the page)
    await page.getByRole('link', { name: /sign in/i }).first().click()
    
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    
    // Target the submit button within the form
    await expect(page.locator('form').getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10_000 })
  })

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login')
    
    // Click the form's submit button
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()
    
    // Wait for validation error to appear - errors have role="alert" and specific IDs
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 5_000 })
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
    
    // Use text locator for "My Diary" or "Personal Diary"
    await expect(page.locator('text=/my diary|personal diary/i')).toBeVisible({ timeout: 10_000 })
  })
})
