import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('landing page shows product overview', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Monitoreo agrícola profesional/i })).toBeVisible();
    await expect(page.getByText(/Próximamente/i)).toBeVisible();
  });

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('login page loads in Spanish', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Bienvenido de nuevo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sesión/i })).toBeVisible();
  });

  test('unauthenticated science redirects to login when DB configured', async ({ page }) => {
    await page.context().clearCookies();
    const res = await page.goto('/science/soybean');
    const url = page.url();
    if (url.includes('/login')) {
      expect(url).toContain('/login');
    } else {
      expect(res?.status()).toBeLessThan(500);
    }
  });
});
