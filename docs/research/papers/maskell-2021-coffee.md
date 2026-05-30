# Maskell et al. 2021 — Coffee agroforestry (resumen operativo)

## Aporte al producto

- NDVI + red-edge insuficientes solos bajo dosel
- Texturas SAR (contraste/homogeneidad) mejoran separación shaded vs full sun
- Confusión con bosque secundario → UI debe mostrar incertidumbre

## Implementación

- Perfil: `lib/science/crops/coffee.ts`
- Texturas proxy: `lib/services/copernicus/process-textures.ts`
- Clasificador: `lib/science/agroforestry/classifier.ts`

## Paper local

Ver bibliografía en `docs/research/multisensor-agriculture/bibliography.md`.
