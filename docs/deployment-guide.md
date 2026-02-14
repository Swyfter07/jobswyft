# Deployment Guide

## API (Railway)

**Target:** Railway  
**Docs:** `_bmad-output/implementation-artifacts/8-1-railway-api-deployment.md`

### Build

- **Dockerfile:** `apps/api/Dockerfile` (multi-stage, Python 3.11 + uv + WeasyPrint)
- **Port:** `$PORT` (Railway-provided)

### Deploy

```bash
cd apps/api
railway up
```

### Environment variables (Railway)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- `ENVIRONMENT=production`
- `ALLOWED_ORIGINS=https://jobswyft.vercel.app,chrome-extension://*`
- `STRIPE_MOCK_MODE=true` (MVP)

### Production URL

- `https://jobswyft-production.up.railway.app`

### Health check

```bash
curl https://jobswyft-production.up.railway.app/health
```

---

## Extension

- Build: `pnpm build:extension` → `apps/extension/_output/chrome-mv3/`
- Distribute: Chrome Web Store (zip via `wxt zip`)

---

## Web Dashboard (Planned)

- Target: Vercel (Next.js)
- Not yet implemented
