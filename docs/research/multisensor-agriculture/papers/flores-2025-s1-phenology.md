# Flores et al. 2025 — Fenología S1 series temporales

**URL:** https://www.tandfonline.com/doi/full/10.1080/15481603.2025.2531593

## Relevancia

- Sentinel-1 time series para fenología a escala regional.
- Justifica módulo `lib/science/phenology/temporal-signature.ts`: detección de pico, pendiente, senescencia.

## Uso en app

- Comparar fase detectada (NDVI/DpRVI) vs `growthStages` en perfiles trigo/maíz.
- Flag `phenology_match`: `early` | `aligned` | `late`.
