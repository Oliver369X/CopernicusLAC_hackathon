# Cron satelital — Aura Agro

## Jobs disponibles
- `satellite` — lectura del día S1/S2/S3 + grilla NDVI (cada 6 h en worker)
- `satellite-backfill&days=90` — historial 90 días vía Statistical API (semanal)
- `alerts` — genera alertas desde umbrales NDVI/humedad

## Comandos locales
```bash
pnpm cron:satellite
pnpm cron:backfill
```

## Comandos VPS
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/fetch-metrics?job=satellite"
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/fetch-metrics?job=satellite-backfill&days=90"
```

## Antes de la demo
Ejecutar satellite + backfill para que `/monitor`, `/insights` y el agente citen datos reales CDSE.
