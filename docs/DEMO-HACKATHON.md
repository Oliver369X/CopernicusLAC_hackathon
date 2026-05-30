# Demo hackathon — 3 minutos

## Narrativa

1. **Scout satelital** — Monitor `/monitor`: capa NDRE (Red Edge), badges S1/S2/S3.
2. **Hotspot → campo** — Alerta `hotspot_stress` con deeplink GPS a `/field/capture`.
3. **IA + fusión** — Foto en capture → diagnóstico con contexto Copernicus (NDRE, LST, radar).
4. **WhatsApp** — Alerta crítica con mapa (Twilio sandbox en demo).
5. **Clima 2030** — Insights: viabilidad ERA5-Land / C3S por campo.
6. **Offline** — Campo `/field`: “Descargar mapa del campo” → funciona sin red.

## Pre-demo checklist

- [ ] Migraciones Supabase aplicadas
- [ ] `.env` con CDSE + `CRON_SECRET`
- [ ] Ejecutar cron: `?job=all` al menos una vez
- [ ] Campo demo con lecturas en `satellite_readings`
- [ ] Twilio sandbox: número verificado del jurado (opcional)

## Comandos rápidos

```bash
pnpm dev
# o en VPS:
docker compose up -d
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/fetch-metrics?job=all
```

## Frase de cierre

> “Doctor Soya cruza Sentinel-1 humedad, Sentinel-2 NDRE y Sentinel-3 temperatura con la foto del productor — alerta por WhatsApp, diagnóstico en campo, incluso offline.”
