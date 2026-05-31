# Fase 9 — Laboratorio científico

**Estado:** Completada (2026-05-29)

## Rutas

| Ruta | Componente |
|------|------------|
| `/science` | Hub cultivos |
| `/science/[crop]` | `ScienceCropClient` |
| `/science/compare` | Comparador |
| `/science/studies` | Estudios y validación |
| `/science/bibliography` | Referencias |

## Cambios

- Títulos en barra superior vía `getPageTitle` (sin subtítulo gris duplicado).
- `PageHeader` sin `title` cuando el shell ya muestra el H1 contextual.
- JSON seguro (`parseJsonResponse`) en cliente y APIs con try/catch.
- Números con máx. 2 decimales (`formatDecimal`).
- Gráficos con `ChartTooltipContent` y ticks legibles.
- Hub: cards cultivos `text-sm`, grid responsive.
- Comparador: explica cultivo activo vs enlaces a otros labs.

## Checklist

- [ ] `/science` 375px — grid 1 columna
- [ ] `/science/soybean` — carga sin error JSON
- [ ] `/science/studies` — importar CSV / métricas
- [ ] Header sin línea gris «Lab. Científico» bajo título
