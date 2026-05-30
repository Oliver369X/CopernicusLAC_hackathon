# Deploy ML en Modal (fase futura)

## Estado actual

- **Inferencia local** en Node vía [`lib/science/ml/model-registry.ts`](../../lib/science/ml/model-registry.ts)
- Modelos en `models/{crop}_rf_v1.json` montados en el servicio `web`
- Entrenamiento offline: `python worker/ml/train_soybean.py`

## Cuando uses Modal

1. Desplegar endpoint POST que reciba `{ crop, features }` y devuelva `{ label, score }`
2. Configurar en producción:

```bash
ML_REMOTE_URL=https://tu-app.modal.run/predict
ML_ENABLED=true
```

3. [`lib/science/ml/remote-predict.ts`](../../lib/science/ml/remote-predict.ts) intentará remoto primero; fallback a JSON local si falla.

## No incluido aún

- Código Modal / Dockerfile Modal
- Retrain automático en la nube

Esto se implementará en el deploy respectivo cuando decidas mover inferencia pesada fuera del VPS.
