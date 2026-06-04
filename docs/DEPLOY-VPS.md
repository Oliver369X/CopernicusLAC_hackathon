# Despliegue VPS — Doctor Soya

Arquitectura recomendada: **Next.js en Docker (VPS)** + **Postgres + MinIO** (mismo stack que desarrollo local). Supabase es opcional si migras auth/storage; el README y `docker-compose.yml` del repo usan Postgres en contenedor.

## Requisitos

- VPS con Docker y Docker Compose
- Dominio apuntando al VPS (`app.tudominio.com`)
- Seed Postgres aplicado (`docker/postgres/init/`)
- Credenciales Copernicus CDSE, opcional Twilio/CDS

## Variables de entorno

Copie `.env.local.example` a `.env` en el servidor y complete (ver sección **Producción** al final del ejemplo):

| Variable | Obligatorio prod |
|----------|------------------|
| `AUTH_SECRET` | Sí — no usar `change-me-in-production` |
| `DATABASE_URL` | Sí — Postgres del compose |
| `NEXT_PUBLIC_APP_URL` | Sí — HTTPS público |
| `COPERNICUS_CLIENT_ID` / `SECRET` | Sí para datos satélite reales |
| `CRON_SECRET` / `WORKER_SECRET` | Sí — mismo valor recomendado |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | `false` en producción |
| `DOMAIN` | Dominio para Caddy TLS |

Opcional: `TWILIO_*`, `CDS_API_KEY`, `REDIS_URL`, `MISTRAL_API_KEY` / `OPENAI_API_KEY`.

## Build y arranque

```bash
docker compose build
docker compose up -d
```

Servicios:

| Servicio | Rol |
|----------|-----|
| `postgres` | Base de datos |
| `minio` | Fotos de observaciones |
| `web` | Next.js standalone (puerto 3000 interno) |
| `caddy` | TLS Let's Encrypt + reverse proxy |
| `worker` | Cron satelital cada 6h + jobs diarios |
| `worker-queue` | BullMQ + Redis (reintentos) |
| `redis` | Cola de jobs |

## Post-deploy

1. Health: `GET https://app.tudominio.com/api/health` → `{ "ok": true }`
2. Cron inicial (datos satélite):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://app.tudominio.com/api/cron/fetch-metrics?job=all"
```

3. Login con usuario real (no depender de cuentas demo)
4. Checklist demo: [DEMO-HACKATHON.md](./DEMO-HACKATHON.md)

Jobs cron satelitales (Copernicus CDSE):

```bash
# Diario — lectura del día (S1/S2/S3 + grilla NDVI)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/fetch-metrics?job=satellite"

# Semanal — historial 90 días (tendencias + science timeseries)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/fetch-metrics?job=satellite-backfill&days=90"
```

Otros jobs: `weather`, `fires`, `climate`, `alerts`, `science-batch`, `all`.

Monitoreo: alerta si `satellite_readings` no tiene filas nuevas en 48 h (`max(captured_at)`).

## Logs

```bash
docker compose logs -f web worker
```

## Supabase (alternativa)

Si usas Supabase Cloud en lugar de Postgres local, configura `NEXT_PUBLIC_SUPABASE_*` y aplica migraciones `001`–`005` en el proyecto Supabase. Auth redirect: Site URL y `https://app.tudominio.com/**` en URL Configuration.
