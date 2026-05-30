# Datos requeridos — Science Lab Doctor Soya

## Flujo recomendado

1. **API externa** (ideal): configura `SCIENCE_DATA_API_URL` + `SCIENCE_DATA_API_KEY` → `POST /api/science/data/sync`
2. **CSV manual**: plantillas en [`templates/`](templates/) → subir en `/science/studies` o `node scripts/import-science-data.mjs`
3. **Observaciones app**: fotos en `/field/capture` → vincular `observation_id` en etiquetas

Tras importar ≥5 filas válidas, el sistema corre validación automática (métricas reglas vs ML vs agrónomo).

## Checklist por cultivo

| Cultivo | Mínimo útil | Prioridad índices | Etiquetas campo |
|---------|-------------|-------------------|-----------------|
| **Soja** | 20 parcelas × 2 fechas | NDRE, DpRVI, NDMI | Roya, frogeye, SDS, sano |
| **Trigo** | 15 parcelas | REDSI, NDRE, DpRVI | Roya amarilla, sequía, sano |
| **Maíz** | 15 parcelas | NDRE dosel, EVI | GLS, roya, sequía |
| **Café** | 10 puntos GPS | NDVI + texturas SAR | full_sun, shaded, young |
| **Cacao** | 10 puntos GPS | NDVI + SAR | agroforestería vs full sun |

## Documentos

- [Etiquetas ground truth](ground-truth-labels.md)
- [Fuentes API](api-sources.md)
- [Series satelitales bulk](historical-satellite-bulk.md)
- [Puntos agroforestería](agroforestry-points.md)
- [Formato modelos ML](ml-model-format.md)

## Esquema interno

Todas las fuentes convergen en `GroundTruthRow` (`lib/science/data/types.ts`).
