# Fase 2 — Shell y navegación global

**Estado:** Completada (branch_adrian7)

## Alcance

- Refactor completo [`components/layout/app-shell.tsx`](../../components/layout/app-shell.tsx)
- Sidebar colapsable en desktop
- Sheet móvil: safe-area iOS, cierre al navegar, footer usuario
- Estados activos más claros (indicador lateral)
- PWA install toast estilizado Copernicus
- Unificar header móvil/desktop

## Archivos previstos

- `components/layout/app-shell.tsx`
- `components/pwa-install-prompt.tsx`
- `components/auth-header-actions.tsx`

## Checklist

- [x] Sidebar desktop colapsable (persistencia `localStorage`)
- [x] Indicador activo barra lateral teal
- [x] Tooltips en modo colapsado
- [x] Sheet móvil con safe-area y cierre al navegar
- [x] Header unificado con título de página (desktop)
- [x] PWA prompt en español + estilo Copernicus
- [x] `lib/navigation/config.ts` centralizado

## Criterios

- Nav usable con una mano en 375px
- Sin solapamiento con notch/home indicator
