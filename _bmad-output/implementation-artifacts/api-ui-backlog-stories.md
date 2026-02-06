# API-UI Integration Backlog Stories

**Created:** 2026-02-05
**Context:** During UI migration (Sureel-UI branch), we identified gaps between the production-grade UI components and the existing API responses. These stories bridge that gap.

---

## Story 2.3: Resume Parsed Data Extensions

**Status:** backlog
**Epic:** 2 - Resume Management
**Priority:** HIGH

### Story

**As a** user viewing my parsed resume in the extension sidebar,
**I want** to see highlights, certifications, and projects extracted from my resume,
**So that** the full richness of my resume is available for AI matching and content generation.

### Scope

The UI components (`ResumeCard`) already render these fields. The API's `ParsedResumeData` schema needs to be extended to include them.

### Fields to Add

| Field | UI Type | Current API | Action |
|-------|---------|-------------|--------|
| `experience[].highlights` | `string[]` (bullet points per entry) | Only `description: string` | Add array field, update AI parsing prompt |
| `certifications` | `{ name, issuer, date }[]` | Not in schema | Add new section to parsed data |
| `projects` | `{ name, description, techStack[], url? }[]` | Not in schema | Add new section to parsed data |
| `contact.website` | `string` (URL) | Only `linkedin_url` | Add field to personal info |

### Acceptance Criteria

1. **Given** an uploaded resume with certifications section, **When** AI parses it, **Then** `parsed_data.certifications` contains structured entries
2. **Given** an uploaded resume with project descriptions, **When** AI parses it, **Then** `parsed_data.projects` contains structured entries with tech stack extracted
3. **Given** experience entries with bullet points, **When** AI parses them, **Then** each entry has both `description` (summary) and `highlights` (individual bullets)
4. **Given** a resume with a personal website URL, **When** AI parses it, **Then** `parsed_data.personal_info.website` is populated
5. Existing resumes continue to work (new fields are optional/nullable)
6. Update OpenAPI spec (`specs/openapi.yaml`) with new schema fields

### Technical Notes

- Update AI parsing prompt in `app/services/ai_parsing.py`
- Update `ParsedResumeData` Pydantic model
- Migration: No DB migration needed (parsed_data is JSONB)
- Backward compatible: new fields are optional

---

## Story 3.3: Job Data Schema Enhancements

**Status:** backlog
**Epic:** 3 - Job Scanning & Match Analysis
**Priority:** MEDIUM

### Story

**As a** user viewing scanned job postings,
**I want** to see when the job was posted and the company logo,
**So that** I can quickly assess job freshness and recognize companies.

### Scope

The `JobCard` UI component expects `postedAt` and `logo` fields that don't exist in the API response. Additionally, API fields like `source_url`, `employment_type`, and `status` aren't surfaced in the UI.

### Fields

| Field | Direction | Action |
|-------|-----------|--------|
| `posted_at` | API → UI | Add to job scraping/extraction, surface in API response |
| `logo` | API → UI | Extract company logo URL from job page meta tags, or use clearbit/logo API |
| `source_url` | API → UI | Already in API, add to UI `JobData` type |
| `employment_type` | API → UI | Already in API, add to `JobCard` display |
| `status` | API → UI | Already in API, add to job tracking UI |

### Acceptance Criteria

1. **Given** a scanned job page, **When** a posted date is detected, **Then** `posted_at` is included in the job record
2. **Given** a company name, **When** the job is stored, **Then** the system attempts to resolve a logo URL
3. Job scanning continues to work when `posted_at` or `logo` are not available (optional fields)
4. Update OpenAPI spec with new fields

### Technical Notes

- `posted_at`: Scraping heuristic (look for common date patterns near "posted" text)
- `logo`: Consider clearbit logo API (`https://logo.clearbit.com/{domain}`) as fallback
- DB migration: Add `posted_at` (timestamp, nullable) and `logo_url` (text, nullable) columns to jobs table

---

## Story 6.3: Credit System API-UI Alignment

**Status:** backlog
**Epic:** 6 - Usage & Subscription Management
**Priority:** MEDIUM

### Story

**As a** user viewing my credit balance in the extension,
**I want** the credit display to accurately reflect my usage from a single API endpoint,
**So that** I always see an up-to-date credit count.

### Scope

The UI has two credit components with different prop shapes:
- `CreditBar`: `{ credits: number, maxCredits: number }`
- `CreditBalance`: `{ total: number, used: number }`

These should align to a single API response.

### Acceptance Criteria

1. **Given** an authenticated user, **When** they open the extension, **Then** a single API call returns current credit state
2. Response shape includes: `total_credits`, `used_credits`, `remaining_credits`, `reset_date`
3. `CreditBar` and `CreditBalance` both derive their props from the same API response
4. Credit deductions from AI operations are immediately reflected

### Technical Notes

- Check existing `GET /v1/usage/balance` endpoint shape
- May only need a UI mapper, not API changes
- Consider WebSocket or polling for real-time credit updates during generation

---

## Story 0.7: UI-API Data Mapper Layer

**Status:** backlog
**Epic:** 0 - UI Component Library
**Priority:** HIGH (blocks Extension integration)

### Story

**As a** developer integrating UI components with API responses,
**I want** a data transformation layer that maps API snake_case responses to component camelCase props,
**So that** components receive correctly shaped data without manual mapping in every call site.

### Scope

Create typed mapper functions in `packages/ui/` (or `packages/types/`) that transform API response shapes into component prop shapes.

### Key Mappings

```typescript
// Resume API → ResumeCard props
file_name → fileName
first_name + last_name → fullName
salary_range → salary
linkedin_url → linkedin
start_date / end_date → startDate / endDate
graduation_year → startDate/endDate
institution → school

// Job API → JobCard props
source_url → sourceUrl
employment_type → employmentType
posted_at → postedAt

// Usage API → CreditBar/CreditBalance props
total_credits → total / maxCredits
used_credits → used
remaining_credits → credits
```

### Acceptance Criteria

1. Typed mapper functions exist for: Resume, Job, Credit, Profile API responses
2. Each mapper has unit tests verifying field mapping
3. Mappers handle optional/missing fields gracefully (defaults, not crashes)
4. Types are exported from the package for use by extension and web apps
5. No runtime dependencies (pure functions, tree-shakeable)

### Technical Notes

- Consider `packages/types/` or `packages/ui/src/lib/mappers/`
- Use Zod or plain TypeScript for type safety
- Could auto-generate from OpenAPI spec if tooling exists
