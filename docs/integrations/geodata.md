# Integración Data-Historica (Geo-Data)

Adaptador en `lib/integrations/geodata/` para enriquecer narrativas del Lab sin reemplazar lecturas `satellite_readings` locales.

## Panel Lab (analítica histórica)

En `/science/{crop}?tab=lab` aparece el panel **Inteligencia histórica · Data-Historica**:

- Métricas parcela: NDVI, SAR, hotspots, tendencia 90d
- Gráfico serie NDVI histórica (`/v1/features/parcel/{key}/series`)
- Tour demo: **Cooperativa** (SJ-*) vs **Finca María** (PF-*)
- API interna: `GET /api/integrations/geodata/lab?fieldId=...`

## Cuándo activar

Por defecto **desactivado** en el repo (`GEODATA_ENABLED=false`). Para demo/producción, configurar en `.env.local`:

```env
GEODATA_ENABLED=true
GEODATA_BASE_URL=http://34.63.197.152:8002
GEODATA_API_KEY=<clave de API_KEYS en el servidor geo-data>
# Dev local: GEODATA_BASE_URL=http://localhost:8000
```

Swagger prod: http://34.63.197.152:8002/docs

Health check app: `GET /api/integrations/geodata/health`

## Flujo de resolución

1. `field_external_ids` (Postgres) → `parcel_key` + `geodata_region_code`
2. Fallback mapa estático demo San Julián
3. `GET /v1/features/parcel/{key}?enrich=true`
4. Si falla: `GET /v1/features/point?lat=&lon=`
5. Si falla: `GET /v1/features/region/SC-BO` (solo enriquecimiento narrativo)

## Endpoints consumidos

| Endpoint | Uso |
|----------|-----|
| `GET /v1/features/parcel/{parcel_key}` | Inteligencia por parcela (`SJ-NORTE-001`, etc.) |
| `GET /v1/features/point` | Fallback por coordenadas del campo |
| `GET /v1/features/region/SC-BO` | Contexto regional (fuego, nubes) |
| `GET /v1/health` | Health proxy interno |

## Matriz de fuentes

| Dato | Fuente principal | Geo-Data |
|------|------------------|----------|
| NDVI/NDMI por zona/día | `satellite_readings` (Postgres) | No sobrescribe |
| Histórico 7–90 días | `satellite_readings.reading_date` | — |
| Hotspots FIRMS 7d | NASA FIRMS directo (cron) | Refuerzo vía paquete parcela/región |
| SAR/humedad suelo | CDSE en refresh | Paquete parcela (`sar`) |
| Fuego regional | — | `fire.hotspotCount7d`, `nearest_km` |

## Mapeo parcel_key demo

| fieldId | parcelKey |
|---------|-----------|
| field-sj-norte | SJ-NORTE-001 |
| field-sj-este | SJ-ESTE-001 |
| field-sj-oeste | SJ-OESTE-001 |
| field-sj-sur | SJ-SUR-001 |

Tabla: `field_external_ids` (migración `009_geodata_links.sql`).

## Checklist E2E

1. Servidor geo-data: `python scripts/smoke_sj_parcels.py --base-url http://34.63.197.152:8002 --api-key $KEY`
2. App: `GEODATA_ENABLED=true` + URL + API key
3. Lab `/science/soybean?tab=lab` → narrativa con sufijo `Geo-Data:` y badge violeta en provenance
4. `GET /api/integrations/geodata/health` → `{ ok: true, parcelStatus: 200 }`

## Sincronización parcelas (servidor geo-data)

```bash
python scripts/sync_parcels.py geojson/san_julian_parcels.geojson --region-code SC-BO
python scripts/seed_sj_demo_features.py   # demo sin celdas ingestadas
REFRESH MATERIALIZED VIEW feature_store.mv_latest_features;
```
