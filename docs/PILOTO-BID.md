# Programa piloto BID — Doctor Soya (10–15 fincas, 90 días)

## Objetivo

Validar adopción real con productores LAC: carga de parcelas sin fricción, datos satélite Copernicus operativos en 48 h, y decisiones agronómicas asistidas (alertas + narrativa + reporte mensual).

## Perfil de participante

- Soja, maíz o trigo; 50–500 ha  
- Shapefile, GeoJSON o CSV con polígonos (WKT o lat/lng)  
- 1 dueño (owner) + hasta 2 técnicos (field_worker)  

## Criterios

| Inclusión | Exclusión |
|-----------|-----------|
| Compromiso 90 días | Sin geometría válida en 14 días |
| Kickoff + 1 sesión import asistida | Incumplimiento reiterado de soporte |
| Consentimiento privacidad en registro | — |

## KPIs (informe BID)

| KPI | Meta | Fuente |
|-----|------|--------|
| Tiempo hasta NDVI en mapa | < 48 h post-import | `import_jobs.updated_at` |
| Zonas con lectura satélite | ≥ 90% | `/api/health/data-pipeline` |
| MAU productores | ≥ 70% cohorte | logins / observaciones |
| Alertas resueltas | ≥ 50% | `alerts.resolved` |
| Informe PDF mensual | ≥ 80% orgs | descargas `/api/reports/pdf` |
| NPS (semana 8 y 12) | ≥ 40 | encuesta externa |

Extracción mensual: `pnpm verify:pilot --org <uuid>`

## Calendario operativo

| Semana | Actividad |
|--------|-----------|
| 1 | Kickoff remoto + plantilla import |
| 1–2 | Sesión 1:1 import asistido por finca |
| 2 | `pnpm verify:pilot` por org; cron si falla |
| 3 | Capacitación: monitor, campo, WhatsApp |
| 4–12 | Check-in quincenal 30 min |
| 12–13 | Informe BID + 3 casos de éxito + testimonial |

## Soporte

- WhatsApp grupo piloto  
- SLA: respuesta < 24 h; críticos < 72 h  
- Equipo: 1 líder piloto, 1 soporte técnico, 1 agrónomo  

## Onboarding técnico (productor)

1. Registro en `https://app.../register` (acepta privacidad)  
2. Wizard `/onboarding`: perfil → import archivo → invitar equipo (opcional)  
3. Esperar barra «Sincronización satelital» (o aviso en dashboard)  
4. Entrar a `/monitor` y configurar alertas en `/alerts/settings`  

## Plantillas

- CSV: `GET /api/fields/import/template`  
- Guía import: enlace en pantalla onboarding  

## Cierre piloto

- Informe PDF KPIs + casos  
- Roadmap comercial (pricing por ha/mes TBD)  
- Decisión escalar a 30+ fincas  
