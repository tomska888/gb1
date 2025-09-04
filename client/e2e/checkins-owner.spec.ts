import { test, expect, type Page } from '@playwright/test'
import { ensureSignedUp, uniqueEmail, goto } from './utils.js'

const rowFor = (page: Page, title: string) =>
  page.locator('li.list-group-item').filter({
    has: page.getByRole('heading', { level: 5, name: title }),
  })

test('owner can add check-in (status + %) and message; badges appear on latest message', async ({
  page,
}) => {
  const buddyEmail = uniqueEmail('buddy')
  const ownerEmail = uniqueEmail('owner')

  await ensureSignedUp(page, buddyEmail)
  await page.getByRole('button', { name: /logout/i }).click()
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible()

  await ensureSignedUp(page, ownerEmail)
  await goto(page, '/goals')

  await page.getByPlaceholder('New goal title').fill('1')
  await page.getByPlaceholder('Optional description').fill('desc')
  await page.getByRole('button', { name: /add goal/i }).click()
  await expect(page.getByRole('heading', { level: 5, name: '1' })).toBeVisible()

  const row = rowFor(page, '1')

  await row.getByRole('button', { name: 'Share' }).click()
  const modal = page.locator('#shareModal')
  await expect(modal.getByRole('heading', { name: 'Share goal' })).toBeVisible()
  await modal.getByPlaceholder('buddy@email.com').fill(buddyEmail)
  await modal.getByRole('button', { name: /^share$/i }).click()
  await expect(modal.getByText(`Shared with ${buddyEmail}.`)).toBeVisible({ timeout: 5000 })

  await modal.locator('.modal-header .btn-close').click()
  await expect(modal).toBeHidden()

  await expect(row.getByPlaceholder('%')).toBeVisible()
  await row.getByPlaceholder('%').fill('10')
  await row.getByPlaceholder(/Quick check-in note/i).fill('Started new project with numbers')
  await row.getByRole('button', { name: 'Send' }).click()

  await expect(row.getByText('Me', { exact: true })).toBeVisible()
  await expect(row.getByText('on_track')).toBeVisible()
  await expect(row.getByText('10%')).toBeVisible()
  await expect(row.getByText(/Started new project with numbers/)).toBeVisible()
})
