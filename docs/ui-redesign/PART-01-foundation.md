# Fase 1 — Fundación del sistema de diseño

## Objetivo

Establecer tokens Copernicus LAC, motion base y primitivos de layout reutilizables. **No** rehace charts completos ni monitor/field.

## Checklist

- [x] Rama `branch_adrian7`
- [x] `app/globals.css` — paleta, `@theme` health/chart, gradientes, motion
- [x] `lib/design/tokens.ts` — colores para Recharts
- [x] `components/ui/motion.tsx` — FadeIn, StaggerList
- [x] `page-header.tsx`, `kpi-stat.tsx`, `app-shell.tsx` (marca), `auth-layout.tsx`
- [x] `button`, `card`, `badge` alineados a tokens
- [x] `app/layout.tsx` — quitar `generator: v0.app`
- [x] Dashboard: pie chart usa `chartColors` de tokens (referencia)
- [x] Tests y build verdes (`pnpm test`, `pnpm build`)

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/globals.css` | Tokens Copernicus, motion utilities, glass-card |
| `lib/design/tokens.ts` | Nuevo — chartColors, healthColors |
| `components/ui/motion.tsx` | Nuevo |
| `components/layout/*` | Primitivos responsive + marca |
| `components/ui/button|card|badge` | Focus ring teal, variantes |
| `app/layout.tsx` | Metadata sin v0 |
| `app/dashboard/page.tsx` | Import chartColors (muestra) |

## Deprecated (Fase 5)

- `components/app-nav.tsx`
- `styles/globals.css`

## Criterios de aceptación

- Paleta visible en login, shell, dashboard KPI
- 375px: KPI 2 cols, sin overflow horizontal en header
- `prefers-reduced-motion`: animaciones desactivadas
- `pnpm test` + `pnpm build` OK
