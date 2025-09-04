import { test, expect } from '@playwright/test'
import { ensureSignedUp, loginViaUI, logoutViaUI, createGoalUI } from './utils.js'

test('buddy: view-only cannot post; check-in permission can post; completed blocks buddy', async ({
  page,
}) => {
  const ownerEmail = `own_${Date.now()}@qosas.com`
  const buddyEmail = `bud_${Date.now()}@qosas.com`
  const password = 'password123'
  const title = `Shareable ${Date.now()}`

  await ensureSignedUp(page, ownerEmail, password)
  await logoutViaUI(page)
  await ensureSignedUp(page, buddyEmail, password)
  await logoutViaUI(page)

  await loginViaUI(page, ownerEmail, password)
  await createGoalUI(page, title)

  const row = page.locator('li.list-group-item').filter({
    has: page.getByRole('heading', { level: 5, name: title }),
  })
  await row.getByRole('button', { name: 'Share' }).click()
  const modal = page.locator('#shareModal')
  await expect(modal.getByRole('heading', { name: 'Share goal' })).toBeVisible()

  await modal.getByRole('combobox').selectOption('view')
  await modal.getByRole('textbox', { name: 'buddy@email.com' }).fill(buddyEmail)
  await modal.getByRole('button', { name: /^Share$/ }).click()
  await expect(modal.getByText(`Shared with ${buddyEmail}.`)).toBeVisible()
  await modal.locator('.modal-header .btn-close').click()
  await expect(modal).toBeHidden()

  await logoutViaUI(page)
  await loginViaUI(page, buddyEmail, password)
  await page.goto('/shared')
  const sharedRowView = page.locator('li.list-group-item').filter({
    has: page.getByRole('heading', { level: 5, name: title }),
  })
  await expect(sharedRowView).toBeVisible()
  await expect(sharedRowView.getByRole('button', { name: 'Send' })).toHaveCount(0)
  await expect(sharedRowView.getByPlaceholder('Quick message…')).toHaveCount(0)

  await logoutViaUI(page)
  await loginViaUI(page, ownerEmail, password)
  await page.getByRole('button', { name: 'Share' }).first().click()
  const modal2 = page.locator('#shareModal')
  await expect(modal2).toBeVisible()
  await modal2.getByRole('button', { name: 'Revoke' }).click()
  await expect(modal2.getByText('Share revoked.')).toBeVisible()
  await modal2.getByRole('textbox', { name: 'buddy@email.com' }).fill(buddyEmail)
  await modal2.getByRole('combobox').selectOption('checkin')
  await modal2.getByRole('button', { name: /^Share$/ }).click()
  await expect(modal2.getByText(`Shared with ${buddyEmail}.`)).toBeVisible()
  await modal2.locator('.modal-header .btn-close').click()
  await expect(modal2).toBeHidden()

  await logoutViaUI(page)
  await loginViaUI(page, buddyEmail, password)
  await page.goto('/shared')
  const sharedRowCan = page.locator('li.list-group-item').filter({
    has: page.getByRole('heading', { level: 5, name: title }),
  })
  await expect(sharedRowCan.getByPlaceholder('Quick message…')).toBeVisible()
  await sharedRowCan.getByPlaceholder('Quick message…').fill('hello from buddy')
  await sharedRowCan.getByRole('button', { name: 'Send' }).click()
  await expect(sharedRowCan.getByText('hello from buddy')).toBeVisible()

  await logoutViaUI(page)
  await loginViaUI(page, ownerEmail, password)
  await page.getByRole('button', { name: 'Complete' }).click()
})
