# API Contracts — API (Backend)

**Source:** `specs/openapi.yaml` (canonical), `apps/api/app/routers/*`

**Base URL:** `http://localhost:3001` (dev) | `https://api.jobswyft.com` (prod)

**Auth:** Bearer JWT (Supabase access token). Exceptions: `/health`, `/v1/auth/login`, `/v1/auth/callback`.

---

## Endpoints Summary

| Method | Path | Description |
|--------|------|--------------|
| GET | `/health` | Health check |
| POST | `/v1/auth/login` | Initiate OAuth login |
| GET | `/v1/auth/callback` | OAuth callback |
| POST | `/v1/auth/logout` | Logout |
| GET | `/v1/auth/me` | Get current user profile |
| DELETE | `/v1/auth/account` | Delete account |
| POST | `/v1/resumes` | Upload resume |
| GET | `/v1/resumes` | List resumes |
| GET | `/v1/resumes/{id}` | Get resume details |
| PATCH | `/v1/resumes/{id}/parsed-data` | Update parsed data |
| PUT | `/v1/resumes/{id}/active` | Set active resume |
| DELETE | `/v1/resumes/{id}` | Delete resume |
| POST | `/v1/jobs/scan` | Create scanned job |
| POST | `/v1/jobs` | Create job |
| GET | `/v1/jobs` | List jobs |
| GET | `/v1/jobs/{id}` | Get job |
| PUT | `/v1/jobs/{id}` | Update job |
| PUT | `/v1/jobs/{id}/status` | Update job status |
| PUT | `/v1/jobs/{id}/notes` | Update job notes |
| DELETE | `/v1/jobs/{id}` | Delete job |
| POST | `/v1/ai/match` | Match analysis |
| POST | `/v1/ai/cover-letter` | Generate cover letter |
| POST | `/v1/ai/cover-letter/pdf` | Export cover letter PDF |
| POST | `/v1/ai/answer` | Generate answer |
| POST | `/v1/ai/outreach` | Generate outreach |
| POST | `/v1/ai/chat` | Chat message (SSE) |
| POST | `/v1/ai/extract-job` | Extract job from text |
| GET | `/v1/autofill/data` | Get autofill data |
| POST | `/v1/feedback` | Submit feedback |
| GET | `/v1/usage` | Get usage balance |
| GET | `/v1/usage/history` | Get usage history |
| POST | `/v1/subscriptions/checkout` | Create checkout session |
| POST | `/v1/subscriptions/portal` | Create portal session |
| POST | `/v1/subscriptions/mock-cancel` | Mock cancel (dev) |
| GET | `/v1/privacy/data-summary` | Get data summary |
| POST | `/v1/privacy/delete-request` | Request deletion |
| POST | `/v1/privacy/confirm-delete` | Confirm deletion |
| POST | `/v1/privacy/cancel-delete` | Cancel deletion |
| POST | `/v1/webhooks/stripe` | Stripe webhook |

---

## Response Envelope

**Success:** `{"success": true, "data": {...}}`  
**Error:** `{"success": false, "error": {"code": "ERROR_CODE", "message": "..."}}`

**Error codes:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `CREDIT_EXHAUSTED`, `RESUME_LIMIT_REACHED`, `VALIDATION_ERROR`

---

## OpenAPI Spec

Full schema: `specs/openapi.yaml`
