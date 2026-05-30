# Puntos agroforestería (café / cacao)

## CSV o GeoJSON

| Campo | Valores |
|-------|---------|
| crop | coffee \| cacao |
| lat, lng | WGS84 |
| captured_at | fecha visita |
| production_class | full_sun \| shaded \| young \| uncertain |
| field_id | opcional si ya existe parcela |

## GeoJSON

FeatureCollection con `properties` equivalentes a las columnas CSV.

Plantilla: [`templates/agroforestry-points.csv.example`](templates/agroforestry-points.csv.example).
