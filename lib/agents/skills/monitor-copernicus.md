# Monitor Copernicus — Aura Agro

## Ruta
`/monitor` — vista principal de monitoreo satelital.

## Capas
- **NDVI / NDMI / NDRE** desde Sentinel-2 (Process API CDSE)
- **Grilla de calor** NDVI almacenada en `satellite_readings.ndvi_grid`
- Badges de misión: **S1** (radar humedad), **S2** (óptico), **S3** (LST temperatura)

## Interpretación
- NDVI > 0.6: vigor alto
- NDVI 0.4–0.6: estrés moderado
- NDVI < 0.4: estrés severo o suelo desnudo
- NDRE caída temprana: clorosis antes que NDVI
- S1 moisture index bajo (<35%): sequía radar

## Fuente de datos
Cron `satellite` escribe en `satellite_readings` con `source = copernicus`.
