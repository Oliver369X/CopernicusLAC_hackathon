# Fase 4 — Monitoreo y app de campo

**Estado:** Completada (branch_adrian7)

## Alcance

- [`components/monitor/monitor-client.tsx`](../../components/monitor/monitor-client.tsx)
- Mapas y métricas en vivo
- [`app/field/layout.tsx`](../../app/field/layout.tsx) — español, bottom nav táctil
- Offline-first visual (estados de conexión)

## Checklist

- [x] `FieldAppShell` — nav inferior 52px, safe-area, marca Copernicus
- [x] `ConnectionStatus` + `OfflineMapBadge`
- [x] Monitor: textos ES, ChartFrame, tokens, mapa landscape
- [x] `health-metrics`, `zone-grid`, `field-map` con tokens
- [x] Field pages: ES, glass-card, KPI táctiles
- [x] `pnpm test` + `pnpm build` OK

## Criterios

- Field app coherente con shell principal (tokens)
- Mapa usable en móvil landscape
