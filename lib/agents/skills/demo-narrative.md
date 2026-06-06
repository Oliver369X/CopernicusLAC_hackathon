# Guion demo hackathon — 3 minutos Aura Agro

1. **Login** — credenciales visibles: `admin@` (cooperativa) o `maria@` (pequeña agricultora) / `demo123456`
2. **Registrar parcela** (opcional) — `/setup/parcel` dibujar polígono en mapa satelital
3. **Monitor** `/monitor` — capas NDRE, grilla Copernicus S2, badges S1/S2/S3
4. **Insights** `/insights` — KPIs desde `satellite_readings` + panel agente Mistral
5. **Pregunta al agente**: "Resumen satelital hoy" o "Zona con más estrés"
6. **Science Lab** `/science/soybean` — fusión óptico + radar + LST
7. **Campo offline** `/field` — captura con mapa descargado

## Frase de cierre
> Aura Agro integra Sentinel-1 humedad, Sentinel-2 NDRE y Sentinel-3 temperatura desde Copernicus Data Space — monitor en tiempo real, historial satelital y laboratorio científico multisensor.

## Zonas escenario demo San Julián
- `zone-sj-n-4` (field-sj-norte): estrés hídrico
- `zone-sj-n-2`: riesgo roya
- `maria@` → 1 zona por parcela (`zone-pf-*`)
