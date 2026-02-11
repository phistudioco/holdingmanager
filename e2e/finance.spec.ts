import { test, expect } from '@playwright/test'

test.describe('Finance Module', () => {
  // Skip by default - requires authentication
  test.skip(!process.env.RUN_AUTH_TESTS, 'Skipping authenticated tests')

  test.describe('Clients', () => {
    test('should display clients list page', async ({ page }) => {
      await page.goto('/finance/clients')

      await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /nouveau client/i })).toBeVisible()
    })

    test('should open new client form', async ({ page }) => {
      await page.goto('/finance/clients')

      await page.getByRole('button', { name: /nouveau client/i }).click()
      await expect(page).toHaveURL('/finance/clients/nouveau')

      await expect(page.getByLabel(/nom/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })
  })

  test.describe('Factures', () => {
    test('should display invoices list page', async ({ page }) => {
      await page.goto('/finance/factures')

      await expect(page.getByRole('heading', { name: /factures/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /nouvelle facture/i })).toBeVisible()
    })

    test('should have filter options', async ({ page }) => {
      await page.goto('/finance/factures')

      // Check for filter/search functionality
      await expect(page.getByPlaceholderText(/rechercher/i)).toBeVisible()
    })
  })

  test.describe('Devis', () => {
    test('should display quotes list page', async ({ page }) => {
      await page.goto('/finance/devis')

      await expect(page.getByRole('heading', { name: /devis/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /nouveau devis/i })).toBeVisible()
    })
  })

  test.describe('Contrats', () => {
    test('should display contracts list page', async ({ page }) => {
      await page.goto('/finance/contrats')

      await expect(page.getByRole('heading', { name: /contrats/i })).toBeVisible()
    })
  })

  test.describe('Transactions', () => {
    test('should display transactions list page', async ({ page }) => {
      await page.goto('/finance/transactions')

      await expect(page.getByRole('heading', { name: /transactions/i })).toBeVisible()
    })
  })

  test.describe('Rapports', () => {
    test('should display reports page', async ({ page }) => {
      await page.goto('/finance/rapports')

      await expect(page.getByRole('heading', { name: /rapports/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /télécharger|générer/i })).toBeVisible()
    })
  })
})
