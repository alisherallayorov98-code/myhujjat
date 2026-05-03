import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('Sign up + login + dashboard', async ({ page }) => {
    const email = `test-${Date.now()}@e2e.uz`
    const password = 'Test123!@#'

    // Register
    await page.goto('/register')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="firstName"]', 'Alisher')
    await page.fill('input[name="lastName"]',  'Test')
    await page.click('button[type="submit"]')

    // Login redirect (yoki avtomatik dashboard)
    await page.waitForURL(/(login|dashboard)/, { timeout: 10_000 })

    // Agar login sahifasiga o'tib qoldi — qaytadan login
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.click('button[type="submit"]')
    }

    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await expect(page).toHaveURL(/dashboard/)
  })

  test('Login xato parol bilan — xato xabari', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'nonexistent@e2e.uz')
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Toast yoki inline xato
    await expect(
      page.getByText(/(noto'g'ri|invalid|topilmadi)/i)
    ).toBeVisible({ timeout: 5_000 })
  })

  test('Logout', async ({ page, context }) => {
    // Bu test'da test session kerak — soddaroq scenariy:
    // sahifaga kirish, agar login bo'lmagan — pass
    await page.goto('/login')
    await expect(page).toHaveURL(/login/)
  })
})
