# Merge `branch_adrian7` → `main`

## Antes del PR

1. Ejecutar [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)
2. Adjuntar capturas móvil (375px) y desktop (1280px) de: dashboard, monitor, field, alerts, science/soybean

## Comandos

```bash
git checkout branch_adrian7
git add -A
git commit -m "Pre-deploy: auth science, parseJsonResponse, E2E smoke, docs"
git push -u origin branch_adrian7
gh pr create --base main --head branch_adrian7 \
  --title "Rediseño UI Copernicus LAC + pre-deploy" \
  --body "## Summary
- Rediseño fases 1-11 (UI Copernicus LAC, app de campo)
- Rutas /science protegidas por middleware
- parseJsonResponse en hooks críticos
- Playwright smoke + CI en branch_adrian7

## Test plan
- [ ] pnpm test && pnpm build
- [ ] pnpm verify con Docker
- [ ] Smoke manual DEMO-HACKATHON.md
"
```

Tras merge, confirmar que el workflow CI en `main` pasa.
