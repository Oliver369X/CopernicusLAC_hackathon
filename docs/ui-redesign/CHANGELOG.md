# Changelog UI Redesign

Registro para revisión del equipo antes de merge a `main`. Formato: fecha | archivo | qué | por qué | viewport sugerido.

---

## 2026-05-29 — Fase 1 (branch_adrian7)

### `app/globals.css`

- **Qué:** Paleta Copernicus LAC (teal primary, earth secondary, soil accent), tokens `--copernicus-*`, health/chart en `@theme`, gradientes `page-gradient`/`auth-panel`, utilidades motion (`animate-fade-in-up`, `stagger-children`, `motion-reduce:*`).
- **Por qué:** Eliminar aspecto genérico azul SaaS; una fuente de verdad para fases 2–5.
- **Probar:** `/dashboard`, `/login` — desktop 1280px y móvil 375px.

### `lib/design/tokens.ts` (nuevo)

- **Qué:** `chartColors`, `healthColors`, `riskLevels`, `chartTooltipStyle` para Recharts.
- **Por qué:** Sincronizar JS con CSS; migración gradual de charts.
- **Probar:** Dashboard → gráfico circular de cultivos.

### `components/ui/motion.tsx` (nuevo)

- **Qué:** `FadeIn`, `StaggerList` con clases CSS y `prefers-reduced-motion`.
- **Por qué:** Animaciones consistentes sin framer-motion.

### `components/layout/page-header.tsx`

- **Qué:** `FadeIn` en header, acciones full-width en móvil, tipografía refinada.
- **Probar:** Panel de control en 375px.

### `components/layout/kpi-stat.tsx`

- **Qué:** Variantes con tokens `health-*` / `primary`, hover motion-safe, tamaños responsive.
- **Probar:** Fila KPI dashboard 2 cols móvil / 5 desktop.

### `components/layout/app-shell.tsx`

- **Qué:** Brand gradient teal→earth, nav `duration-200`, sidebar ring teal sutil.
- **Probar:** Navegación activa Panel vs Monitoreo.

### `components/layout/auth-layout.tsx`

- **Qué:** `FadeIn`/`StaggerList` en features, iconos con ring primary.
- **Probar:** `/login` desktop y móvil.

### `components/ui/button.tsx`, `card.tsx`, `badge.tsx`

- **Qué:** `rounded-lg`, focus ring primary, card `border-border/60`, badge `success`/`warning` variants.
- **Probar:** Botón “Ver alertas”, badges en header.

### `app/layout.tsx`

- **Qué:** Eliminado `metadata.generator: 'v0.app'`.
- **Por qué:** Metadata de producto real.

### `app/dashboard/page.tsx`

- **Qué:** `DEFAULT_CROP_DATA` y `healthChartData` usan `chartColors` / `healthColors`.
- **Por qué:** Componente de referencia para Fase 3.

### `lib/services/copernicus/statistics.ts`

- **Qué:** Tipado `BandEntry` en `bandStats` para que `pnpm build` pase.
- **Por qué:** Error TS preexistente en la rama; bloqueaba verificación de Fase 1.

---

**Estado merge:** Pendiente de aprobación del equipo.

**Verificación:** `pnpm test` (28 tests) y `pnpm build` OK en `branch_adrian7`.

---

## 2026-05-29 — Fase 2 (shell y navegación)

### `lib/navigation/config.ts` (nuevo)

- **Qué:** `navGroups`, `getPageTitle`, `isActivePath`, clave sidebar colapsado.
- **Por qué:** Una sola fuente para shell y futuras breadcrumbs.

### `components/layout/sidebar-nav.tsx` (nuevo)

- **Qué:** Nav con indicador activo, tooltips en modo colapsado, scroll interno.
- **Probar:** Desktop colapsado + hover en iconos.

### `components/layout/app-shell.tsx`

- **Qué:** Sidebar colapsable, header con título de página, sheet móvil safe-area, cierre al cambiar ruta, atajo alertas en móvil.
- **Probar:** 375px menú hamburguesa; 1280px contraer/expandir sidebar.

### `components/auth-header-actions.tsx`

- **Qué:** Variantes `sidebar` | `header` | `collapsed`, tarjeta de sesión en sidebar.
- **Probar:** Footer del menú móvil y sidebar desktop.

### `components/pwa-install-prompt.tsx`

- **Qué:** Textos ES, estilo glass Copernicus, safe-area inferior, dismiss en sesión.
- **Probar:** Bottom en móvil sin tapar home indicator.

---

## 2026-05-29 — Fase 3 (panel, analítica, perspectivas)

### `lib/design/tokens.ts`

- **Qué:** `healthLabelEs`, `envStatusLabelEs`, `priorityLabelEs`, `cropLabelEs`, `chartSeries`, `healthDistributionToChartData`, ejes/grid.
- **Por qué:** Una API para las 3 páginas analíticas.

### `components/charts/chart-frame.tsx`, `metric-progress-row.tsx`

