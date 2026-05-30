# Doctor Soya — Resumen actualizado

## Estado: MVP full-stack implementado

La app ya no es solo mock en frontend. Incluye backend Supabase, APIs, sync offline, IA y cron jobs.

## Stack real

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16, React 19, Tailwind, shadcn/ui |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| APIs | Open-Meteo, Sentinel Hub, OpenAI Vision |
| Offline | IndexedDB + Service Worker |
| CI | GitHub Actions + Vitest |

## Rutas principales

- `/dashboard` — KPIs con campos y alertas dinámicas
- `/monitor` — mapa NDVI anclado a métricas de `/api/fields/[id]/metrics`
- `/field/*` — app móvil con capture, diagnóstico IA, historial
- `/alerts` — AlertEngine + DB + Realtime
- `/login`, `/register` — auth Supabase

## API implementadas

- `GET /api/fields` — campos desde DB o mock
- `GET /api/fields/[id]/metrics` — NDVI/clima histórico
- `POST /api/observations` — fotos con validación y Storage
- `POST /api/diagnostics/analyze` — OpenAI Vision
- `GET /api/cron/fetch-metrics` — clima + satélite + alertas + push
- `GET/PATCH /api/alerts` — alertas persistidas

## Para activar producción

1. Crear proyecto Supabase
2. Ejecutar migraciones en `supabase/migrations/`
3. Configurar `.env.local` (ver `.env.local.example`)
4. Crear bucket `observations` si la migración 002 falla en dashboard

## Tests

```bash
pnpm test   # 5 tests passing
pnpm build  # build OK
```
