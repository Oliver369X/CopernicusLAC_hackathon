# Fuentes API sugeridas

## Ya integrado

- **Copernicus CDSE**: NDVI, NDRE, S1 VV/VH → cron + `science_timeseries`
- **Open-Meteo**: clima / humedad suelo

## Adaptador genérico (Doctor Soya)

Variables de entorno:

```bash
SCIENCE_DATA_API_URL=https://tu-api.example.com/v1/observations
SCIENCE_DATA_API_KEY=tu-key
SCIENCE_DATA_API_MAPPING='{"itemsPath":"data","crop":"crop_type","fieldId":"parcel_id","capturedAt":"date","diseaseLabel":"disease","severity":"severity_level"}'
```

`POST /api/science/data/sync` descarga JSON, mapea a `GroundTruthRow`, valida e importa.

## Patrón de transformación

```
API response item:
  { "parcel_id": "P001", "crop_type": "soja", "date": "2026-05-01", "disease": "roya" }

→ GroundTruthRow:
  { fieldId: "P001", crop: "soybean", capturedAt: "2026-05-01T00:00:00Z",
    diseaseLabel: "roya", source: "api:generic" }
```

Mapeo de cultivos comunes: `soja/soy` → `soybean`, `maíz/maize` → `corn`, `trigo` → `wheat`.

## Fuentes a explorar (LAC)

| Tipo | Qué buscar | Uso |
|------|------------|-----|
| Ensayos universidad | CSV/API parcelas con roya | Validación trigo/soja |
| Plataformas agrícolas | API parcelas + scouting | Etiquetas + GPS |
| Datasets abiertos | Zenodo, PANGAEA | Benchmark offline café/cacao |

Cuando encuentres una API concreta, añade un adaptador en `lib/science/data/sources/`.
