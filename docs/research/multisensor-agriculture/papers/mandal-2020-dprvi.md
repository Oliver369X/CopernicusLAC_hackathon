# Mandal et al. 2020 — DpRVI (Sentinel-1)

**Título:** Dual polarimetric radar vegetation index for crop growth monitoring using Sentinel-1 SAR data

**URL:** https://www.sciencedirect.com/science/article/abs/pii/S0034425720303242

## Relevancia Doctor Soya

- DpRVI supera VH/VV, RVI, PRVI y DPSVI para seguimiento de crecimiento en varios cultivos incl. **trigo**.
- Correlaciona con Plant Area Index (PAI), Vegetation Water Content (VWC) y biomasa seca.
- Complementa NDVI/NDRE cuando nubes impiden S2.

## Implementación

- Fórmula en `lib/science/indices/radar.ts` → `computeDpRVI(vv, vh, beta=0.347)`
- Evalscript S1 extendido en `lib/services/copernicus/evalscripts.ts` → `S1_EXTENDED_STATS_EVALSCRIPT`
- Peso en fusión trigo: alto en tillering–heading; peso maíz: alto en vegetative–grain fill.

## Limitaciones

- Requiere calibración local de β y umbrales VV/VH según suelo LAC.
- No sustituye muestreo de campo para enfermedades fúngicas.
