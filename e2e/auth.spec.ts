import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Wait for error message
    await expect(page.getByText(/erreur|invalide|incorrect/i)).toBeVisible({ timeout: 10000 })
  })

  test('should show validation error for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Check for required field validation
    const emailInput = page.getByLabel(/email/i)
    const isEmailRequired = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing)
    expect(isEmailRequired).toBe(true)
  })

  test('should have link to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /créer un compte|s'inscrire/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL('/register')
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/filiales')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('should display registration page', async ({ page }) => {
    await expect(page).toHaveURL('/register')
    await expect(page.getByRole('heading', { name: /inscription|créer/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
  })

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /connexion|se connecter/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })
})
