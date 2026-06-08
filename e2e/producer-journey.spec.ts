import { test, expect } from '@playwright/test';

const FORBIDDEN_PLAIN = /NDVI|NDRE|multisensor|Lab\. Científico|fusión/i;

test.describe('producer plain journey', () => {
  test('login demo maria lands on plain nav without jargon', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill('maria@doctorsoya.app');
    await page.getByLabel(/contraseña/i).fill('demo123456');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await page.waitForURL(/\/(inicio|onboarding|dashboard)/, { timeout: 15000 });

    if (page.url().includes('/onboarding')) {
      await page.goto('/inicio');
    }

    const nav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible({ timeout: 10000 });
    await expect(nav.getByRole('link', { name: 'Cómo va mi cultivo' })).toBeVisible();
    await expect(nav.getByText('Lab. Científico')).toHaveCount(0);
  });

  test('/inicio shows human status copy', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill('maria@doctorsoya.app');
    await page.getByLabel(/contraseña/i).fill('demo123456');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/\/(inicio|onboarding)/, { timeout: 15000 });
    if (!page.url().includes('/inicio')) {
      await page.goto('/inicio');
    }

    await expect(page.getByRole('heading', { name: /tu finca hoy/i })).toBeVisible({
      timeout: 10000,
    });
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(FORBIDDEN_PLAIN);
  });

  test('/monitor plain mode hides NDVI labels', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill('maria@doctorsoya.app');
    await page.getByLabel(/contraseña/i).fill('demo123456');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.goto('/monitor');

    await expect(page.getByRole('heading', { name: /mapa de mi parcela/i })).toBeVisible({
      timeout: 10000,
    });
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/NDVI|NDRE|Copernicus S2/i);
  });

  test('/dashboard redirects plain users to inicio', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill('maria@doctorsoya.app');
    await page.getByLabel(/contraseña/i).fill('demo123456');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.goto('/dashboard');
    await page.waitForURL(/\/inicio/, { timeout: 10000 });
  });
});
