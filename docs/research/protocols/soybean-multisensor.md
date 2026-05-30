# Protocolo multisensor — Soja (Doctor Soya)

## Objetivos por índice

| Índice | Objetivo | Misión |
|--------|----------|--------|
| NDRE | Clorofila / estrés temprano | S2 |
| NDMI, LSWI, MSI | Estrés hídrico | S2 SWIR |
| DpRVI, RVI | Biomasa bajo nubes LAC | S1 |
| LST | Estrés térmico | S3 |

## Fenología

Alinear con stages: Vegetative → Flowering → Pod → Maturity (`CROP_PROFILES.soybean`).

## Flags automáticos

- `ndre_early_stress` — NDRE < 0.28
- `rust_risk_ndre` — pendiente NDRE 7d ≤ -0.025
- `sds_moisture_pattern` — MSI > 1.8 y LSWI < 0
- `dpRvi_biomass_anomaly` — caída DpRVI 7d

## Fusión

Score ponderado por perfil `soybean.ts` + ML baseline RF en paralelo (`lib/science/ml/predict.ts`).

## Integración producto

- Alertas tipo `science_multisensor` en cron
- Diagnóstico inyecta `MultisensorAnalysis` en prompt
- Monitor: badge Science score → `/science/soybean`
