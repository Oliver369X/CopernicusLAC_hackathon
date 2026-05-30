# Marco de validación científica — Science Lab

## Diseño experimental

Parcela × fecha × vector índices × etiqueta campo × concordancia reglas/ML.

## Tablas

- `science_experiments` — hipótesis + resultado JSON
- `science_timeseries` — series normalizadas 90d
- `science_validation_labels` — ground truth agrónomo

## Métricas objetivo

| Métrica | Uso |
|---------|-----|
| Precision/recall | Por enfermedad (roya, GLS, etc.) |
| MAE fenología | Días vs stage esperado |
| Correlación DpRVI-biomasa | Proxy radar |

## Versionado

`SCIENCE_ALGORITHM_VERSION` en env; persistido en cada lectura.

## UI

`/science/studies` — experimentos, formulario validación, concordancia.

## Tests

Golden files por cultivo en `tests/science-multisensor.test.ts`.
