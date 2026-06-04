import type { Page } from '@playwright/test';

const DEMO_EMAIL = process.env.PLAYWRIGHT_DEMO_EMAIL ?? 'admin@doctorsoya.app';
const DEMO_PASSWORD = process.env.PLAYWRIGHT_DEMO_PASSWORD ?? 'demo123456';

/** Inicia sesión demo si la app redirige a /login. */
export async function loginAsDemo(page: Page): Promise<void> {
  await page.goto('/login');
  if (!page.url().includes('/login')) return;

  await page.locator('#email').fill(DEMO_EMAIL);
  await page.locator('#password').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: /Iniciar sesión/i }).click();
  await page.waitForURL(/\/(dashboard|monitor|onboarding)/, { timeout: 30_000 });
}

export function attachPageErrorCollector(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

export function criticalJsErrors(errors: string[]): string[] {
  return errors.filter(
    (msg) =>
      msg.includes('toFixed') ||
      msg.includes('Cannot read properties of null') ||
      msg.includes('Cannot read properties of undefined')
  );
}
