import { expect, test } from '@playwright/test'

// Read-only: nothing here may create or change data on the deployed site.

test('strona główna się ładuje i pokazuje aukcje', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Bidigo — start' }).first()).toBeVisible()
  await expect(page.locator('.bg-card-media').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('lista i wyszukiwarka aukcji działają', async ({ page }) => {
  await page.goto('/auctions?q=a')
  await expect(page.getByRole('heading', { name: 'Aukcje na żywo' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Nie udało się wyszukać')).toHaveCount(0)
})

test('aukcja otwiera się ze strony głównej', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('.bg-card-media').first()
  const href = await card.getAttribute('href')
  test.skip(!href?.startsWith('/auction/'), 'brak aktywnych aukcji (strona pokazuje demo)')
  await card.click()
  await expect(page).toHaveURL(/\/auction\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { name: 'Opis' })).toBeVisible()
})

test('serwis wyszukiwania jest zdrowy', async ({ request }) => {
  const res = await request.get('/api/search/health')
  expect(res.ok()).toBe(true)
  expect(await res.json()).toMatchObject({ ok: true })
})

test('zapis do indeksu wyszukiwania wymaga tokenu', async ({ request }) => {
  // Payloads that cannot change the index even where the endpoints are still open
  // (no id/title → 400, a non-existent id → no-op), so an old deployment is probed safely.
  for (const res of [
    await request.post('/api/search/index', { data: {} }),
    await request.post('/api/search/webhook/auction', { data: {} }),
    await request.delete('/api/search/index/00000000-0000-0000-0000-000000000000'),
  ]) {
    expect(res.status()).toBe(401)
  }
})
