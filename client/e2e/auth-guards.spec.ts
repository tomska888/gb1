import { test, expect } from '@playwright/test'
import { goto } from './utils.js'

test('Home: View all/Open redirect to Login when not signed in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  await goto(page, '/')
  await expect(page.getByRole('heading', { name: 'Welcome back 👋' })).toBeVisible()

  await page.getByRole('link', { name: 'View all' }).click()
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

  await page.getByRole('link', { name: 'Home' }).click()
  await page.getByRole('link', { name: 'Open' }).click()
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

  await goto(page, '/login')
})
