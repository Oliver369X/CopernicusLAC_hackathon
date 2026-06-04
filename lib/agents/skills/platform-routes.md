# Rutas plataforma Aura Agro

| Ruta | Descripción |
|------|-------------|
| `/monitor` | Mapa satelital multisensor Copernicus |
| `/analytics` | Resumen NDVI/NDRE por campo |
| `/insights` | Perspectivas avanzadas + agente Mistral |
| `/science` | Laboratorio científico multisensor |
| `/science/soybean` | Análisis soja (NDRE, DpRVI) |
| `/science/wheat` | Análisis trigo (REDSI) |
| `/field` | Modo campo offline + captura |
| `/alerts` | Alertas activas |
| `/login` | Autenticación con cuentas demo |

## API útiles
- `GET /api/health` — estado del servicio
- `GET /api/insights/context` — contexto insights satelital
- `POST /api/agents/chat` — asistente multiagente
