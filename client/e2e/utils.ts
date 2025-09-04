import { expect, Page } from '@playwright/test'

export const BASE = process.env.E2E_BASE_URL ?? ''

export const url = (path: string) => (BASE ? `${BASE}${path}` : path)
export async function goto(page: Page, path: string) {
  await page.goto(url(path))
}

export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@qosas.com`
}

export async function signupViaUI(page: Page, email: string, password = 'password123') {
  await goto(page, '/signup')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign up/i }).click()
  await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible()
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await goto(page, '/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /login/i }).click()
  await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible()
}

export async function logoutViaUI(page: Page) {
  await page.getByRole('button', { name: /logout/i }).click()
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible()
}

export async function ensureSignedUp(page: Page, email: string, password = 'password123') {
  await goto(page, '/signup')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign up/i }).click()

  const goals = page.getByRole('heading', { name: 'Your Goals' })
  try {
    await goals.waitFor({ state: 'visible', timeout: 1500 })
  } catch {
    await loginViaUI(page, email, password)
  }
}

export async function createGoalUI(
  page: Page,
  title: string,
  opts?: {
    description?: string
    targetDate?: string | null
    category?: string
    tags?: string
    color?: string
  },
) {
  const {
    description = '',
    targetDate = null,
    category = '',
    tags = '',
    color = '#3b82f6',
  } = opts ?? {}

  await page.getByPlaceholder('New goal title').fill(title)
  if (description) await page.getByPlaceholder('Optional description').fill(description)
  if (targetDate !== null) await page.locator('input[type="date"]').fill(targetDate)
  if (category) await page.getByPlaceholder('e.g. Health').fill(category)
  if (color) await page.locator('input[type="color"]').fill(color)
  if (tags) await page.getByPlaceholder('work, cardio, reading').fill(tags)

  await page.getByRole('button', { name: /add goal/i }).click()
  await expect(page.getByRole('heading', { level: 5, name: title })).toBeVisible()
}

export function goalRowByTitle(page: import('@playwright/test').Page, title: string) {
  return page
    .locator('ul.list-group > li.list-group-item')
    .filter({ has: page.getByRole('heading', { level: 5, name: title }) })
}
