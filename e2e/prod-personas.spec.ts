import { test, expect } from '@playwright/test';
import {
  attachPageErrorCollector,
  criticalJsErrors,
  loginAsDemo,
} from './helpers/auth';

const PROD_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://hackathon.aura.ia.bo';

test.describe('prod personas — cooperativa vs pequeña agricultora', () => {
  test('cooperativa: science lab + geo-data health', async ({ page }) => {
    const errors = attachPageErrorCollector(page);
    await loginAsDemo(page, 'admin@doctorsoya.app');

    const geoRes = await page.request.get(`${PROD_BASE}/api/integrations/geodata/health`);
    expect(geoRes.status(), 'geodata health').toBe(200);
    const geo = await geoRes.json();
    expect(geo.geodataEnabled).toBe(true);

    await page.goto('/science/soybean?field=field-sj-norte&tab=lab');
    await expect(page.getByText(/Lab analítico|Contexto histórico|Seguimiento/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/¿Por dónde empezamos|Comparar escala/i).first()).toBeVisible({
      timeout: 20_000,
    });

    expect(criticalJsErrors(errors)).toEqual([]);
  });

  test('maría: historial satelital + onboarding tour', async ({ page }) => {
    const errors = attachPageErrorCollector(page);
    await loginAsDemo(page, 'maria@doctorsoya.app');

    await page.goto('/science');
    await expect(page.getByText(/Historial satelital|seguridad alimentaria/i).first()).toBeVisible({
      timeout: 25_000,
    });

    await page.goto('/science/soybean?field=field-pf-soja&tab=lab');
    await expect(page.getByText(/¿Qué querés revisar hoy|Tu historial satelital/i).first()).toBeVisible({
      timeout: 30_000,
    });

    expect(criticalJsErrors(errors)).toEqual([]);
  });
});

test.describe('prod onboarding smoke', () => {
  test('onboarding page loads', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: /Tu finca/i })).toBeVisible({ timeout: 20_000 });
  });
});
