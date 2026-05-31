# PART-11 — App de campo (`/field`)

## Objetivo

Alinear la app móvil de campo con el rediseño Copernicus LAC: un solo título en cabecera, tarjetas de acción claras, textos en español y números con máximo 2 decimales.

## Cambios

- `field-app-shell.tsx`: título dinámico por ruta; eliminado subtítulo «Doctor Soya».
- `app/field/page.tsx`: selector campo+zona unificado; métricas con `FieldMetricTile`; acciones con `FieldActionLink`.
- `app/field/history/page.tsx`: tarjetas `ObservationHistoryCard`, `parseJsonResponse`, fallback de imagen.
- `app/field/diagnostics/page.tsx`: UI en español, `formatDecimal`, `parseJsonResponse`.
- `app/field/capture/page.tsx`: intro coherente, GPS con `formatDecimal`.
- `lib/i18n/observation-labels.ts`: nombres de enfermedades y severidad en ES.
- `lib/field/page-titles.ts`: títulos de cabecera por ruta.
- Mock `crop-data.ts`: URLs de imagen estables (picsum).

## Verificación

```bash
pnpm test
pnpm build
```

Rutas: `/field`, `/field/capture`, `/field/diagnostics`, `/field/history`.
