# Integración Data-Historica (Geo-Data)

Adaptador stub en `lib/integrations/geodata/` para enriquecer narrativas del Lab sin reemplazar lecturas `satellite_readings` locales.

## Cuándo activar

```env
GEODATA_ENABLED=true
GEODATA_BASE_URL=http://localhost:8000
```

Por defecto `GEODATA_ENABLED=false`: no hay llamadas HTTP al microservicio.

## Sincronización de parcelas

En el repo `Data-Historica-Microservicios`, ejecutar `sync_parcels.py` para materializar features por `parcel_key` en región `SC-BO`.

## Endpoints consumidos

| Endpoint | Uso |
|----------|-----|
| `GET /v1/features/parcel/{parcel_key}` | Inteligencia por parcela demo (`SJ-NORTE-001`, etc.) |
| `GET /v1/features/region/SC-BO` | Contexto regional (fuego, nubes) |

## Matriz de fuentes

| Dato | Fuente principal | Geo-Data (futuro) |
|------|------------------|-------------------|
| NDVI/NDMI por zona/día | `satellite_readings` (Postgres) | No sobrescribe |
| Histórico 7–90 días | `satellite_readings.reading_date` | — |
| Hotspots FIRMS 7d | NASA FIRMS directo (cron) | Refuerzo regional |
| SAR/texturas | CDSE en refresh | Paquete parcela |
| Fuego regional | — | `fire.hotspotCount7d` |

## Mapeo parcel_key demo

| fieldId | parcelKey |
|---------|-----------|
| field-sj-norte | SJ-NORTE-001 |
| field-sj-este | SJ-ESTE-001 |
| field-sj-oeste | SJ-OESTE-001 |
| field-sj-sur | SJ-SUR-001 |

Tabla opcional: `field_external_ids` (migración `009_geodata_links.sql`).
