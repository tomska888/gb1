import { test, expect } from '@playwright/test'
import { ensureSignedUp, uniqueEmail, createGoalUI } from './utils.js'

test('pagination + page size preference from Profile', async ({ page }) => {
  const email = uniqueEmail('pagination')
  await ensureSignedUp(page, email)

  for (let i = 1; i <= 9; i++) {
    await createGoalUI(page, `PG ${i}`)
  }

  await expect(page.getByText('Page 1 / 1 · Showing 1–9 of')).toBeVisible()

  for (let i = 1; i <= 9; i++) {
    await expect(page.getByRole('heading', { level: 5, name: `PG ${i}` })).toBeVisible()
  }

  await page.getByRole('link', { name: 'Profile' }).click()
  const pageSizeSpin = page.getByRole('spinbutton')
  await expect(pageSizeSpin).toBeVisible()
  await pageSizeSpin.click()
  await pageSizeSpin.fill('5')
  await page.keyboard.press('Enter')

  await page.getByRole('link', { name: 'Goals' }).click()
  await expect(page.getByText('Page 1 / 2 · Showing 1–5 of')).toBeVisible()

  await expect(page.getByRole('heading', { level: 5, name: 'PG 5' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 5, name: 'PG 6' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 5, name: 'PG 7' })).toBeVisible()
})