- **Qué:** Contenedor responsive Recharts + filas de progreso reutilizables.
- **Probar:** Cualquier gráfico en dashboard/analytics.

### `components/insights/recommendation-card.tsx`

- **Qué:** Tarjeta de acción con badge que no trunca en 375px.
- **Probar:** `/insights` → Acciones recomendadas.

### `app/dashboard/page.tsx`

- **Qué:** Días Lun–Dom, leyendas ES, ChartFrame, MetricProgressRow riesgo, StaggerList KPI.
- **Probar:** `/dashboard` móvil y desktop.

### `app/analytics/page.tsx`

- **Qué:** KpiStat, eliminado `COLORS`, textos ES, `ComposedChart` ROI, glass-card, link Revisar → `/monitor`.
- **Probar:** `/analytics` filtros tiempo scroll horizontal móvil.

### `app/insights/page.tsx`

- **Qué:** Textos ES completos, RecommendationCard, tabla → cards en `<md`, scatter con `chartColors[0]`.
- **Probar:** `/insights` 375px badges viabilidad climática.

**Verificación Fase 3:** `pnpm test` (28) + `pnpm build` OK.

---

## 2026-05-29 — Fase 4 (monitoreo y app de campo)

### `components/field/field-app-shell.tsx`, `connection-status.tsx`

- **Qué:** Shell PWA de campo con nav inferior activa, safe-area iOS, banner online/offline.
- **Probar:** `/field` en 375px, rotar a landscape.

### `components/monitor/monitor-client.tsx`

- **Qué:** UI en español, ChartFrame tendencia, tokens Recharts, grid responsive.
- **Probar:** `/monitor` selector de campo y mapa S2.

### `components/monitor/satellite-map.tsx`, `satellite-map-panel.tsx`

- **Qué:** Altura responsive/landscape, bordes teal, capas con scroll horizontal.
- **Probar:** Mapa en móvil horizontal.

### `components/dashboard/health-metrics.tsx`, `zone-grid.tsx`, `field-map.tsx`

- **Qué:** Tokens Copernicus, leyendas ES en heatmap.
- **Probar:** Panel lateral en monitor.

### `app/field/*`

- **Qué:** Páginas campo, captura, historial y diagnóstico en español; glass-card; targets 44px.
- **Probar:** Flujo captura → diagnóstico → historial.

**Verificación Fase 4:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Fase 5 (pulido, science, alertas, QA)

### `lib/i18n/labels.ts` (nuevo)

- **Qué:** `labelAlertType`, `labelAlertSeverity` en español.
- **Por qué:** Consistencia i18n en alertas sin duplicar strings.

### `app/alerts/page.tsx`

- **Qué:** `PageContainer`, `KpiStat`, filtros responsive, cards `glass-card`, badges severidad/tipo ES.
- **Probar:** `/alerts` 375px — scroll filtros, marcar resuelta.

### `app/alerts/settings/page.tsx`

- **Qué:** Traducción completa, layout narrow, canales y tipos en ES, enlaces a monitor por campo.
- **Probar:** Guardar configuración y volver a lista.

### `components/science/science-crop-client.tsx`, `science-studies-client.tsx`

- **Qué:** `ChartFrame`, `chartSeries` / ejes / tooltip tokens, `glass-card`, etiquetas salud ES.
- **Probar:** Serie NDVI en lab soja; barras validación en `/science/studies`.

### `app/science/page.tsx`

- **Qué:** Gradientes de cultivo con `primary` / `secondary` / `accent` Copernicus.
- **Probar:** Hover tarjetas hub.

### `lib/design/tokens.ts`

- **Qué:** Series `ndvi`, `ndre`, `dpRvi`, `rules`, `ml` en `chartSeries`.
- **Por qué:** Eliminar hex sueltos en Recharts del lab.

### Eliminados

- `components/app-nav.tsx`
- `styles/globals.css`

**Verificación Fase 5:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Fase 6 (visual audaz, móvil, bug alertas)

### Bug: keys duplicadas en alertas

- **Qué:** `createAlertId()` estable; dedupe en `use-alerts`; textos del motor en ES.
- **Probar:** `/alerts` — consola limpia.

### `app/globals.css`

- **Qué:** Mesh, glows, `.btn-copernicus`, glass-card hover, primary `#2dd4bf`.
- **Probar:** Login y dashboard — gradiente visible en fondo y botones.

### Shell y layout responsive

- **Qué:** Header móvil con título; `HorizontalScrollRow` / `ResponsiveToolbar` / `BadgeRow`; science + compare + monitor.
- **Probar:** `/science/soybean` 375px — tabs scroll, badges sin recorte.

**Verificación Fase 6:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Fase 7 (panel de control + hydration fechas)

### `lib/i18n/format-date.ts`, `components/charts/chart-tooltip.tsx`

- **Qué:** Formato UTC estable; tooltip Recharts con texto claro.
- **Por qué:** Hydration mismatch en alertas; tooltips grises al click en pastel.

### `components/charts/crop-distribution-chart.tsx`

