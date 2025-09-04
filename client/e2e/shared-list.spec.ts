import { test, expect } from '@playwright/test'
import { ensureSignedUp, logoutViaUI, goto, uniqueEmail, createGoalUI } from './utils.js'

test('Profile lists owners; "View goals" navigates to /shared?ownerId=... and lists their goals', async ({
  page,
}) => {
  const buddyEmail = uniqueEmail('buddy')
  const ownerEmail = uniqueEmail('owner')

  await ensureSignedUp(page, buddyEmail)
  await logoutViaUI(page)

  await ensureSignedUp(page, ownerEmail)
  await goto(page, '/goals')

  const title = `Shared Goal ${Date.now()}`
  await createGoalUI(page, title, {
    description: 'shared-from-owner',
    targetDate: '2026-01-01',
    category: 'ShareTest',
    tags: 'share,e2e',
    color: '#3b82f6',
  })

  const row = page
    .locator('ul.list-group > li.list-group-item')
    .filter({ has: page.getByRole('heading', { level: 5, name: title }) })
    .first()

  await row.getByRole('button', { name: 'Share' }).click()
  const modal = page.locator('#shareModal')
  await expect(modal).toBeVisible()

  await modal.getByPlaceholder('buddy@email.com').fill(buddyEmail)
  await modal.getByRole('button', { name: /^Share$/ }).click()

  await expect(modal.getByText(`Shared with ${buddyEmail}.`)).toBeVisible()
  await modal.locator('.modal-header .btn-close').click()
  await expect(modal).toBeHidden()

  await logoutViaUI(page)
  await goto(page, '/login')
  await page.locator('input[type="email"]').fill(buddyEmail)
  await page.locator('input[type="password"]').fill('password123')
  await page.getByRole('button', { name: /login/i }).click()
  await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible()

  await goto(page, '/profile')
  const ownerItem = page
    .locator('ul.list-group > li.list-group-item')
    .filter({ hasText: ownerEmail })
    .first()

  await expect(ownerItem).toBeVisible()
  await expect(ownerItem.getByText(/shared goal(s)?/i)).toBeVisible()

  await ownerItem.getByRole('button', { name: /view goals/i }).click()
  await expect(page).toHaveURL(/\/shared\?ownerId=\d+$/)

  await expect(page.getByRole('heading', { level: 5, name: title })).toBeVisible()
})
