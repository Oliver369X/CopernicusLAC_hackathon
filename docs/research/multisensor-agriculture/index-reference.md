# Referencia de índices — Doctor Soya Science

## Ópticos (Sentinel-2 L2A)

| Índice | Bandas | Objetivo agronómico | Implementación |
|--------|--------|---------------------|----------------|
| NDVI | B08, B04 | Vigor / biomasa verde | `lib/science/indices/optical.ts` |
| EVI | B08, B04, B02 | Vigor en dosel denso (menos saturación) | idem |
| SAVI | B08, B04 | Suelo visible / baja cobertura | idem |
| NDRE | B08, B05 | Clorofila / N / estrés temprano | idem |
| CIred-edge | B08, B05 | Contenido clorofila | idem |
| NDWI | B03, B08 | Agua en vegetación (McFeeters) | idem |
| LSWI / NDMI | B08, B11 | Estrés hídrico / SWIR | idem |
| MSI | B11, B08 | Estrés hídrico (ratio SWIR/NIR) | idem |
| REDSI | B04, B05, B08 | Yellow rust trigo (específico, ≠ NDRE) | `lib/science/indices/redsi.ts` |

## Radar (Sentinel-1 GRD dual-pol)

| Variable | Fórmula (aprox.) | Objetivo |
|----------|------------------|----------|
| VV | banda | Rugosidad, suelo, humedad superficial |
| VH | banda | Dispersión volumétrica, biomasa |
| VH/VV | ratio | Estructura relativa dosel |
| RVI | `4·VH / (VV+VH)` | Índice vegetación radar |
| DpRVI | Mandal et al. 2020 (β≈0.347) | Crecimiento, PAI, VWC, biomasa seca |

## Fusión multisensor

No se expone un único “índice mágico”. Se calcula:

1. **Vector de índices** por fecha (S2 + S1 + S3 LST opcional)
2. **Firma temporal**: pendiente 7d/14d, pico NDVI/DpRVI, fase fenológica esperada
3. **Score de salud** ponderado por cultivo y etapa (`lib/science/fusion/multisensor-score.ts`)

## Pesos por cultivo (trigo vs maíz)

Ver `lib/science/crops/wheat.ts` y `lib/science/crops/corn.ts`.