- **Qué:** Donut sin labels en rebanadas; leyenda + lista resumen; activeShape teal.
- **Probar:** Maíz visible en 375px.

### `components/charts/field-health-bar-chart.tsx`

- **Qué:** Barras por campo real (no categorías Excelente/Bueno).
- **Probar:** Nombres de campo en eje X.

### `app/dashboard/page.tsx`

- **Qué:** Nuevos charts, riesgo con labels cortos en móvil, enlace a analítica.
- **Probar:** Panel desktop y móvil.

### `app/alerts/page.tsx`, `app/field/*`, `science-studies-client`

- **Qué:** `formatDateTimeEs` en lugar de `toLocaleString`.
- **Probar:** `/alerts` sin warning hydration.

**Verificación Fase 7:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Fase 8 (analítica y monitoreo)

### `components/charts/distribution-donut-chart.tsx`

- **Qué:** Componente genérico donut + lista % (reemplaza crop-distribution-chart).
- **Probar:** Analítica y panel — sin leyenda duplicada ni labels recortados.

### `app/analytics/page.tsx`

- **Qué:** Dos donuts + timeline determinista + tooltips legibles.

### `components/monitor/monitor-client.tsx`

- **Qué:** Fuentes ES, selector cultivo ES, alertas, layout móvil, fechas estables.

### `lib/i18n/data-source.ts`, `lib/analytics/risk-timeline.ts`

- **Qué:** Etiquetas de fuente; serie de riesgo sin aleatoriedad.

**Verificación Fase 8:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Ciencia soja + analítica legible

### `/science/soybean` — error JSON

- **`lib/fetch/parse-json-response.ts`:** parseo seguro (cuerpo vacío / HTML / timeout).
- **APIs** `analysis`, `timeseries`, `experiments`: try/catch siempre devuelven JSON; timeout Copernicus 12s.
- **`science-crop-client`:** toast + tarjeta “Reintentar” si falla la carga.

### `/analytics` — gráficos responsive

- **`FieldComparisonChart`:** barras horizontales, nombres legibles, tooltip con nombre completo.
- **`RoiEconomicChart`**, **`RiskTimelineChart`:** ejes 12px, leyendas 13px, más altura en móvil.
- Donuts: lista inferior `text-sm`.

---

## 2026-05-29 — Perspectivas + header global

### Header (`app-shell`)

- Eliminado el subtítulo gris duplicado (p. ej. «Perspectivas» bajo «Perspectivas avanzadas», «Lab. Científico» bajo «Laboratorio científico») en **todas** las rutas.

### `/insights`

- Tooltip del gráfico NDVI/rendimiento con `ChartTooltipContent` (texto claro, no gris ilegible).
- Valores redondeados a **máx. 2 decimales** (`formatDecimal` / `roundDecimal`).

### Ciencia — `optical.ndre.toFixed is not a function`

- `coerceNumber` al cargar índices ópticos/radar desde API/DB; narrativas usan `formatDecimal`.

---

## 2026-05-29 — Fase 9 (laboratorio científico completo)

### `/science` y subpáginas

- Títulos en barra: «Soja — Laboratorio», «Comparar cultivos», «Estudios y validación», etc.
- Sin H1 duplicado en contenido (solo descripción + shell).
- Hub, compare, studies, bibliography, crop labs: responsive, tooltips legibles, JSON seguro.

**Verificación Fase 9:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Fase 10 (alertas)

### `/alerts` y `/alerts/settings`

- Título único en barra; descripción en contenido (sin H1 duplicado).
- `AlertListCard`: tipografía legible, badge «Resuelta», acción recomendada destacada.
- `AlertChannelRow`: Switch en lugar de botones Activado/Desactivado.
- Tipos de alerta: severidad mínima funcional; restablecer valores.
- API settings estable sin DB; `parseJsonResponse` en cliente.

**Verificación Fase 10:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Fase 11 (app de campo)

### `/field` y subrutas

- Cabecera con un solo título dinámico (sin «Doctor Soya» duplicado).
- Monitor: selector campo+zona unificado, métricas en tarjetas, acciones tipo card.
- Historial: diagnósticos en español, fallback si falla la imagen, `parseJsonResponse`.
- Diagnóstico y captura alineados al rediseño; decimales con `formatDecimal`.

**Verificación Fase 11:** `pnpm test` + `pnpm build` OK.

---

## 2026-05-29 — Pre-deploy

- Middleware: `/science` en rutas protegidas.
- Cliente: `parseJsonResponse` en `use-fields`, monitor, login, register, capture.
- `viewport` export en `app/layout.tsx` (Next.js 16).
- Playwright smoke (`e2e/smoke.spec.ts`), CI en `branch_adrian7`.
- Docs: [PRE-DEPLOY-CHECKLIST.md](../PRE-DEPLOY-CHECKLIST.md), [DEPLOY-VPS.md](../DEPLOY-VPS.md) alineado Postgres+Docker, [MERGE-TO-MAIN.md](../MERGE-TO-MAIN.md).
