# Fase 5 — Science, alertas, auth y QA final



**Estado:** Completada (2026-05-29, `branch_adrian7`)



## Alcance entregado



| Área | Cambios |

|------|---------|

| **Alertas** | `app/alerts/page.tsx` — ES, `KpiStat`, `StaggerList`, cards responsive, badges severidad/tipo |

| **Config alertas** | `app/alerts/settings/page.tsx` — traducción completa, `PageContainer`, `glass-card`, touch 44px |

| **i18n** | `lib/i18n/labels.ts` — tipos y severidades de alerta |

| **Science lab** | `science-crop-client`, `science-studies-client` — `ChartFrame`, tokens Recharts, `glass-card`, `PageContainer` |

| **Hub science** | `app/science/page.tsx` — gradientes con tokens Copernicus (primary/secondary/accent) |

| **Tokens** | `chartSeries.ndvi`, `ndre`, `dpRvi`, `rules`, `ml` |

| **Legacy** | Eliminados `components/app-nav.tsx`, `styles/globals.css` (sin referencias en código) |

| **Auth** | `login` / `register` ya usaban `AuthLayout` en español — sin cambios funcionales |



## Rutas a probar manualmente



1. `/alerts` — filtros scroll horizontal, KPI 2+1 cols en móvil, lista vacía

2. `/alerts/settings` — canales, WhatsApp, tipos, guardar

3. `/science` — tarjetas cultivos hover

4. `/science/soybean` (u otro cultivo) — serie temporal con leyenda

5. `/science/studies` — gráfico barras reglas vs ML

6. `/login`, `/register` — layout auth + safe-area



**Viewports:** 375×812 (móvil), 1280×800 (desktop).



## Checklist WCAG / merge a `main`



- [x] Contraste texto en badges `success` / `warning` / `destructive` (tema oscuro) — revisado en tokens `@theme`

- [x] Focus visible en botones y enlaces del shell — `focus-visible:ring` en `button.tsx` y nav

- [x] `prefers-reduced-motion`: sin animaciones intrusivas (`motion-reduce` en utilidades)

- [x] Targets táctiles ≥ 44px en field app y alertas (`h-10` / `h-11`)

- [x] Gráficos Recharts con `aria-label` vía `ChartFrame`

- [x] Sin imports a `app-nav` ni `styles/globals.css`

- [x] `pnpm test` en verde

- [x] `pnpm build` en verde

- [ ] Capturas móvil + desktop en el PR (equipo)

- [ ] Lighthouse móvil (Performance + Accessibility) — ejecutar en equipo; objetivo ≥ 85 si es posible



## Lighthouse (manual)



```bash

pnpm build && pnpm start

# Chrome DevTools → Lighthouse → Mobile → Performance + Accessibility

```



Rutas prioritarias: `/dashboard`, `/alerts`, `/science`, `/field`.



## Archivos eliminados



- `components/app-nav.tsx` — nav duplicada; reemplazada por `app-shell` + `sidebar-nav`

- `styles/globals.css` — duplicado de `app/globals.css`



## Criterios de cierre



- UI de alertas y science alineada con tokens Copernicus LAC

- Textos de producto en español en rutas de esta fase

- Código legacy retirado

- Documentación y changelog actualizados para revisión del equipo


