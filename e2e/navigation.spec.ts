import { test, expect } from '@playwright/test'

// Test file for navigation - requires authenticated user
// In a real scenario, you would use fixtures for authentication

test.describe('Navigation', () => {
  // Skip these tests by default as they require authentication
  // In production, use auth fixtures or test with a logged-in state
  test.skip(!process.env.RUN_AUTH_TESTS, 'Skipping authenticated tests')

  test('should display sidebar with main navigation items', async ({ page }) => {
    await page.goto('/')

    // Check main navigation items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /filiales/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /employés/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /finance/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /services/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /workflows/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /alertes/i })).toBeVisible()
  })

  test('should expand Finance submenu', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /finance/i }).click()

    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /factures/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /contrats/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /transactions/i })).toBeVisible()
  })

  test('should expand Services submenu', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /services/i }).click()

    await expect(page.getByRole('link', { name: /robotique/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /digital/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /out sourcing/i })).toBeVisible()
  })

  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/filiales')
    await page.getByRole('link', { name: /dashboard/i }).click()

    await expect(page).toHaveURL('/')
  })

  test('should navigate to Filiales', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /filiales/i }).click()

    await expect(page).toHaveURL('/filiales')
  })
})

test.describe('Responsive Navigation', () => {
  test.skip(!process.env.RUN_AUTH_TESTS, 'Skipping authenticated tests')

  test('should show mobile menu button on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Look for hamburger menu button
    const menuButton = page.getByRole('button', { name: /menu/i })
    await expect(menuButton).toBeVisible()
  })

  test('should open sidebar on mobile when menu clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await page.getByRole('button', { name: /menu/i }).click()

    // Sidebar should be visible
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})
