# Fase 6 — Identidad visual audaz + móvil + bug alertas

**Estado:** Completada (2026-05-29)

## Correcciones críticas

- **Keys React duplicadas:** `createAlertId(prefix, fieldId, zoneId)` en [`lib/alerts/alert-engine.ts`](../../lib/alerts/alert-engine.ts); dedupe en [`hooks/use-alerts.ts`](../../hooks/use-alerts.ts).
- **Alertas en español:** títulos y recomendaciones del motor traducidos.

## Identidad visual (modo audaz)

- [`app/globals.css`](../../app/globals.css): mesh en `page-gradient` / `auth-panel`, `.btn-copernicus`, `.card-glow-hover`, `.text-gradient-brand`, `glass-card` con hover y glow.
- Primary más visible: `#2dd4bf` (teal Copernicus).
- [`components/ui/button.tsx`](../../components/ui/button.tsx): gradiente en variant `default`.
- [`components/layout/kpi-stat.tsx`](../../components/layout/kpi-stat.tsx): iconos con gradiente primary→secondary.

## Móvil

- [`components/layout/app-shell.tsx`](../../components/layout/app-shell.tsx): header móvil con `BrandMark` + título de página; `main` con `overflow-x-hidden`.
- [`components/layout/responsive-layout.tsx`](../../components/layout/responsive-layout.tsx): `HorizontalScrollRow`, `ResponsiveToolbar`, `BadgeRow`.
- Science lab, estudios, compare: toolbars scroll/wrap, selects `w-full` en `<sm`.
- [`components/charts/chart-frame.tsx`](../../components/charts/chart-frame.tsx): alturas reducidas en viewports estrechos.

## Motion

- [`components/ui/motion.tsx`](../../components/ui/motion.tsx): `HoverLift` en lista de alertas.
- Nav activa con glow en [`sidebar-nav.tsx`](../../components/layout/sidebar-nav.tsx).
- Hub science con `StaggerList`.

## Checklist QA manual

| Viewport | Rutas |
|----------|--------|
| 320px | `/alerts`, `/science/soybean` |
| 375px | `/dashboard`, `/login`, `/monitor` |
| 768px | `/science`, `/analytics` |
| 1280px | `/dashboard` |

- [ ] Consola sin warning de keys en `/alerts`
- [ ] Botones primarios con gradiente teal→verde (no azul plano)
- [ ] Header móvil muestra título de página, no marca truncada
- [ ] Tabs science con scroll horizontal
- [ ] `prefers-reduced-motion`: sin translate en hover

**Verificación:** `pnpm test` + `pnpm build`.
