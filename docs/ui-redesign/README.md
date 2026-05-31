# Rediseño UI/UX — Doctor Soya

Documentación del rediseño en **5 fases** sobre la rama `branch_adrian7`. Objetivo: UI profesional, identidad **Copernicus LAC**, responsive móvil/desktop, motion accesible.

## Cómo revisar

```bash
git checkout branch_adrian7
pnpm install
pnpm dev
```

Probar en:

- **Móvil:** 375×812 (Chrome DevTools)
- **Desktop:** 1280×800 o superior
- **Accesibilidad:** activar “Reducir movimiento” en el SO y comprobar que no hay animaciones intrusivas

## Fases

| Fase | Documento | Estado |
|------|-----------|--------|
| 1 | [PART-01-foundation.md](./PART-01-foundation.md) | Completada |
| 2 | [PART-02-shell-navigation.md](./PART-02-shell-navigation.md) | Completada |
| 3 | [PART-03-dashboard-analytics.md](./PART-03-dashboard-analytics.md) | Completada |
| 4 | [PART-04-monitor-field.md](./PART-04-monitor-field.md) | Completada |
| 5 | [PART-05-polish-qa.md](./PART-05-polish-qa.md) | Completada |
| 6 | [PART-06-visual-mobile.md](./PART-06-visual-mobile.md) | Completada |
| 7 | [PART-07-dashboard.md](./PART-07-dashboard.md) | Completada |
| 8 | [PART-08-analytics-monitor.md](./PART-08-analytics-monitor.md) | Completada |
| 9 | [PART-09-science.md](./PART-09-science.md) | Completada |
| 10 | [PART-10-alerts.md](./PART-10-alerts.md) | Completada |
| 11 | [PART-11-field.md](./PART-11-field.md) | Completada |

Visión general: [00-overview.md](./00-overview.md)

## Merge a `main`

1. Revisar [CHANGELOG.md](./CHANGELOG.md)
2. Aprobar en equipo (comentarios en PR)
3. Capturas móvil + desktop adjuntas al PR
4. `pnpm test` y `pnpm build` en verde

## Contacto

Rama: `branch_adrian7` — rediseño fases 1–7 (panel, charts, hydration). Listo para revisión y merge a `main`.
