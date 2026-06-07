# Flujo de informes Aura (plantillas)

El agente **no diseña el formato** desde cero. Usá las tools en este orden:

1. **listReportTemplates** — tipos disponibles (enfermedades, histórico 3y, seguridad alimentaria, resumen finca, estado de zona).
2. **prepareReportDraft** — obtiene datos scoped + secciones auto rellenadas + slots `aiSections` con `promptHint`.
3. Redactá **solo** el texto de cada `aiSection` según el snapshot (sin inventar datos).
4. **assembleReport** — pasa `sectionContent: { sectionId: "texto..." }` y recibís markdown final listo para mostrar.

Tipos sugeridos por intención:
- "informe de roya / enfermedades" → `disease-situation`
- "histórico / 3 años / campañas" → `historical-3y`
- "seguridad alimentaria / trazabilidad" → `food-safety`
- "resumen de mi finca" → `field-summary`
- "estado de esta zona" → `zone-status`
