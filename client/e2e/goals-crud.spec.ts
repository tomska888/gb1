import { test, expect } from '@playwright/test'
import { ensureSignedUp, goto } from './utils.js'

test('create, edit, delete a goal (with confirm)', async ({ page }) => {
  const email = `crud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@qosas.com`
  await ensureSignedUp(page, email, 'password123')
  await goto(page, '/goals')

  await page.getByRole('textbox', { name: 'New goal title' }).click()
  await page.getByRole('textbox', { name: 'New goal title' }).fill('goal')
  await page.getByRole('textbox', { name: 'Optional description' }).click()
  await page.getByRole('textbox', { name: 'Optional description' }).fill('teste2e')
  await page.locator('input[type="date"]').fill('2025-09-03')
  await page.getByRole('textbox', { name: 'e.g. Health' }).click()
  await page.getByRole('textbox', { name: 'e.g. Health' }).fill('test')
  await page.locator('input[type="color"]').click()
  await page.locator('input[type="color"]').fill('#bbc8dd')
  await page.getByRole('textbox', { name: 'work, cardio, reading' }).click()
  await page.getByRole('textbox', { name: 'work, cardio, reading' }).fill('teste2e')
  await page.getByRole('button', { name: 'Add Goal' }).click()

  const createdRow = page
    .locator('li.list-group-item')
    .filter({ has: page.getByRole('heading', { level: 5, name: 'goal' }) })
  await expect(createdRow).toBeVisible()

  await createdRow.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('textbox', { name: 'New goal title' }).fill('goal()')
  await page.getByRole('textbox', { name: 'New goal title' }).press('ArrowLeft')
  await page.getByRole('textbox', { name: 'New goal title' }).fill('goal(edit)')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 5, name: 'goal(edit)' })).toBeVisible()

  await page.evaluate(() => {
    window.confirm = () => true
  })

  const editedRow = page
    .locator('li.list-group-item')
    .filter({ has: page.getByRole('heading', { level: 5, name: 'goal(edit)' }) })
  await expect(editedRow).toBeVisible()

  await editedRow.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page
      .locator('li.list-group-item')
      .filter({ has: page.getByRole('heading', { level: 5, name: 'goal(edit)' }) }),
  ).toHaveCount(0)
})
