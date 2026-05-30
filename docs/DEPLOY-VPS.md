# Despliegue VPS — Doctor Soya

Arquitectura recomendada: **Next.js en Docker (VPS)** + **Supabase Cloud** (Postgres, Auth, Storage).

## Requisitos

- VPS con Docker y Docker Compose
- Dominio apuntando al VPS (`app.tudominio.com`)
- Proyecto Supabase con migraciones `001`–`005` aplicadas
- Credenciales Copernicus CDSE, opcional Twilio/CDS

## Variables de entorno

Copie `.env.local.example` a `.env` en el servidor y complete:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET`
- `CRON_SECRET` / `WORKER_SECRET` (mismo valor recomendado)
- `DOMAIN=app.tudominio.com`
- Opcional: `TWILIO_*`, `CDS_API_KEY`, `REDIS_URL`

En Supabase Auth → URL Configuration, añada:

- Site URL: `https://app.tudominio.com`
- Redirect URLs: `https://app.tudominio.com/**`

## Build y arranque

```bash
docker compose build
docker compose up -d
```

Servicios:

| Servicio | Rol |
|----------|-----|
| `web` | Next.js standalone (puerto 3000 interno) |
| `caddy` | TLS Let's Encrypt + reverse proxy |
| `worker` | Cron satelital cada 6h + jobs diarios |
| `worker-queue` | BullMQ + Redis (reintentos) |
| `redis` | Cola de jobs |

## Cron manual

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://app.tudominio.com/api/cron/fetch-metrics?job=satellite"
```

Jobs: `weather`, `satellite`, `fires`, `climate`, `alerts`, `all`.

## Healthcheck

`GET /api/health` → `{ "ok": true }`

## Logs

```bash
docker compose logs -f web worker
```
