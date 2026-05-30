# ML baseline soja — Random Forest surrogate

## Pipeline

1. Features (~11 dims): `lib/science/ml/features.ts` via `buildMlFeatures()`
2. Entrenamiento Python: `worker/ml/train_soybean.py`
3. Export JSON: `models/soybean_rf_v1.json`
4. Inferencia Node: reglas surrogate en `predictMlHealth()` (fallback si `ML_ENABLED=false`)

## Dataset inicial

- Combinación sintética (script Python) + perturbaciones de reglas
- Re-entrenar cuando existan filas en `science_validation_labels`

## Variables de entorno

```bash
ML_ENABLED=true
ML_MODEL_PATH=./models/soybean_rf_v1.json
```

## Concordancia UI

Panel "Reglas vs ML" en `/science/soybean` — `mlConcordance` cuando labels coinciden.
