import { test, expect } from '@playwright/test'
import { uniqueEmail, signupViaUI, logoutViaUI, goto } from './utils.js'

test('signup → redirected to Goals; logout; wrong-password login shows error; login ok', async ({
  page,
}) => {
  const email = uniqueEmail('qosas')
  const goodPassword = 'password123'

  await signupViaUI(page, email, goodPassword)

  await logoutViaUI(page)

  await goto(page, '/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill('password12')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()

  await page.locator('input[type="password"]').fill(goodPassword)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible()

  await goto(page, '/goals')
})
