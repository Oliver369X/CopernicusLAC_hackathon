# Entorno staging

Segundo despliegue para probar imports de pilotos antes de producción.

## URL

- `https://staging.doctorsoya.app` (o subdominio en el mismo VPS)
- `NEXT_PUBLIC_APP_URL` debe apuntar al host staging
- `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false`

## Variables

Copiar `.env` de producción con:

- Base de datos **separada** (`DATABASE_URL` distinto)
- Mismos secretos Copernicus/Twilio o claves de prueba
- `CRON_SECRET` distinto recomendado

## Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

Tras migraciones `03–05`, ejecutar:

```bash
pnpm verify:pilot
curl -H "Authorization: Bearer $CRON_SECRET" "$STAGING_URL/api/cron/fetch-metrics?job=all"
```

## Flujo piloto

1. Registrar org de prueba en staging
2. Import shapefile asistido
3. Verificar `import_jobs` y monitor NDVI
4. Promover configuración validada a producción
