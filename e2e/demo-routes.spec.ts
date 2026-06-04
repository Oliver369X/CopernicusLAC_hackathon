import { test, expect } from '@playwright/test';
import {
  attachPageErrorCollector,
  criticalJsErrors,
  loginAsDemo,
} from './helpers/auth';

const DEMO_ROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/dashboard', heading: /Panel|Dashboard|campos/i },
  { path: '/monitor', heading: /Monitoreo satelital/i },
  { path: '/analytics', heading: /Analítica|analytics|Rendimiento/i },
  { path: '/insights', heading: /Perspectivas avanzadas/i },
  { path: '/alerts', heading: /Alertas/i },
  { path: '/gestion', heading: /Gestión|equipo|zonas/i },
  { path: '/science/soybean', heading: /Soya|soybean|Science|Lab/i },
  { path: '/onboarding', heading: /Tu finca|Importar parcelas/i },
  { path: '/privacidad', heading: /Privacidad|datos/i },
];

test.describe('demo routes (prod-safe)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  for (const route of DEMO_ROUTES) {
    test(`${route.path} loads without crash`, async ({ page }) => {
      const errors = attachPageErrorCollector(page);
      await page.goto(route.path);
      await expect(page.getByText(route.heading).first()).toBeVisible({ timeout: 25_000 });
      await expect(page.getByText(/This page couldn't load/i)).not.toBeVisible();
      expect(criticalJsErrors(errors)).toEqual([]);
    });
  }

  test('monitor zone grid renders metrics', async ({ page }) => {
    const errors = attachPageErrorCollector(page);
    await page.goto('/monitor');
    await expect(page.getByText(/Monitoreo satelital/i)).toBeVisible({ timeout: 25_000 });
    await page.waitForTimeout(3000);
    const ndviLabels = page.getByText(/^NDVI:/);
    if ((await ndviLabels.count()) > 0) {
      await expect(ndviLabels.first()).toBeVisible();
    }
    expect(criticalJsErrors(errors)).toEqual([]);
  });
});
