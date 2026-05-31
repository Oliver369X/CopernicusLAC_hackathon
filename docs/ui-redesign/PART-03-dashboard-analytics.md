# Fase 3 — Panel, analítica y perspectivas

**Estado:** Completada (branch_adrian7)

## Alcance

- [`app/dashboard/page.tsx`](../../app/dashboard/page.tsx)
- [`app/analytics/page.tsx`](../../app/analytics/page.tsx)
- [`app/insights/page.tsx`](../../app/insights/page.tsx)
- Migrar todos los charts a `lib/design/tokens.ts`
- Grids responsive 1→2→4 columnas
- Jerarquía visual (hero vs secundaria)
- Traducir strings EN

## Checklist

- [x] Tokens ampliados (`healthLabelEs`, `envStatusLabelEs`, `chartSeries`, helpers)
- [x] `components/charts/chart-frame.tsx`, `metric-progress-row.tsx`
- [x] `components/insights/recommendation-card.tsx`
- [x] Dashboard: ES, ChartFrame, MetricProgressRow, motion
- [x] Analytics: KpiStat, tokens, i18n ES, ComposedChart ROI
- [x] Insights: ES, cards móvil para tabla, badges sin truncar
- [x] Sin hex en las 3 páginas (solo en `tokens.ts`)
- [x] `pnpm test` + `pnpm build` OK

## Criterios

- Sin hex hardcoded en Recharts en dashboard/analytics/insights
- Insights legible en móvil sin truncar badges
- KPI 2 columnas en móvil
