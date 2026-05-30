# Series satelitales bulk (opcional)

Si traes índices de otro proveedor (Sentinel Hub, Google Earth Engine export, etc.):

## CSV esperado

| Columna | Descripción |
|---------|-------------|
| zone_id | ID zona Doctor Soya |
| captured_at | ISO timestamp |
| ndvi, ndre, ndmi | Óptico |
| dp_rvi, rvi, s1_vv, s1_vh | Radar |
| lst | Sentinel-3 opcional |

Se inserta en `science_timeseries` con `algorithm_version` = `import-bulk`.

## Nota

Con credenciales CDSE activas, el cron llena series automáticamente; bulk solo si necesitas histórico previo al deploy.
