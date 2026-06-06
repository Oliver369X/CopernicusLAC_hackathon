# Rutas plataforma Doctor Soya — San Julián

## Región demo

**San Julián, Santa Cruz — Bolivia** (tile Sentinel `20KND`)

## Campos demo (IDs)

| ID | Nombre | Cultivo |
|----|--------|---------|
| `field-sj-norte` | Lote Norte San Julián | soja |
| `field-sj-este` | Parcela Este San Ramón | maíz |
| `field-sj-oeste` | Chacra Oeste Pailón | trigo |
| `field-sj-sur` | Sector Sur Tres Cruces | soja |

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/monitor` | Mapa satelital multisensor Copernicus |
| `/monitor?field=field-sj-norte&zone=zone-sj-n-4` | Monitor con contexto de zona |
| `/analytics` | Resumen NDVI/NDRE por campo |
| `/insights` | Perspectivas avanzadas + agente Mistral |
| `/insights?field=field-sj-norte` | Agente con contexto de campo |
| `/science` | Laboratorio científico multisensor |
| `/science/soybean?field=field-sj-norte&zone=zone-sj-n-4&tab=lab` | Lab soja — modo experimentos |
| `/science/studies?crop=soybean&field=field-sj-norte` | Estudios y validación |
| `/field` | Modo campo offline + captura |
| `/alerts` | Alertas activas |
| `/login` | Autenticación con cuentas demo |

## Flujo recomendado demo

1. `/monitor` — seleccionar lote y zona
2. `/science/soybean?tab=lab` — ejecutar hipótesis multisensor
3. `/science/studies` — importar etiquetas CSV y validar
4. `/insights` — preguntar al agente con contexto del campo

## API útiles

- `GET /api/health` — estado del servicio
- `GET /api/insights/context` — contexto insights satelital
- `POST /api/agents/chat` — asistente multiagente
