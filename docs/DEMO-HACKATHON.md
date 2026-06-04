# Demo hackathon Aura Agro — 3 minutos

## Narrativa (Copernicus / satélite)

1. **Scout satelital** — Monitor `/monitor`: capas NDRE/NDVI/color real (Process API CDSE), badges Sentinel-1/2/3.
2. **Grilla de calor** — Mapa NDVI con grilla Copernicus S2 (`satellite_readings.ndvi_grid`).
3. **Tendencia** — Gráfico NDVI/NDMI desde historial `satellite_readings` (backfill 90 días).
4. **Insights + agente** — `/insights`: KPIs desde Copernicus + asistente Mistral multiagente.
5. **Science Lab** — `/science/soybean`: fusión óptico + radar + LST sin series mock.
6. **Hotspot → campo** — Alerta `hotspot_stress` con deeplink GPS a `/field/capture`.
7. **Offline** — Campo `/field`: mapa descargado funciona sin red.

## Pre-demo checklist

- [ ] Postgres + MinIO: `pnpm docker:infra` o `pnpm setup`
- [ ] `pnpm verify` — CDSE token, grilla process y Postgres OK
- [ ] `.env` con `COPERNICUS_CLIENT_ID/SECRET` + `CRON_SECRET` + `AUTH_SECRET`
- [ ] `pnpm dev` en una terminal
- [ ] Lectura del día: `pnpm cron:satellite`
- [ ] Historial 90 días: `pnpm cron:backfill`
- [ ] Verificar en DB: zonas en `satellite_readings` con `source = copernicus`
- [ ] Rutas smoke: login, `/monitor`, `/insights`, `/science/soybean`, `/analytics`, `/api/health`
- [ ] Monitor muestra badge **Copernicus CDSE** y **Grilla Copernicus S2** (no sintética)

## Comandos rápidos

```bash
pnpm dev
# otra terminal:
pnpm cron:satellite      # lectura Copernicus del día (S1/S2/S3 + grilla)
pnpm cron:backfill       # historial 90 días vía Statistical API

# VPS:
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/fetch-metrics?job=satellite"
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/fetch-metrics?job=satellite-backfill&days=90"
```

## Cron recomendado (producción)

| Frecuencia | Job | Propósito |
|------------|-----|-----------|
| Diario | `satellite` | NDVI/NDMI/NDRE + grilla + S1/S3 |
| Semanal | `satellite-backfill&days=90` | Rellenar tendencias y science timeseries |

## Frase de cierre

> “Aura Agro integra Sentinel-1 humedad, Sentinel-2 NDRE y Sentinel-3 temperatura desde Copernicus Data Space — monitor en tiempo real, historial satelital, insights con agente Mistral y science lab multisensor.”

Ver también: [HACKATHON-AURA.md](./HACKATHON-AURA.md) (deploy `hackathon.aura.ia.bo`).
