import { test, expect } from '@playwright/test';

test.describe('onboarding flow', () => {
  test('onboarding page shows import step', async ({ page }) => {
    await page.goto('/onboarding');
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByRole('heading', { name: /Bienvenido/i })).toBeVisible();
      return;
    }
    await expect(
      page.getByText(/Importar|parcelas|GeoJSON/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('import template endpoint returns CSV', async ({ request }) => {
    const res = await request.get('/api/fields/import/template');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toMatch(/nombre|name|crop/i);
  });

  test('monitor accepts crop query param', async ({ page }) => {
    await page.goto('/monitor?crop=soybean');
    const url = page.url();
    if (url.includes('/login')) return;
    await expect(page.getByText(/Monitoreo|satelital/i).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
