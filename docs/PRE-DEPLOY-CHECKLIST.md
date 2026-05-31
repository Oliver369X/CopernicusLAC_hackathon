# Checklist pre-deploy

Ejecutar antes de subir a VPS o demo del hackathon.

## Automatizado (local / CI)

```bash
pnpm install
pnpm test          # unit + rutas protegidas
pnpm lint
pnpm build
pnpm verify        # CDSE, Postgres (requiere .env + docker)
pnpm cron:once     # datos satélite (requiere CDSE + DB)
pnpm test:e2e      # smoke Playwright (requiere build + start)
```

## Manual (375px y 1280px)

Ver [DEMO-HACKATHON.md](./DEMO-HACKATHON.md):

- `/login` → dashboard
- `/monitor`, `/field`, `/alerts`, `/science/soybean`, `/insights`
- `/api/health`

## Producción

- [ ] `AUTH_SECRET`, `CRON_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` configurados
- [ ] `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false`
- [ ] Cron `job=all` tras deploy
- [ ] [DEPLOY-VPS.md](./DEPLOY-VPS.md)

## Merge

- PR `branch_adrian7` → `main` con capturas móvil/desktop (ver PART-05)
