# Protocolo experimental — Trigo y maíz

## Objetivo

Validar que la **firma temporal multisensor** (S2 óptico + S1 radar) discrimina mejor estrés y fenología que un único índice instantáneo (p. ej. solo NDVI).

## Hipótesis

- **H1 (trigo):** Caída de NDRE/REDSI + estabilidad DpRVI en 7–14 d precede síntomas visibles de roya/stripe rust.
- **H2 (maíz):** En dosel denso (NDVI>0.7), NDRE y EVI detectan estrés antes que NDVI; DpRVI correlaciona con biomasa en pico vegetativo.
- **H3:** Fusión ponderada supera cualquier índice individual en score de anomalía (Mouret et al. 2020, enfoque outlier parcel-level).

## Materiales

- Parcelas demo en Supabase (`fields`, `zones`)
- Credenciales Copernicus CDSE
- Mínimo **8 lecturas** en `satellite_readings` por zona (cron 6h × 14 d)

## Procedimiento

1. Seleccionar campo trigo o maíz en `/science/[crop]`.
2. Ejecutar cron: `GET /api/cron/fetch-metrics?job=satellite` (o esperar worker).
3. Abrir pestaña **Experimento** → “Ejecutar análisis multisensor”.
4. Registrar observación de campo (foto + notas) el mismo día.
5. Comparar:
   - Vector óptico (NDVI, EVI, NDRE, MSI…)
   - Vector radar (VV, VH, RVI, DpRVI)
   - Score fusión vs etapa fenológica esperada
6. Guardar corrida: `POST /api/science/experiments` (persiste en `science_experiments`).

## Variables de salida

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `optical_vector` | JSON | Medias S2 del día |
| `radar_vector` | JSON | Medias S1 del día |
| `temporal_signature` | JSON | Slopes, peak, phase |
| `fusion_score` | 0–1 | Salud multisensor |
| `anomaly_flags` | string[] | Outliers vs historial parcela |
| `phenology_match` | enum | aligned / early / late / unknown |

## Criterios de éxito (cliente final)

- Panel muestra índices con interpretación agronómica en español.
- Alertas usan narrativa fusión (no solo NDVI).
- Export JSON de experimento para informes.

## Criterios de éxito (investigación)

- Reproducibilidad: misma zona + misma fecha → mismos índices ± tolerancia CDSE.
- Trazabilidad: cada score cita referencias en `docs/research/`.

## Próximos cultivos

- **Café:** S2 + S1 texturas, clasificación sol/sombra (Maskell 2021).
- **Cacao:** RF multitemporal, NDVI + texturas radar (Abu 2021).
