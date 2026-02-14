# Data Models — API (Backend)

**Database:** Supabase (PostgreSQL)  
**Migrations:** `supabase/migrations/`

---

## Tables

### profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | References auth.users |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| subscription_tier | TEXT | free, pro, unlimited |
| subscription_status | TEXT | active, etc. |
| active_resume_id | UUID | FK to resumes |
| preferred_ai_provider | TEXT | claude, openai |
| stripe_customer_id | TEXT | Stripe customer ID |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Users can SELECT/UPDATE own row. Auto-created via trigger on auth.users insert.

---

### resumes

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | auth.users |
| file_name | TEXT | Original filename |
| file_path | TEXT | Storage path |
| parsed_data | JSONB | Parsed resume blocks |
| parse_status | TEXT | pending, completed, failed |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Users can CRUD own resumes. Storage bucket: `resumes` (see migration 00003).

---

### jobs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | profiles |
| title | TEXT | Job title |
| company | TEXT | Company name |
| description | TEXT | Full description |
| location | TEXT | Optional |
| salary_range | TEXT | Optional |
| employment_type | TEXT | Optional |
| source_url | TEXT | Job posting URL |
| status | TEXT | saved, applied, interviewing, offered, rejected, accepted |
| notes | TEXT | User notes |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Users can CRUD own jobs.

---

### usage_events

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | auth.users |
| operation_type | TEXT | resume_parse, match, cover_letter, answer, outreach |
| ai_provider | TEXT | Optional |
| credits_used | INTEGER | Default 1 |
| period_type | TEXT | lifetime, monthly |
| period_key | TEXT | "lifetime" or "YYYY-MM" |
| created_at | TIMESTAMPTZ | |

**RLS:** Users can SELECT own. Inserts via service role only.

---

### global_config

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PK | Config key |
| value | JSONB | Config value |
| description | TEXT | Optional |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** None. Service role only. Seed: `tier_limits` (free, pro, unlimited).

---

### feedback

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | profiles (SET NULL on delete) |
| content | TEXT | 10–5000 chars |
| category | TEXT | bug, feature_request, general, praise, complaint |
| context | JSONB | page_url, feature_used, etc. |
| created_at | TIMESTAMPTZ | |

**RLS:** Users can INSERT/SELECT own.

---

## Storage

- **resumes bucket:** User resume PDFs. Path: `{user_id}/{uuid}.pdf`
