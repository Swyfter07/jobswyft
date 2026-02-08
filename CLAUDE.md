# Jobswyft - AI Agent Instructions

## Project Overview

Jobswyft is an AI-powered job application assistant with three surfaces:

- **API** (`apps/api/`) - FastAPI backend (Python/uv)
- **Web** (`apps/web/`) - Next.js dashboard (TypeScript)
- **Extension** (`apps/extension/`) - WXT Chrome extension (TypeScript)

## Critical: MCP Tool Usage

**READ FIRST:** `docs/project-context.md` contains comprehensive MCP usage guide.

### Mandatory MCP Usage

| Operation                | Required MCP     |
| ------------------------ | ---------------- |
| Code exploration/editing | **Serena**       |
| Database operations      | **Supabase MCP** |
| Technical research       | **Tavily**       |
| Container management     | **Docker MCP**   |

### Quick Decision Tree

```
Need to understand code? → Serena (get_symbols_overview, find_symbol)
Need to edit a function? → Serena (replace_symbol_body)
Need to check DB schema? → Supabase MCP (list_tables)
Need to run migration?   → Supabase MCP (apply_migration)
Need latest docs/info?   → Tavily (tavily-search)
Need to debug container? → Docker MCP (logs)
```

## Project Structure

```
jobswyft/
├── apps/
│   ├── api/           # FastAPI - Python 3.11+, uv
│   ├── web/           # Next.js 14+ - TypeScript
│   └── extension/     # WXT - TypeScript
├── packages/
│   └── ui/            # React component library + Storybook (tokens in globals.css)
├── specs/openapi.yaml # API contract (source of truth)
├── supabase/migrations/
├── docs/project-context.md  # MCP usage guide
└── _bmad-output/      # Planning & implementation artifacts
```

## Architecture Patterns

### API Response Envelope

```python
# Success
{"success": True, "data": {...}}

# Error
{"success": False, "error": {"code": "ERROR_CODE", "message": "..."}}
```

### Error Codes

| Code                   | HTTP | When              |
| ---------------------- | ---- | ----------------- |
| `AUTH_REQUIRED`        | 401  | No token          |
| `INVALID_TOKEN`        | 401  | Bad/expired token |
| `CREDIT_EXHAUSTED`     | 422  | No AI credits     |
| `RESUME_LIMIT_REACHED` | 422  | Max 5 resumes     |
| `VALIDATION_ERROR`     | 400  | Invalid input     |

### Naming Conventions

| Layer        | Convention       |
| ------------ | ---------------- |
| Database     | `snake_case`     |
| API JSON     | `snake_case`     |
| TypeScript   | `camelCase`      |
| Python files | `snake_case.py`  |
| TS files     | `kebab-case.tsx` |

## Development Commands

```bash
# API
cd apps/api && uvicorn app.main:app --reload --port 3001
cd apps/api && pytest

# Supabase Local (Docker)
supabase db reset          # Apply migrations (local)
supabase gen types typescript --local > packages/types/src/database.ts

# Monorepo
pnpm install               # Install all deps
```

## UI Package & Storybook

```bash
# From packages/ui/ directory:
pnpm storybook             # Start Storybook → http://localhost:6006
pnpm build                 # Build component library
pnpm test                  # Run Vitest tests

```

| Package        | Purpose                                    | Key Exports                                        |
| -------------- | ------------------------------------------ | -------------------------------------------------- |
| `@jobswyft/ui` | React components, utilities, design tokens | `cn()`, `ThemeProvider`, `useTheme`, `globals.css` |

**Storybook Features:**

- Theme toggle: Dark/Light (toolbar dropdown)
- Viewports: Mobile (375×667), Tablet (768×1024), Desktop (1440×900), Extension Popup (400×600)
- Autodocs enabled for `@storybook/autodocs` tag

**Component Pattern:**

```
src/components/custom/
├── job-card.tsx           # Component with Tailwind + semantic tokens
├── job-card.stories.tsx   # Storybook stories
```

**Styling Priority:** Semantic CSS tokens (`globals.css`) → Tailwind utilities (no CSS Modules)

## Supabase CLI - Remote Database Management

**CRITICAL:** Use Supabase CLI for remote database migrations instead of manual Dashboard SQL execution. Faster, trackable, version-controlled.

### Initial Setup (One-Time)

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase  # macOS
# or: npm install -g supabase

# Verify installation
supabase --version  # Should show 2.x.x+

# Link project to remote Supabase instance
cd /path/to/project-root
supabase link --project-ref <PROJECT_REF>
# Example: supabase link --project-ref qhzsfsaexnlvzmossffs

# When prompted for password, use SUPABASE_SERVICE_ROLE_KEY from .env
```

**Finding PROJECT_REF:**

- Check `.temp/project-ref` in `supabase/` directory
- Or extract from `SUPABASE_URL`: `https://<PROJECT_REF>.supabase.co`
- Example: `qhzsfsaexnlvzmossffs` from `https://qhzsfsaexnlvzmossffs.supabase.co`

### Migration Workflow

```bash
# 1. Check migration status (local vs remote)
supabase migration list --linked

# 2. Apply new migrations to remote database
supabase db push --linked

# 3. If migration is numbered before existing remote migrations
supabase db push --linked --include-all

# 4. Verify migration applied
supabase migration list --linked
# Check: Local and Remote columns should match
```

### Common Scenarios

