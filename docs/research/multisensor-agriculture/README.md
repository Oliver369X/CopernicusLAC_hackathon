# Investigación — Firma temporal multisensor (óptico + radar)

Doctor Soya no usa un índice único “mágico” por cultivo. El estado del arte (trigo, maíz, café, cacao) apunta a **series temporales** que fusionan Sentinel-2 (óptico/red-edge/SWIR) y Sentinel-1 (VV, VH, DpRVI, texturas).

## Cultivos implementados en fase científica

| Cultivo | Módulo código | Estado |
|---------|---------------|--------|
| **Trigo** (`wheat`) | `lib/science/crops/wheat.ts` | Completo |
| **Maíz** (`corn`) | `lib/science/crops/corn.ts` | Completo |
| Café | Pendiente (próximo mensaje) | — |
| Cacao | Pendiente | — |
| Soja | Fase producto (NDRE) | Parcial |

## Archivos en esta carpeta

- [`bibliography.md`](bibliography.md) — referencias con URLs
- [`index-reference.md`](index-reference.md) — fórmulas y objetivo agronómico
- [`protocol-wheat-maize.md`](protocol-wheat-maize.md) — protocolo experimental reproducible
- [`papers/`](papers/) — resúmenes por artículo

## UI

- `/science` — hub laboratorio
- `/science/wheat` — panel trigo (cliente + experimentos)
- `/science/corn` — panel maíz

## API

- `GET /api/science/[crop]/analysis?fieldId=&zoneId=`
- `GET /api/science/[crop]/timeseries?fieldId=&zoneId=&days=90`
- `POST /api/science/experiments` — registrar corrida experimental
