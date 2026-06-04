# Demo pitch BID — Doctor Soya (10 min)

## Mensaje central (30 s)

Doctor Soya permite que un productor en América Latina cargue sus lotes una sola vez (Shapefile/CSV) y en menos de 48 horas vea salud del cultivo con datos **Copernicus Sentinel**, alertas y un resumen agronómico en español — sin dibujar mil puntos en el mapa.

## Guión recomendado

| Min | Pantalla | Qué decir |
|-----|----------|-----------|
| 0–1 | Login demo o registro | «Tres roles: dueño, analista, campo. Producción sin credenciales demo.» |
| 1–3 | `/onboarding` | Subir GeoJSON/KML/Shapefile → preview → importar. «Un archivo, todos los lotes.» |
| 3–6 | `/monitor` | Zona con estrés: NDVI, heatmap, **Resumen agronómico**. Badges Copernicus CDSE. |
| 6–8 | `/insights` | Pregunta: «¿Qué hago en la zona con peor NDVI?» Agente cita mismos números. |
| 8–9 | `/analytics` | Exportar CSV y PDF con fuentes y fecha de captura. |
| 9–10 | Cierre | Impacto LAC + piloto 10–15 fincas + USD 50k para escalar. |

## Hilo alternativo (solo Copernicus, 5 min)

1. `/monitor` — grilla S2, S1 humedad, S3 LST  
2. `/science/soybean` — fusión multisensor  
3. `/field/capture` — foto + GPS offline  

## Checklist pre-pitch

```bash
pnpm docker:infra   # o prod HTTPS
curl -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/fetch-metrics?job=all"
curl -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/fetch-metrics?job=narrative-batch"
pnpm verify:pilot
```

- `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` en producción  
- Capturas: onboarding, monitor narrativa, PDF export  
- Video 2 min (Loom) con mismo flujo  

## Frase de cierre BID

> «Con el apoyo del BID escalamos un piloto de 10–15 fincas en LAC: menos tiempo de configuración, más decisiones de riego y sanidad basadas en satélite europeo y alertas en el bolsillo del productor.»

Ver: [PILOTO-BID.md](./PILOTO-BID.md), [DEPLOY-VPS.md](./DEPLOY-VPS.md), [DEMO-HACKATHON.md](./DEMO-HACKATHON.md).
