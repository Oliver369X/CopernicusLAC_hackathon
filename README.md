# Doctor Soya

Plataforma de monitoreo agrícola con datos satelitales **Copernicus** (Sentinel-1/2/3), diagnóstico IA y app de campo PWA.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui, Recharts, Leaflet
- **Backend:** Postgres + MinIO (Docker) — auth JWT propia, sin Supabase obligatorio
- **Satélite:** Copernicus Data Space Ecosystem (CDSE) — S2 NDVI/NDMI, S1 radar, S3 LST
- **Clima:** Open-Meteo (humedad suelo, ET₀)
- **Incendios:** NASA FIRMS (hotspots VIIRS)
- **IA:** OpenAI Vision o Mistral Pixtral
- **Media:** MinIO (local) y/o Cloudinary CDN
- **Offline:** IndexedDB + Service Worker

## Inicio rápido (local)

```bash
pnpm install
pnpm setup      # crea .env, levanta Postgres + MinIO, muestra credenciales demo
pnpm dev        # http://localhost:3000/login
```

Si ya tienes `.env`, solo infra:

```bash
pnpm docker:infra   # Postgres (5433) + MinIO (9000) + bucket observations
pnpm dev
```

Copia manual de variables: `cp .env.local.example .env`

## Primera vez con datos reales

1. `pnpm setup` — Postgres, seed con bounds de zonas y lecturas satélite demo.
2. Opcional: `COPERNICUS_CLIENT_ID` + `SECRET` en `.env` → el setup intenta `cron:satellite` y backfill.
3. `pnpm dev` → login demo o registro nuevo → `/onboarding` para importar GeoJSON/KML/Shapefile/CSV.
4. `pnpm cron:satellite` y `pnpm cron:backfill` si no hay credenciales en setup.
5. `GET /api/health/data-pipeline` — estado de zonas con geometría y satélite.

## Usuarios demo

Al ejecutar `pnpm setup` o `pnpm docker:infra` por primera vez, Postgres carga el seed en `docker/postgres/init/02-seed.sql` con **3 usuarios** y datos de ejemplo (organización, campos, zonas, alertas).

| Email | Rol | Uso |
|-------|-----|-----|
| `admin@doctorsoya.app` | owner | Acceso completo |
| `analista@doctorsoya.app` | admin | Gestión y análisis |
| `campo@doctorsoya.app` | viewer | Solo lectura |

**Contraseña (todos):** `demo123456`

En desarrollo, la pantalla de login muestra estas cuentas si `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true` (viene activado en `.env.local.example`).

## Infraestructura Docker

| Servicio | URL / puerto | Credenciales |
|----------|--------------|--------------|
| Postgres | `localhost:5433` | `doctorsoya` / `doctorsoya` — DB: `doctorsoya` |
| MinIO API | `http://localhost:9000` | `minioadmin` / `minioadmin` |
| MinIO consola | `http://localhost:9001` | mismo usuario |
| Bucket fotos | `observations` | creado automáticamente |

> Postgres usa el puerto **5433** en el host para no chocar con una instalación local en el 5432.

Variables clave en `.env`:

```env
DATABASE_URL=postgresql://doctorsoya:doctorsoya@localhost:5433/doctorsoya
AUTH_SECRET=change-me-in-production
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
```

## Proveedores y credenciales (opcionales)

| Servicio | Variables | Registro | Uso |
|----------|-----------|----------|-----|
| **Copernicus CDSE** | `COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET` | [dataspace.copernicus.eu](https://dataspace.copernicus.eu/) (cuenta **aparte** de [copernicuslac-panama.eu](https://www.copernicuslac-panama.eu/)) | NDVI, NDMI, grilla heatmap, tiles Leaflet (S2) |
| Copernicus OGC | `COPERNICUS_INSTANCE_ID` | Dashboard CDSE | WMS/WMTS opcional |
| Sentinel Hub | `SENTINEL_HUB_*` | [sentinel-hub.com](https://www.sentinel-hub.com/) | Fallback comercial |
| NASA FIRMS | `NASA_FIRMS_MAP_KEY` | [firms.modaps.eosdis.nasa.gov/api/area](https://firms.modaps.eosdis.nasa.gov/api/area/) | Alertas incendio |
| Open-Meteo | `OPEN_METEO_API_KEY` (opcional) | [open-meteo.com](https://open-meteo.com/) | Clima + humedad suelo |
| OpenAI | `OPENAI_API_KEY` | platform.openai.com | Diagnóstico visión |
| Mistral | `MISTRAL_API_KEY`, `VISION_PROVIDER=mistral` | console.mistral.ai | Diagnóstico alternativo |
| Cloudinary | `CLOUDINARY_*`, `STORAGE_PROVIDER` | cloudinary.com | CDN fotos campo |
| Supabase | `NEXT_PUBLIC_SUPABASE_*` | supabase.com | Legacy opcional (modo cloud) |

### Misiones Copernicus en Doctor Soya

- **Sentinel-2 L2A:** NDVI, NDMI, True Color, grilla 32×32 para heatmap
- **Sentinel-1 GRD:** VH/VV, índice humedad radar (proxy suelo)
- **Sentinel-3 SLSTR:** temperatura superficie (LST)

## Supabase (opcional / legacy)

Si prefieres Supabase Cloud en lugar de Postgres Docker, deja vacío `DATABASE_URL` y configura:

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta migraciones en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_policies.sql`
   - `supabase/migrations/003_satellite_real.sql`
   - `supabase/migrations/004_real_data_loop.sql`
   - `supabase/migrations/005_climate_readings.sql`
   - `supabase/migrations/006_science_readings.sql`
3. Crea bucket `observations` (privado) en Storage
4. Copia URL y keys a `.env`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm setup` | Primer arranque: `.env` + Docker + credenciales demo |
| `pnpm docker:infra` | Postgres + MinIO + imprime usuarios demo |
| `pnpm docker:up` | Stack completo (web, worker, redis, caddy) |
| `pnpm docker:down` | Detiene contenedores |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm test` | Tests Vitest |
| `pnpm test:e2e` | Smoke Playwright (requiere `pnpm build` + `pnpm start`) |
| `pnpm verify` | Integraciones (.env + Docker) |
| `pnpm lint` | ESLint |
| `pnpm worker` | Cron worker (VPS) |
| `pnpm worker:queue` | BullMQ + Redis |

## Despliegue VPS

Ver [docs/PRE-DEPLOY-CHECKLIST.md](docs/PRE-DEPLOY-CHECKLIST.md), [docs/DEPLOY-VPS.md](docs/DEPLOY-VPS.md) y demo [docs/DEMO-HACKATHON.md](docs/DEMO-HACKATHON.md).

Stack producción: Docker (`web` + `worker` + `postgres` + `minio` + `caddy` + `redis`).

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
- `/login`, `/register` — auth (Postgres + JWT, o Supabase legacy)

Sin `DATABASE_URL` ni Supabase, la app funciona en modo mock local.
