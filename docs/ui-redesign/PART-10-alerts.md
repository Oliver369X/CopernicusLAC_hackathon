# Fase 10 — Alertas

**Estado:** Completada (2026-05-29)

## Rutas

| Ruta | Contenido |
|------|-----------|
| `/alerts` | Lista, filtros, KPIs, marcar resuelta |
| `/alerts/settings` | Canales, tipos, WhatsApp, campos |

## Cambios

- Título único en shell (sin H1 duplicado en página).
- `AlertListCard` y `AlertChannelRow` (Switch + texto legible).
- Fuente en español (`formatDataSourceLabel`).
- Nombres de zona legibles.
- `parseJsonResponse` en hook y settings.
- API settings GET sin crash si DB no configurada.

## Checklist

- [ ] `/alerts` móvil — cards y botón «Marcar resuelta»
- [ ] `/alerts/settings` — switches y guardar
- [ ] Sin doble título «Alertas» + «Alertas y notificaciones»
