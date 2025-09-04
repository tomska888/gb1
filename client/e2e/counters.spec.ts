import { test, expect } from '@playwright/test'
import { signupViaUI, uniqueEmail, goto } from './utils.js'

function rowFor(page: import('@playwright/test').Page, title: string) {
  return page.locator('li.list-group-item').filter({
    has: page.getByRole('heading', { level: 5, name: title }),
  })
}

test('signup + add 3 goals, set statuses (active/completed/abandoned)', async ({ page }) => {
  const email = uniqueEmail('statuses')
  await signupViaUI(page, email, 'password123')
  await goto(page, '/goals')
  await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible()

  await page.getByPlaceholder('New goal title').fill('active goal')
  await page.getByPlaceholder('Optional description').fill('ac')
  await page.locator('input[type="date"]').first().fill('2025-09-05')
  await page.getByPlaceholder('e.g. Health').fill('act')
  await page.locator('input[type="color"]').first().fill('#222325')
  await page.getByPlaceholder('work, cardio, reading').fill('act')
  await page.getByRole('button', { name: 'Add Goal' }).click()
  await expect(rowFor(page, 'active goal')).toBeVisible()

  await page.getByPlaceholder('New goal title').fill('completed goal')
  await page.getByPlaceholder('Optional description').fill('com')
  await page.locator('input[type="date"]').first().fill('2025-09-03')
  await page.getByPlaceholder('e.g. Health').fill('com')
  await page.locator('input[type="color"]').first().fill('#99b0d6')
  await page.getByPlaceholder('work, cardio, reading').fill('com')
  await page.getByRole('button', { name: 'Add Goal' }).click()
  const completedRow = rowFor(page, 'completed goal')
  await expect(completedRow).toBeVisible()
  await completedRow.getByRole('button', { name: 'Complete' }).click()
  await expect(completedRow.getByRole('button', { name: 'Reopen' })).toBeVisible()

  await page.getByPlaceholder('New goal title').fill('abandoned goal')
  await page.getByPlaceholder('Optional description').fill('aba')
  await page.locator('input[type="date"]').first().fill('2025-09-04')
  await page.getByPlaceholder('e.g. Health').fill('aba')
  await page.locator('input[type="color"]').first().fill('#23334d')
  await page.getByPlaceholder('work, cardio, reading').fill('aba')
  await page.getByRole('button', { name: 'Add Goal' }).click()
  const abandonedRow = rowFor(page, 'abandoned goal')
  await expect(abandonedRow).toBeVisible()

  await abandonedRow.locator('select:has(option[value="abandoned"])').selectOption('abandoned')

  const goalsList = page.locator('main .list-group').first()
  const listItems = () => goalsList.locator(':scope > li.list-group-item')

  await page.getByRole('button', { name: /^All\b/i }).click()
  await expect(listItems()).toHaveCount(3)

  await page.getByRole('button', { name: /^Active\b/i }).click()
  await expect(listItems()).toHaveCount(1)
  await expect(rowFor(page, 'active goal')).toBeVisible()

  await page.getByRole('button', { name: /^Completed\b/i }).click()
  await expect(listItems()).toHaveCount(1)
  await expect(rowFor(page, 'completed goal')).toBeVisible()

  await page.getByRole('button', { name: /^Abandoned\b/i }).click()
  await expect(listItems()).toHaveCount(1)
  await expect(rowFor(page, 'abandoned goal')).toBeVisible()
})
