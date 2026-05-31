# Visión del rediseño

## Identidad: Copernicus LAC

Paleta inspirada en datos satelitales CDSE y contexto agrícola LAC:

| Token semántico | Hex (referencia) | Uso |
|-----------------|------------------|-----|
| Copernicus teal | `#14b8a6` | Primary — acciones, nav activa, acentos CDSE |
| Earth green | `#22c55e` | Secondary — salud vegetación, éxito |
| Soil amber | `#d97706` | Accent — advertencias operativas |
| Ocean deep | `#071018` | Background principal |
| Surface elevated | `#0f1f2a` | Cards y paneles |
| Mist slate | `#94a3b8` | Texto secundario |

### Salud del cultivo (`--health-*`)

- **Excellent:** `#22c55e`
- **Good:** `#84cc16`
- **Warning:** `#d97706`
- **Critical:** `#ef4444`

## Principios UX

1. **Legibilidad:** contraste mínimo AA en texto y badges; valores numéricos con `tabular-nums`.
2. **Touch targets:** mínimo 44×44 px en móvil (botones nav, CTAs).
3. **Jerarquía:** títulos de página → KPI → cards secundarias → detalle.
4. **Motion:** animaciones sutiles (150–400 ms); respetar `prefers-reduced-motion`.
5. **Responsive:** KPI 2 columnas en móvil, 5 en desktop; header apila acciones en pantallas estrechas.
6. **Una fuente de verdad:** CSS variables en `app/globals.css` + `lib/design/tokens.ts` para charts.

## Stack (sin cambios de dependencias)

- Next.js App Router + Tailwind v4 + shadcn/ui
- Motion: CSS + `components/ui/motion.tsx` (sin framer-motion)

## Código legacy (eliminado en Fase 5)

- ~~`components/app-nav.tsx`~~ — sustituido por `app-shell` + `sidebar-nav`
- ~~`styles/globals.css`~~ — duplicado; canónico: `app/globals.css`
