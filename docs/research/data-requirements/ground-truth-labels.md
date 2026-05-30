# Etiquetas de campo (ground truth)

## Columnas CSV obligatorias

| Columna | Tipo | Ejemplo |
|---------|------|---------|
| `crop` | soybean \| wheat \| corn \| coffee \| cacao | soybean |
| `field_id` | ID en app | field-1 |
| `captured_at` | ISO date | 2026-03-15 |
| `source` | string | manual_csv |

## Columnas recomendadas

| Columna | Tipo | Ejemplo |
|---------|------|---------|
| `zone_id` | ID zona | zone-1 |
| `disease_label` | texto | Asian Soybean Rust |
| `severity` | none \| low \| medium \| high \| critical | medium |
| `health_label` | excellent \| good \| warning \| critical | warning |
| `lat`, `lng` | decimal | -34.61, -58.38 |
| `observation_id` | UUID app | (desde /field/capture) |
| `production_class` | café/cacao | shaded |
| `notes` | texto | Lesiones en tercio medio |

## Plantillas

Ver [`templates/ground-truth-soybean.csv.example`](templates/ground-truth-soybean.csv.example).

## Join con satélite

Al importar, el pipeline cruza `zone_id + captured_at (±3 días)` con `science_timeseries` para enriquecer features.
