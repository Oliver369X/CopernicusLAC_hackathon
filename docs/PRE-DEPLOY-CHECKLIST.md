# Checklist pre-deploy

Ejecutar antes de subir a VPS o demo del hackathon.

## Automatizado (local / CI)

```bash
pnpm install
pnpm test          # unit + rutas protegidas
pnpm lint
pnpm build
pnpm verify        # CDSE token, grilla process, Postgres (requiere .env + docker)
pnpm verify:pilot  # health + % satélite/narrativas por org (piloto BID)
pnpm dev           # terminal 1
pnpm cron:satellite   # lectura Copernicus del día
pnpm cron:backfill    # historial 90 días
pnpm test:e2e      # smoke Playwright (requiere build + start)
```

## Manual (375px y 1280px)

Ver [DEMO-HACKATHON.md](./DEMO-HACKATHON.md):

- `/login` → dashboard
- `/monitor` (badges Copernicus + grilla S2), `/analytics`, `/science/soybean`
- `/api/health`

## Producción

- [ ] `AUTH_SECRET`, `CRON_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` configurados
- [ ] `COPERNICUS_CLIENT_ID/SECRET` configurados
- [ ] `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false`
- [ ] Cron diario `job=all` (incluye `narrative-batch`) + worker 6h
- [ ] `job=onboarding&orgId=` tras cada import masivo
- [ ] Backups Postgres ([BACKUP-RESTORE.md](./BACKUP-RESTORE.md))
- [ ] Guiones [DEMO-BID-PITCH.md](./DEMO-BID-PITCH.md) y [PILOTO-BID.md](./PILOTO-BID.md)
- [ ] [DEPLOY-VPS.md](./DEPLOY-VPS.md)

## Merge

- PR `branch_adrian7` → `main` con capturas móvil/desktop (ver PART-05)
