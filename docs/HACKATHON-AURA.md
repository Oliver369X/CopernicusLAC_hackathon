# Aura Agro — Hackathon deploy

URL pública: **https://hackathon.aura.ia.bo**

## Credenciales demo (visibles en login)

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@doctorsoya.app | owner (cooperativa / zonas) | demo123456 |
| maria@doctorsoya.app | owner (pequeña agricultora, 19 ha) | demo123456 |
| analista@doctorsoya.app | admin | demo123456 |
| campo@doctorsoya.app | viewer | demo123456 |

Variable: `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`

## Guion demo 3 min (con agente Mistral)

1. Login con credenciales visibles (`maria@` = modelo hectáreas; `admin@` = cooperativa)
2. Opcional: `/setup/parcel` — dibujar una parcela en mapa satelital (onboarding Aura)
3. `/monitor` — capas NDRE, grilla Copernicus S2, badges S1/S2/S3
4. `/insights` — KPIs desde `satellite_readings` + panel agente
5. Preguntar al agente: **"Resumen satelital hoy"** o **"Zona con más estrés"**
6. `/science/soybean` — fusión óptico + radar + LST
7. `/field` — captura offline

## Deploy VPS (`/opt/aura-agro`)

```bash
# DNS: hackathon.aura.ia.bo → IP del VPS

sudo mkdir -p /opt/aura-agro && sudo chown $USER:$USER /opt/aura-agro

# Desde máquina local
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./ usuario@VPS:/opt/aura-agro/
scp .env usuario@VPS:/opt/aura-agro/.env

# En el VPS
cd /opt/aura-agro
docker compose down
docker compose build web worker worker-queue
docker compose up -d
docker compose ps
```

### `.env` producción hackathon

```env
DOMAIN=hackathon.aura.ia.bo
NEXT_PUBLIC_APP_URL=https://hackathon.aura.ia.bo
APP_URL=https://hackathon.aura.ia.bo
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true
NEXT_PUBLIC_AUTH_ENABLED=true
# AUTH_SECRET, CRON_SECRET, COPERNICUS_*, MISTRAL_API_KEY
REDIS_URL=redis://redis:6379
```

## Cron post-deploy (antes del jurado)

```bash
CRON_SECRET=<valor>
BASE=https://hackathon.aura.ia.bo

curl -H "Authorization: Bearer $CRON_SECRET" "$BASE/api/cron/fetch-metrics?job=satellite"
curl -H "Authorization: Bearer $CRON_SECRET" "$BASE/api/cron/fetch-metrics?job=satellite-backfill&days=90"
curl -H "Authorization: Bearer $CRON_SECRET" "$BASE/api/cron/fetch-metrics?job=alerts"
```

El worker ejecuta `satellite` cada 6 h y `satellite-backfill` semanalmente.

## Verificación QA

```bash
curl -s https://hackathon.aura.ia.bo/api/health
# {"ok":true,"service":"aura-agro"}
```

| Check | Esperado |
|-------|----------|
| Login | Credenciales demo visibles |
| `/monitor` | Badge Copernicus CDSE |
| `/insights` | Sin mocks; agente responde |
| Agente "resumen satelital" | Cita NDVI/S1 de DB |
| Agente "guía demo" | DemoGuide + skills |

## Frase de cierre

> Aura Agro integra Sentinel-1 humedad, Sentinel-2 NDRE y Sentinel-3 temperatura desde Copernicus Data Space — monitor en tiempo real, historial satelital y laboratorio científico multisensor.
