# Fase 7 — Panel de control y fechas SSR

**Estado:** Completada (2026-05-29)

## Objetivos

- Eliminar hydration mismatch en fechas (`toLocaleString` vs SSR).
- Pastel de cultivos legible (Maíz visible, sin labels recortados).
- Tooltips de gráficos con contraste (texto claro, no gris).
- Gráfico "Salud por campo" con datos reales de cada campo.

## Cambios técnicos

| Archivo | Qué |
|---------|-----|
| [`lib/i18n/format-date.ts`](../../lib/i18n/format-date.ts) | `formatDateTimeEs` UTC estable |
| [`components/charts/crop-distribution-chart.tsx`](../../components/charts/crop-distribution-chart.tsx) | Donut + leyenda + lista bajo gráfico |
| [`components/charts/field-health-bar-chart.tsx`](../../components/charts/field-health-bar-chart.tsx) | Barras por `fields[]` |
| [`components/charts/chart-tooltip.tsx`](../../components/charts/chart-tooltip.tsx) | Tooltip Recharts con colores explícitos |
| [`app/dashboard/page.tsx`](../../app/dashboard/page.tsx) | Integración + layout móvil |
| [`app/alerts/page.tsx`](../../app/alerts/page.tsx) | Fechas sin hydration |
| [`components/layout/app-shell.tsx`](../../components/layout/app-shell.tsx) | Título móvil `line-clamp-2` |

## Checklist QA — `/dashboard`

- [ ] 375px: leyenda Soja / Maíz / Trigo completa (lista bajo donut)
- [ ] Click en rebanada: tooltip legible
- [ ] Barras muestran nombres de campo (North Sector 1, East Field, …)
- [ ] KPIs 2 columnas sin overflow
- [ ] 1280px: tendencia 2/3 + pastel 1/3

## Checklist QA — `/alerts`

- [ ] Consola sin "Hydration failed" en timestamp

**Verificación:** `pnpm test` + `pnpm build`.
