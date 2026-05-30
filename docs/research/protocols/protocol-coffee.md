# Protocolo café agroforestería

## Referencia

Maskell et al. 2021 — NDVI + red-edge + texturas SAR para full sun / shaded / young.

## Índices

- Óptico: NDVI, NDRE, CIred
- Radar: VV/VH, DpRVI, **GLCM proxy** (contraste, homogeneidad)

## Clases producción

`full_sun`, `shaded`, `young`, `forest_confusion_risk`, `uncertain`

## UI

`/science/coffee` — sistema producción estimado + incertidumbre explícita.

## ML

`worker/ml/train_agroforestry.py` — RF multitemporal baseline.
