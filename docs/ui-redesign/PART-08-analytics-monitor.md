# Fase 8 — Analítica y monitoreo

**Estado:** Completada (2026-05-29)

## Analítica (`/analytics`)

- Pastels **Distribución de salud** y **Distribución de cultivos** usan [`DistributionDonutChart`](../../components/charts/distribution-donut-chart.tsx): donut sin etiquetas superpuestas, lista inferior solo con %.
- Tendencia de riesgo determinista ([`lib/analytics/risk-timeline.ts`](../../lib/analytics/risk-timeline.ts)) — sin `Math.random` ni fechas locales variables (hydration).
- Tooltips Recharts unificados con [`ChartTooltipContent`](../../components/charts/chart-tooltip.tsx).

## Monitoreo (`/monitor`)

- Badges de fuente en español y deduplicados ([`lib/i18n/data-source.ts`](../../lib/i18n/data-source.ts)).
- Selector de campo: nombre + cultivo en español.
- Texto de alertas corregido (sin “activas” duplicado).
- Fecha de escena con `formatDateEs`.
- Layout móvil: `min-w-0`, `overflow-hidden` en mapas, gráfico tendencia responsive.
- Header móvil: no repite “Monitoreo” si coincide con el título de página.

## Checklist

- [ ] `/analytics` 375px — sin labels encima del pastel
- [ ] `/monitor` 375px — mapa y panel lateral legibles
- [ ] Badges: “Base de datos · Copernicus CDSE” (no “Database / Database”)
