import { test, expect } from '@playwright/test'

test.describe('Shartnoma flow', () => {
  test.skip('Shartnoma yaratish (login session kerak)', async ({ page }) => {
    // Bu test login session bilan ishlaydi — user kerak
    await page.goto('/dashboard/shartnomalar/yangi')
    await expect(page).toHaveURL(/yangi/)

    // Shartnoma turi
    await page.click('button:has-text("Oldi-sotdi")')

    // Step 2: kontragent
    await page.fill('input[placeholder*="STIR"]', '301234567')
    await page.waitForTimeout(2000)  // STIR auto-fetch

    // Step 3: spesifikatsiya
    await page.click('button:has-text("Keyingi")')
    await page.fill('input[type="number"][placeholder*="Miqdor"]', '10')
    await page.fill('input[type="number"][placeholder*="Narx"]',   '50000')

    // Yaratish
    await page.click('button:has-text("Yaratish")')

    // Toast yoki redirect
    await expect(page.getByText(/yaratildi|created/i)).toBeVisible({ timeout: 10_000 })
  })
})