| Scenario                              | Command                                   | When                                         |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| New migration (numbered correctly)    | `supabase db push --linked`               | Migration number > all remote migrations     |
| Backfill migration (numbered earlier) | `supabase db push --linked --include-all` | Migration number < latest remote migration   |
| Check status                          | `supabase migration list --linked`        | Before/after applying migrations             |
| View linked project                   | `supabase projects list`                  | Verify which project is linked (● indicator) |

### Troubleshooting

**Issue:** `column does not exist` after code changes

- **Cause:** Migration not applied to remote database
- **Fix:** Run `supabase db push --linked --include-all`

**Issue:** `Cannot connect to Docker daemon`

- **Cause:** Command trying to use local Docker (not needed for remote)
- **Fix:** Add `--linked` flag to commands (e.g., `migration list --linked`)

**Issue:** Migration fails with immutability error (e.g., `NOW()` in index)

- **Cause:** PostgreSQL doesn't allow non-immutable functions in certain contexts
- **Fix:** Update migration SQL to remove/replace non-immutable functions

**Issue:** `WARN: environment variable is unset: GOOGLE_CLIENT_SECRET`

- **Cause:** Optional OAuth env var not set (harmless warning)
- **Fix:** Ignore warning or set dummy value in `.env`

### Migration Best Practices

1. **Always link before pushing:**

   ```bash
   supabase link --project-ref <REF>  # One-time setup
   supabase db push --linked          # Then push
   ```

2. **Verify before and after:**

   ```bash
   supabase migration list --linked   # Check before
   supabase db push --linked          # Apply
   supabase migration list --linked   # Verify after
   ```

3. **Test migration SQL locally first:**
   - Run migration on local Docker instance if available
   - Or verify SQL syntax in Dashboard SQL Editor first

4. **Use `--include-all` for out-of-order migrations:**
   - When backfilling migrations numbered before remote migrations
   - Example: Adding `00006` when remote has `20260131213733`

### Quick Reference

```bash
# Complete workflow for new migration
cd /path/to/project-root
supabase migration list --linked              # Check current state
supabase db push --linked --include-all       # Apply migration
supabase migration list --linked              # Verify applied

# Verify via API
source apps/api/.env
curl -s "${SUPABASE_URL}/rest/v1/<table>?select=<new_column>&limit=1" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
```

**Migration Numbering:**

- Format: `NNNNN_description.sql` (e.g., `00006_add_deletion_token_fields.sql`)
- Sequential: `00001`, `00002`, `00003`, etc.
- Timestamp format also valid: `20260131213733_description.sql`
- Place in: `supabase/migrations/`

## Local Auth Token for API Testing

Generate a valid JWT for manual API testing using Supabase Admin API:

```bash
cd apps/api && source .env

# Step 1: Generate magic link + OTP for existing user
curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/generate_link" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"type":"magiclink","email":"USER_EMAIL"}'
# Returns: {"email_otp":"123456",...}

# Step 2: Exchange OTP for access token
curl -s -X POST "${SUPABASE_URL}/auth/v1/verify" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"USER_EMAIL","token":"OTP_FROM_STEP1","type":"magiclink"}'
# Returns: {"access_token":"eyJ...","expires_in":3600,...}

# Step 3: Use token (valid 1 hour)
curl -H "Authorization: Bearer ACCESS_TOKEN" http://localhost:3001/v1/auth/me
```

**Quick one-liner** (if you have `jq`):

```bash
OTP=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/generate_link" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d '{"type":"magiclink","email":"USER_EMAIL"}' | jq -r '.email_otp') && curl -s -X POST "${SUPABASE_URL}/auth/v1/verify" -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\"email\":\"USER_EMAIL\",\"token\":\"$OTP\",\"type\":\"magiclink\"}" | jq -r '.access_token'
```

## Implementation Workflow

1. Check `_bmad-output/implementation-artifacts/sprint-status.yaml` for current story
2. Read story file for comprehensive context
3. Use Serena to explore relevant code
4. Implement following architecture patterns
5. Run tests: `pytest` for API
6. Update story status when complete

## Key Files Reference

| Need              | File                                                       |
| ----------------- | ---------------------------------------------------------- |
| Full architecture | `_bmad-output/planning-artifacts/architecture.md`          |
| All requirements  | `_bmad-output/planning-artifacts/prd.md`                   |
| Epics & stories   | `_bmad-output/planning-artifacts/epics.md`                 |
| Sprint status     | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| API contract      | `specs/openapi.yaml`                                       |
| MCP guide         | `docs/project-context.md`                                  |

## Troubleshooting - CSS & Styling

### CSS Theme Disappearing in Extension

**Symptom:**
The extension loads but shows unstyled HTML elements with no theme colors or Tailwind utilities applied.

**Root Cause:**

1.  **HMR Desynchronization:** The development build (`npm run dev` / `wxt`) can lose sync with styling dependencies after significant file changes or repaving.
2.  **Missing Global Import:** `apps/extension/src/styles/app.css` MUST have explicit Tailwind initialization:
    ```css
    @import "tailwindcss";
    @import "@jobswyft/ui/styles";
    @source "../../../../packages/ui/src";
    ```

**Resolution:**

1.  **Stop the development server.**
2.  **Run a full build** to force asset regeneration:
    ```bash
    cd apps/extension
    npm run build
    ```
3.  **Restart development server:**
    ```bash
    npm run dev
    ```

**Prevention:**

- Always ensure `@import "tailwindcss";` is at the very top of `apps/extension/src/styles/app.css`.
- If CSS seems "stuck" or "broken" after refactoring, trust the full build over the dev server's HMR state.
