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
| `/onboarding` | Alta de finca: marcar parcela en mapa o importar archivo |
| `/setup/parcel` | Dibujar polígono de parcela (MapLibre + satélite Esri) |
| `/gestion` | Parcelas, equipo; botón **Agregar parcela** |

## Cuentas demo

| Email | Modelo |
|-------|--------|
| `admin@doctorsoya.app` | Cooperativa — 4 campos, múltiples zonas |
| `maria@doctorsoya.app` | Pequeña agricultora — 3 parcelas, 1 zona c/u |

## Flujo recomendado demo

1. `/monitor` — seleccionar lote y zona
2. `/science/soybean?tab=lab` — ejecutar hipótesis multisensor
3. `/science/studies` — importar etiquetas CSV y validar
4. `/insights` — preguntar al agente con contexto del campo

## API útiles

- `GET /api/health` — estado del servicio
- `GET /api/insights/context` — contexto insights satelital
- `POST /api/agents/chat` — asistente multiagente
