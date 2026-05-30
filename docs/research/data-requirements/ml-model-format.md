# Formato modelos ML (inferencia Node)

## Ubicación

```
models/
  soybean_rf_v1.json
  wheat_rf_v1.json
  corn_rf_v1.json
```

Env: `ML_MODEL_PATH=./models/soybean_rf_v1.json` (default por cultivo: `models/{crop}_rf_v1.json`)

## Formato v2 (ruleSurrogate)

```json
{
  "crop": "soybean",
  "version": "1.1.0",
  "inferenceFormat": "ruleSurrogate",
  "featureOrder": ["ndvi", "ndre", "evi", "lswi", "msi", "dpRvi", "rvi", "ndviSlope7d", "ndreSlope7d", "daysFromPlanting", "lst"],
  "baseScores": { "excellent": 0.25, "good": 0.25, "warning": 0.25, "critical": 0.25 },
  "rules": [
    { "feature": "ndre", "op": "lt", "threshold": 0.28, "classDelta": { ... } }
  ]
}
```

## Entrenamiento offline

```bash
python worker/ml/train_soybean.py --output models/soybean_rf_v1.json
```

Copiar JSON al servidor (volumen `models/` en Docker web). **No** hay contenedor ML en producción.

## Modal (futuro)

Si `ML_REMOTE_URL` está definido, inferencia remota. Ver [`deploy-ml-modal.md`](../deploy-ml-modal.md).
