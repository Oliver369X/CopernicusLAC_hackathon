# Doctor Soya

Plataforma de monitoreo agrícola con datos satelitales **Copernicus** (Sentinel-1/2/3), diagnóstico IA y app de campo PWA.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui, Recharts, Leaflet
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Satélite:** Copernicus Data Space Ecosystem (CDSE) — S2 NDVI/NDMI, S1 radar, S3 LST
- **Clima:** Open-Meteo (humedad suelo, ET₀)
- **Incendios:** NASA FIRMS (hotspots VIIRS)
- **IA:** OpenAI Vision o Mistral Pixtral
- **Media:** Supabase Storage y/o Cloudinary CDN
- **Offline:** IndexedDB + Service Worker

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# Completa credenciales (ver tabla abajo)
pnpm dev
```

## Proveedores y credenciales

| Servicio | Variables | Registro | Uso |
|----------|-----------|----------|-----|
| **Copernicus CDSE** | `COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET` | [dataspace.copernicus.eu](https://dataspace.copernicus.eu/) | NDVI, NDMI, grilla heatmap, tiles Leaflet (S2) |
| Copernicus OGC | `COPERNICUS_INSTANCE_ID` | Dashboard CDSE | WMS/WMTS opcional |
| Sentinel Hub | `SENTINEL_HUB_*` | [sentinel-hub.com](https://www.sentinel-hub.com/) | Fallback comercial |
| NASA FIRMS | `NASA_FIRMS_MAP_KEY` | [firms.modaps.eosdis.nasa.gov/api/area](https://firms.modaps.eosdis.nasa.gov/api/area/) | Alertas incendio |
| Open-Meteo | `OPEN_METEO_API_KEY` (opcional) | [open-meteo.com](https://open-meteo.com/) | Clima + humedad suelo |
| OpenAI | `OPENAI_API_KEY` | platform.openai.com | Diagnóstico visión |
| Mistral | `MISTRAL_API_KEY`, `VISION_PROVIDER=mistral` | console.mistral.ai | Diagnóstico alternativo |
| Cloudinary | `CLOUDINARY_*`, `STORAGE_PROVIDER` | cloudinary.com | CDN fotos campo |
| Supabase | `NEXT_PUBLIC_SUPABASE_*` | supabase.com | DB, auth, storage |

### Misiones Copernicus en Doctor Soya

- **Sentinel-2 L2A:** NDVI, NDMI, True Color, grilla 32×32 para heatmap
- **Sentinel-1 GRD:** VH/VV, índice humedad radar (proxy suelo)
- **Sentinel-3 SLSTR:** temperatura superficie (LST)

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta migraciones en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_policies.sql`
   - `supabase/migrations/003_satellite_real.sql`
   - `supabase/migrations/004_real_data_loop.sql`
   - `supabase/migrations/005_climate_readings.sql`
   - `supabase/migrations/006_science_readings.sql`
3. Crea bucket `observations` (privado) en Storage
4. Copia URL y keys a `.env.local`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm test` | Tests Vitest |
| `pnpm lint` | ESLint |
| `pnpm worker` | Cron worker (VPS) |
| `pnpm worker:queue` | BullMQ + Redis |

## Despliegue VPS

Ver [docs/DEPLOY-VPS.md](docs/DEPLOY-VPS.md) y script demo [docs/DEMO-HACKATHON.md](docs/DEMO-HACKATHON.md).

Stack producción: Docker (`web` + `worker` + `caddy` + `redis`) + Supabase Cloud.

## Fase 2 (producto)

- **NDRE** (B08/B05) + toggle en `/monitor`
- Alertas reales desde `satellite_readings` + dedup + hotspot GPS → `/field/capture`
- Fusión S1/S2/S3 en alertas y diagnóstico experto soja/maíz
- WhatsApp Twilio (outbound alertas + inbound foto)
- Mapas offline (SW + IndexedDB) en `/field`
- Clima C3S / ERA5-Land — viabilidad 2030 en `/insights`
- NBR incendios, BullMQ, REDSI opcional (trigo)

## Laboratorio científico (trigo / maíz)

- `/science` — hub multisensor S2+S1
- `/science/wheat`, `/science/corn` — vista cliente + experimentos
- `docs/research/multisensor-agriculture/` — bibliografía local
- Migración `006_science_readings.sql` — `science_experiments`, `science_metadata`

## API Routes

- `POST /api/observations` — guardar observación + foto (Supabase/Cloudinary)
- `POST /api/observations/sync` — sync batch offline
- `POST /api/diagnostics/analyze` — diagnóstico IA (OpenAI/Mistral)
- `GET /api/fields/[id]/metrics?zoneId=` — métricas satélite/clima por zona
- `GET /api/satellite/tiles?layer=ndvi&bbox=...` — PNG Copernicus (proxy server)
- `GET /api/cron/fetch-metrics?job=all` — clima + satélite S1/S2/S3 + FIRMS + alertas
- Jobs cron: `weather`, `satellite`, `fires`, `alerts`, `all`

## Rutas

- `/dashboard` — KPIs y gráficos
- `/monitor` — mapa Leaflet Copernicus + NDVI/NDRE + heatmap real
- `/field/*` — app móvil de campo
- `/alerts` — alertas dinámicas (incl. incendios FIRMS)
- `/login`, `/register` — auth Supabase

Sin Supabase configurado, la app funciona en modo mock local.
