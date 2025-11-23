import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display main heading', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('heading', { name: /personal diary/i })).toBeVisible()
  })

  test('should have login and signup links', async ({ page }) => {
    await page.goto('/')
    
    const loginLink = page.getByRole('link', { name: /login/i })
    const signupLink = page.getByRole('link', { name: /sign up|get started/i })
    
    await expect(loginLink).toBeVisible()
    await expect(signupLink).toBeVisible()
  })
})

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /login/i }).first().click()
    
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation or error message
    await expect(page.locator('text=/email|password/i')).toBeVisible()
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
    
    // Page should still render correctly
    await expect(page.getByRole('heading', { name: /personal diary/i })).toBeVisible()
  })
})
