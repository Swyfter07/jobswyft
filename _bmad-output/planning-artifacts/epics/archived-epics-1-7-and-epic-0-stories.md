# Archived: Epics 1-7 & Epic 0 Stories (0.2-0.6)

> **Recovered from git history.** These domain-oriented backend stories and UI component stories
> were removed in commit `2d8bd12` (2026-02-06) when the epics were rewritten to use
> surface-oriented vertical slices (Epic EXT, Epic API, Epic WEB, Epic POST-MVP).
>
> **Source commits:**
> - Epics 1-7 full stories: `72df0fa` (original), reduced to summaries in `9d93a7b`, removed in `2d8bd12`
> - Epic 0 stories 0.2-0.6: `9d93a7b`, removed in `2d8bd12`
>
> **Why this exists:** The current EXT/API stories cover the same FRs but with thinner backend
> acceptance criteria. Use this file as a reference when writing detailed backend stories for
> Epic WEB or standalone API work.
>
> **FR numbering caveat:** These stories use OLD FR numbers. The current PRD renumbered many FRs.
> See `requirements-inventory.md` FR Coverage Map for current numbering.

---

# Part 1: Epics 1-7 (Backend-Focused Stories)

## Epic 1: User Authentication & Account Foundation API

### Story 1.1: Project Foundation & Auth System

**As a** developer,
**I want** a fully initialized monorepo with Supabase authentication configured,
**So that** users can sign in with Google OAuth and maintain authenticated sessions across the application.

**FRs Covered:** FR1, FR2, FR3, FR4

**Acceptance Criteria:**

**Given** a fresh development environment
**When** the developer clones the repository and runs setup commands
**Then** the monorepo structure exists with:
- `apps/api/` - FastAPI backend (Python, uv)
- `apps/web/` - Next.js dashboard (TypeScript, placeholder only)
- `apps/extension/` - WXT extension (TypeScript, placeholder only)
- `packages/types/` - Shared TypeScript types
- `specs/openapi.yaml` - API contract stub
- `supabase/migrations/` - Database migrations folder
**And** pnpm workspaces are configured at root level

**Given** a Supabase project is created (manual step)
**When** the developer runs database migrations
**Then** the `profiles` table exists with columns:
- `id` (UUID, PK, references auth.users)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `subscription_tier` (TEXT, DEFAULT 'free')
- `subscription_status` (TEXT, DEFAULT 'active')
- `active_resume_id` (UUID, nullable)
- `preferred_ai_provider` (TEXT, DEFAULT 'claude')
- `stripe_customer_id` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMPTZ)
**And** RLS policies enforce users can only access their own profile

**Given** the FastAPI server is running
**When** a request is made to `POST /v1/auth/login`
**Then** the response returns a Supabase OAuth URL for Google sign-in
**And** the response includes proper CORS headers

**Given** a user completes Google OAuth consent
**When** Supabase redirects to `POST /v1/auth/callback` with auth code
**Then** the system exchanges the code for tokens
**And** creates a profile record if first-time user
**And** returns session tokens (access_token, refresh_token)
**And** response follows envelope format `{ "success": true, "data": { ... } }`

**Given** an authenticated user with valid session
**When** a request is made to `POST /v1/auth/logout`
**Then** the session is invalidated on Supabase
**And** response confirms logout success

**Given** an authenticated user
**When** subsequent API requests include the access token
**Then** the session persists across requests (FR4)
**And** expired tokens return `401` with error code `INVALID_TOKEN`

**Given** an unauthenticated request to a protected endpoint
**When** the request lacks a valid token
**Then** response returns `401` with error code `AUTH_REQUIRED`

**Technical Notes:**
- Developer must create Supabase project and configure Google OAuth provider
- Environment variables needed: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
- FastAPI uses Supabase Python SDK for auth operations
- All responses follow envelope pattern from Architecture doc

---

### Story 1.2: Profile & Account Management API

**As a** user,
**I want** to view my profile information and delete my account if needed,
**So that** I can manage my personal data and exercise my right to deletion.

**FRs Covered:** FR5, FR6

**Acceptance Criteria:**

**Given** an authenticated user
**When** a request is made to `GET /v1/auth/me`
**Then** the response returns the user's profile:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "subscription_tier": "free",
    "subscription_status": "active",
    "active_resume_id": null,
    "preferred_ai_provider": "claude",
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```
**And** sensitive fields (stripe_customer_id) are excluded from response

**Given** an authenticated user
**When** a request is made to `DELETE /v1/auth/account`
**Then** the system deletes all user data:
- Profile record
- All resumes (records + storage files) - via CASCADE
- All jobs - via CASCADE
- All usage_events - via CASCADE
- All feedback - via SET NULL
**And** the Supabase auth user is deleted
**And** response confirms deletion success
**And** the operation is logged for audit

**Given** an unauthenticated request
**When** attempting to access profile or delete account
**Then** response returns `401` with error code `AUTH_REQUIRED`

**Technical Notes:**
- Account deletion is immediate (email confirmation is in Epic 7 for privacy flow)
- CASCADE delete handled by foreign key constraints
- Logging uses structured format per NFR42-44

---

## Epic 2: Resume Management API

### Story 2.1: Resume Upload, Storage & AI Parsing

**As a** user,
**I want** to upload my resume and have it parsed using AI,
**So that** my resume data is accurately extracted and available for AI-powered job matching and content generation.

**FRs Covered:** FR7, FR8, FR9

**Acceptance Criteria:**

**Given** an authenticated user with fewer than 5 resumes
**When** a request is made to `POST /v1/resumes` with a PDF file
**Then** the system:
- Validates file is PDF format and under 10MB
- Uploads file to Supabase Storage bucket `resumes/{user_id}/{uuid}.pdf`
- Uses AI (Claude/GPT) to parse PDF and extract structured data (first_name, last_name, contact, experience, education, skills)
- Creates resume record in database with `parsed_data` JSON
- Returns the created resume with parsed data
**And** response follows envelope format:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_name": "john_doe_resume.pdf",
    "file_path": "resumes/user-uuid/resume-uuid.pdf",
    "parsed_data": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "summary": "...",
      "experience": [...],
      "education": [...],
      "skills": [...]
    },
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```
**And** parsing completes within 10 seconds (NFR6)

**Given** an authenticated user who already has 5 resumes
**When** a request is made to `POST /v1/resumes`
**Then** response returns `422` with error code `RESUME_LIMIT_REACHED`
**And** message: "Maximum 5 resumes allowed. Delete one to upload more."

**Given** a request with non-PDF file
**When** attempting to upload
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message indicates PDF format required

**Given** a request with file exceeding 10MB
**When** attempting to upload
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message indicates file size limit

**Given** the `resumes` table does not exist
**When** migrations are run
**Then** the table is created with columns:
- `id` (UUID, PK)
- `user_id` (UUID, FK -> profiles, ON DELETE CASCADE)
- `file_name` (TEXT, NOT NULL)
- `file_path` (TEXT, NOT NULL)
- `parsed_data` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)
**And** RLS policies enforce user can only access own resumes
**And** Supabase Storage bucket `resumes` is created with RLS

**Technical Notes:**
- Resume parsing uses AI (Claude primary, GPT fallback) to extract structured data
- AI extracts: skills, experience, education, contact information (first_name, last_name, email, phone, location, linkedin_url)
- PDF text extraction (PyPDF2/pdfplumber) provides raw text input to AI
- Parsed data extracts `first_name` and `last_name` separately for autofill compatibility
- Storage path includes user_id for isolation
- Resume parsing counts as 1 AI generation credit

---

### Story 2.2: Resume CRUD & Active Selection

**As a** user,
**I want** to view, manage, and select my active resume,
**So that** I can organize my resumes and choose which one to use for applications.

**FRs Covered:** FR10, FR11, FR12, FR13

**Acceptance Criteria:**

**Given** an authenticated user with uploaded resumes
**When** a request is made to `GET /v1/resumes`
**Then** response returns list of user's resumes:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "file_name": "john_doe_resume.pdf",
        "is_active": true,
        "created_at": "2026-01-30T12:00:00Z"
      }
    ],
    "total": 3
  }
}
```
**And** resumes are sorted by `created_at` descending
**And** `is_active` is a computed field: `resume.id == profile.active_resume_id`

**Given** an authenticated user
**When** a request is made to `GET /v1/resumes/{id}`
**Then** response returns full resume details including `parsed_data`
**And** includes a signed URL for downloading the PDF file

**Given** a request for a resume that doesn't exist or belongs to another user
**When** attempting to access
**Then** response returns `404` with error code `RESUME_NOT_FOUND`

**Given** an authenticated user with multiple resumes
**When** a request is made to `PUT /v1/resumes/{id}/active`
**Then** the specified resume becomes the active resume
**And** `profiles.active_resume_id` is updated
**And** response confirms the change
**And** user can switch between resumes when applying (FR13)

**Given** an authenticated user
**When** a request is made to `DELETE /v1/resumes/{id}`
**Then** the resume record is deleted
**And** the file is deleted from Supabase Storage
**And** if deleted resume was active, `active_resume_id` is set to NULL
**And** response confirms deletion

**Given** attempting to delete another user's resume
**When** the request is made
**Then** response returns `404` with error code `RESUME_NOT_FOUND`
**And** no data is modified (RLS enforcement)

**Technical Notes:**
- Signed URLs for file download should expire after 1 hour
- Active resume selection updates the profiles table
- Delete operation must clean up both DB record and storage file
- `is_active` is computed at query time, not stored

---

## Epic 3: Job Scanning & Match Analysis API

### Story 3.1: Job Data Storage API

**As a** user,
**I want** my scanned job data saved and retrievable,
**So that** I can reference job details and use them for AI-powered features.

**FRs Covered:** FR14, FR15, FR16, FR17, FR18, FR20, FR21, FR22

**Acceptance Criteria:**

**Given** an authenticated user with a scanned job from the extension
**When** a request is made to `POST /v1/jobs/scan` with job data:
```json
{
  "title": "Senior Software Engineer",
  "company": "Acme Corp",
  "description": "We are looking for...",
  "location": "San Francisco, CA",
  "salary_range": "$150k-$200k",
  "employment_type": "Full-time",
  "source_url": "https://acme.com/jobs/123"
}
```
**Then** the job is saved to the database
**And** response returns the created job with ID:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Software Engineer",
    "company": "Acme Corp",
    "description": "We are looking for...",
    "location": "San Francisco, CA",
    "salary_range": "$150k-$200k",
    "employment_type": "Full-time",
    "source_url": "https://acme.com/jobs/123",
    "status": "saved",
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```

**Given** required fields are missing (title, company, description)
**When** attempting to save scanned job
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message indicates which required fields are missing (FR22)

**Given** an authenticated user
**When** a request is made to `GET /v1/jobs/{id}`
**Then** response returns full job details including all extracted fields

**Given** a user needs to correct extracted data (FR20, FR21)
**When** a request is made to `PUT /v1/jobs/{id}` with updated fields
**Then** the job record is updated
**And** response returns the updated job

**Given** the `jobs` table does not exist
**When** migrations are run
**Then** the table is created with columns:
- `id` (UUID, PK)
- `user_id` (UUID, FK -> profiles, ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `company` (TEXT, NOT NULL)
- `description` (TEXT)
- `location` (TEXT, nullable)
- `salary_range` (TEXT, nullable)
- `employment_type` (TEXT, nullable)
- `source_url` (TEXT, nullable)
- `status` (TEXT, DEFAULT 'saved')
- `notes` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMPTZ)
**And** RLS policies enforce user can only access own jobs
**And** index on `(user_id, status)` for filtered queries

**Technical Notes:**
- `status` field supports: saved, applied, interviewing, offered, rejected, accepted
- Application questions are NOT stored (handled client-side, sent directly to AI)
- Extension sends extracted data; API just stores it

---

### Story 3.2: AI Match Analysis Endpoint

**As a** user,
**I want** to see how well my resume matches a job posting,
**So that** I understand my strengths and gaps before applying.

**FRs Covered:** FR23, FR24, FR25

**Acceptance Criteria:**

**Given** an authenticated user with an active resume and a saved job
**When** a request is made to `POST /v1/ai/match`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "ai_provider": "claude"
}
```
**Then** the AI analyzes resume against job requirements
**And** response returns match analysis within 3 seconds (NFR3):
```json
{
  "success": true,
  "data": {
    "match_score": 85,
    "strengths": [
      "5+ years Python experience matches requirement",
      "Previous fintech experience aligns with company domain",
      "Team leadership experience matches senior role expectations"
    ],
    "gaps": [
      "Job requires Kubernetes experience - not mentioned in resume",
      "Preferred AWS certification not present"
    ],
    "recommendations": [
      "Highlight your Docker experience as transferable to Kubernetes",
      "Mention any cloud platform experience in cover letter"
    ],
    "ai_provider_used": "claude"
  }
}
```
**And** AI output is NOT stored on the server (FR36, NFR14)

**Given** `ai_provider` is specified in request
**When** generating match analysis
**Then** use the specified provider (override)

**Given** `ai_provider` is NOT specified
**When** generating match analysis
**Then** use `profiles.preferred_ai_provider` if set, else default to Claude

**Given** the primary AI provider fails
**When** the match request is made
**Then** the system falls back to secondary provider
**And** response still succeeds (NFR31)
**And** failure is logged

**Given** both AI providers fail
**When** the match request is made
**Then** response returns `503` with error code `AI_PROVIDER_UNAVAILABLE`
**And** user's usage balance is NOT decremented (NFR24)

**Given** user has no active resume and no `resume_id` provided
**When** requesting match analysis
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message: "No resume selected. Upload or select a resume first."

**Given** the AI provider architecture does not exist
**When** this story is implemented
**Then** create `services/ai/` with:
- `provider.py` - Abstract interface + provider selection logic
- `claude.py` - Claude/Anthropic implementation
- `openai.py` - GPT/OpenAI implementation
- `prompts.py` - Prompt templates for match analysis
**And** provider selection follows: request override -> profile preference -> default (Claude)
**And** fallback logic triggers on 500 errors or timeouts

**Technical Notes:**
- Match analysis uses resume's `parsed_data` + job's `description`
- Claude 3.5 Sonnet is primary; GPT-4o-mini is fallback
- Environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- Prompt template should extract structured strengths/gaps/recommendations

---

## Epic 4: AI Content Generation API

### Story 4.1: Cover Letter Generation API

**As a** user,
**I want** to generate tailored cover letters with my preferred tone and custom instructions,
**So that** I can quickly create personalized cover letters that sound like me.

**FRs Covered:** FR26, FR27, FR28, FR29, FR30

**Acceptance Criteria:**

**Given** an authenticated user with an active resume and a saved job
**When** a request is made to `POST /v1/ai/cover-letter`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "tone": "confident",
  "custom_instructions": "Mention my open-source contributions",
  "ai_provider": "claude"
}
```
**Then** the AI generates a tailored cover letter within 5 seconds (NFR2)
**And** response returns the generated content:
```json
{
  "success": true,
  "data": {
    "content": "Dear Hiring Manager,\n\nI am writing to express my strong interest in...",
    "ai_provider_used": "claude",
    "tokens_used": 1250
  }
}
```
**And** the content is NOT stored on the server (FR36, NFR14)
**And** user's usage balance is decremented by 1

**Given** valid tone options
**When** generating cover letter
**Then** supported tones are: `confident`, `friendly`, `enthusiastic`, `professional`, `executive`
**And** tone influences the writing style appropriately

**Given** a user wants to regenerate with feedback (FR29)
**When** a request is made to `POST /v1/ai/cover-letter` with `feedback`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "tone": "confident",
  "feedback": "Make it shorter and mention my AWS certification",
  "previous_content": "Dear Hiring Manager..."
}
```
**Then** the AI generates a new version incorporating the feedback
**And** this counts as a new generation (decrements usage)

**Given** a user wants to export as PDF (FR30)
**When** a request is made to `POST /v1/ai/cover-letter/pdf`:
```json
{
  "content": "Dear Hiring Manager,\n\nI am writing to express...",
  "file_name": "cover_letter_acme_corp"
}
```
**Then** response returns a PDF file download
**And** PDF is formatted professionally (proper margins, font)
**And** PDF generation does NOT count against usage balance

**Given** AI provider fails
**When** generation is attempted
**Then** system falls back to alternate provider
**And** if both fail, returns `503` with `AI_PROVIDER_UNAVAILABLE`
**And** usage balance is NOT decremented (NFR24)

**Given** user has zero usage balance
**When** attempting to generate
**Then** response returns `422` with error code `CREDIT_EXHAUSTED`
**And** message: "You've used all your credits. Upgrade to continue."

**Technical Notes:**
- Prompt template uses: job description + parsed resume + tone + custom instructions
- PDF generation can use `reportlab` or `weasyprint` library
- Cover letter is the most token-intensive operation
- AI provider resolution: request override -> profile preference -> Claude (default)

---

### Story 4.2: Answer & Outreach Generation API

**As a** user,
**I want** to generate answers to application questions and recruiter outreach messages,
**So that** I can complete applications faster and reach out to hiring teams professionally.

**FRs Covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

**Acceptance Criteria:**

**Given** an authenticated user with an active resume and a job context
**When** a request is made to `POST /v1/ai/answer`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "question": "Why do you want to work at Acme Corp?",
  "max_length": 500,
  "ai_provider": "claude"
}
```
**Then** the AI generates a tailored answer within 5 seconds
**And** response returns:
```json
{
  "success": true,
  "data": {
    "content": "I'm drawn to Acme Corp's mission to...",
    "ai_provider_used": "claude",
    "tokens_used": 450
  }
}
```
**And** content is NOT stored on server (FR36)
**And** usage balance is decremented by 1

**Given** a user wants to regenerate answer with feedback (FR32)
**When** request includes `feedback` and `previous_content`
**Then** AI generates improved version based on feedback

**Given** an authenticated user wants to reach out to a recruiter/hiring manager
**When** a request is made to `POST /v1/ai/outreach`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "recipient_type": "recruiter",
  "recipient_name": "Sarah Chen",
  "platform": "linkedin",
  "ai_provider": "gpt"
}
```
**Then** the AI generates an outreach message within 5 seconds
**And** response returns:
```json
{
  "success": true,
  "data": {
    "content": "Hi Sarah,\n\nI came across the Senior Engineer role at Acme Corp...",
    "ai_provider_used": "gpt",
    "tokens_used": 380
  }
}
```

**Given** `recipient_name` is provided
**When** generating outreach message
**Then** message includes personalized greeting: "Hi {name},"

**Given** `recipient_name` is NOT provided
**When** generating outreach message
**Then** message starts directly with the opening statement (no greeting)
**And** NO placeholder text like "[Name]" or "Hi there" appears
**And** message is immediately copy-paste ready

**Given** valid recipient types
**When** generating outreach
**Then** supported types are: `recruiter`, `hiring_manager`, `referral`
**And** message style adapts to recipient type

**Given** valid platforms
**When** generating outreach
**Then** supported platforms are: `linkedin`, `email`, `twitter`
**And** message length/format adapts to platform constraints

**Given** a user wants to regenerate outreach with feedback (FR34)
**When** request includes `feedback` and `previous_content`
**Then** AI generates improved version based on feedback

**Given** all AI generation endpoints
**When** content is returned
**Then** user can edit content client-side before using (FR35)
**And** user can copy to clipboard client-side (FR37, FR38 - frontend responsibility)
**And** server NEVER persists generated content (FR36, FR77)

**Given** AI provider fails for any endpoint
**When** generation is attempted
**Then** fallback logic applies (same as Story 4.1)
**And** usage not decremented on complete failure

**Technical Notes:**
- Answer generation prompt: job context + resume + question + length constraint
- Outreach prompt: job + resume + recipient type + platform constraints
- LinkedIn messages should be <300 chars for connection requests
- All endpoints share the same AI provider resolution logic

---

## Epic 5: Application & Job Tracking API

### Story 5.1: Autofill Data API

**As a** user,
**I want** my profile and resume data available for autofilling application forms,
**So that** I can quickly populate forms without manual data entry.

**FRs Covered:** FR39, FR40, FR41, FR42, FR43, FR44

**Acceptance Criteria:**

**Given** an authenticated user with an active resume
**When** a request is made to `GET /v1/autofill/data`
**Then** response returns all data needed for form autofill within 1 second (NFR4):
```json
{
  "success": true,
  "data": {
    "personal": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "portfolio_url": "https://johndoe.dev"
    },
    "resume": {
      "id": "uuid",
      "file_name": "john_doe_resume.pdf",
      "download_url": "https://supabase.../signed-url",
      "parsed_summary": "Senior software engineer with 8 years..."
    },
    "work_authorization": null,
    "salary_expectation": null
  }
}
```
**And** `personal` data is extracted from `resume.parsed_data`
**And** `full_name` is computed from `first_name` + `last_name`
**And** `download_url` is a signed URL for resume file upload (FR43)

**Given** an authenticated user with NO active resume
**When** a request is made to `GET /v1/autofill/data`
**Then** response returns profile data with `resume: null`:
```json
{
  "success": true,
  "data": {
    "personal": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "resume": null
  }
}
```
**And** extension can still autofill basic fields from profile

**Given** the extension receives autofill data
**When** user triggers autofill
**Then** extension handles (client-side):
- Field mapping to form inputs (FR40)
- Highlighting filled fields (FR41)
- Undo capability (FR42)
- Resume file upload (FR43)
- Cover letter paste if available (FR44)

**Technical Notes:**
- Signed URL for resume expires in 1 hour
- Personal data fields may be incomplete depending on resume parsing quality
- Extension caches autofill data locally for offline use
- `first_name`, `last_name`, `full_name` all provided for different form field types

---

### Story 5.2: Job Tracking & Notes API

**As a** user,
**I want** to track my job applications and add notes,
**So that** I can manage my job search progress effectively.

**FRs Covered:** FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53

**Acceptance Criteria:**

**Given** an authenticated user has scanned a job and wants to save it as applied (FR45, FR46)
**When** a request is made to `POST /v1/jobs`:
```json
{
  "title": "Senior Software Engineer",
  "company": "Acme Corp",
  "description": "We are looking for...",
  "source_url": "https://acme.com/jobs/123",
  "status": "applied"
}
```
**Then** job is saved with status "applied"
**And** response returns the created job

**Given** an authenticated user (FR47)
**When** a request is made to `GET /v1/jobs`
**Then** response returns paginated list of tracked jobs:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Senior Software Engineer",
        "company": "Acme Corp",
        "status": "applied",
        "notes_preview": "Recruiter mentioned...",
        "created_at": "2026-01-30T12:00:00Z",
        "updated_at": "2026-01-30T14:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 20
  }
}
```
**And** supports query params: `?status=applied&page=1&page_size=20&sort=updated_at`
**And** `notes_preview` shows first 100 chars of notes (if any)

**Given** an authenticated user wants to update job status (FR48)
**When** a request is made to `PUT /v1/jobs/{id}/status`:
```json
{
  "status": "interviewing"
}
```
**Then** job status is updated
**And** `updated_at` timestamp is refreshed
**And** valid statuses are: `saved`, `applied`, `interviewing`, `offered`, `rejected`, `accepted`

**Given** an authenticated user wants to view job details (FR49)
**When** a request is made to `GET /v1/jobs/{id}`
**Then** response returns full job details including notes

**Given** an authenticated user wants to delete a job (FR50)
**When** a request is made to `DELETE /v1/jobs/{id}`
**Then** job is permanently deleted
**And** response confirms deletion

**Given** an authenticated user wants to add notes (FR51)
**When** a request is made to `PUT /v1/jobs/{id}/notes`:
```json
{
  "notes": "Recruiter mentioned team is scaling. Follow up next week."
}
```
**Then** notes are saved to the job record
**And** `updated_at` is refreshed

**Given** an authenticated user wants to edit notes (FR52)
**When** a request is made to `PUT /v1/jobs/{id}/notes` with updated content
**Then** notes are replaced with new content

**Given** an authenticated user views a job (FR53)
**When** a request is made to `GET /v1/jobs/{id}`
**Then** response includes full `notes` field

**Given** attempting to access another user's job
**When** any job operation is attempted
**Then** response returns `404` with `JOB_NOT_FOUND`
**And** RLS prevents data leakage

**Technical Notes:**
- `POST /v1/jobs` consolidates with Epic 3's scan endpoint - both create jobs
- Status workflow: saved -> applied -> interviewing -> offered/rejected -> accepted
- Notes are stored in existing `notes` TEXT column on jobs table

---

## Epic 6: Usage & Subscription Management API

### Story 6.1: Usage Tracking & Balance API

**As a** user,
**I want** to see my AI generation balance and have limits enforced,
**So that** I understand my usage and know when to upgrade.

**FRs Covered:** FR54, FR56, FR59, FR60, FR61

**Acceptance Criteria:**

**Given** the `usage_events` table does not exist
**When** migrations are run
**Then** the table is created:
```sql
usage_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,  -- match, cover_letter, answer, outreach
  ai_provider    TEXT NOT NULL,  -- claude, gpt
  credits_used   INTEGER DEFAULT 1,
  period_type    TEXT NOT NULL,  -- lifetime, monthly
  period_key     TEXT NOT NULL,  -- "lifetime", "2026-01"
  created_at     TIMESTAMPTZ DEFAULT now()
)
```
**And** index on `(user_id, period_type, period_key)` exists
**And** RLS policies enforce user access

**Given** the `global_config` table does not exist
**When** migrations are run
**Then** the table is created and seeded with:
```sql
INSERT INTO global_config (key, value) VALUES
('tier_limits', '{"free": {"type": "lifetime", "amount": 5}, "starter": {"type": "monthly", "amount": 100}, "pro": {"type": "monthly", "amount": 500}, "power": {"type": "monthly", "amount": 2000}}'),
('referral_bonus_credits', '5');
```

**Given** an authenticated user
**When** a request is made to `GET /v1/usage`
**Then** response returns current balance and limits:
```json
{
  "success": true,
  "data": {
    "subscription_tier": "free",
    "period_type": "lifetime",
    "period_key": "lifetime",
    "credits_used": 3,
    "credits_limit": 5,
    "credits_remaining": 2,
    "usage_by_type": {
      "match": 1,
      "cover_letter": 2,
      "answer": 0,
      "outreach": 0
    }
  }
}
```

**Given** a paid user (starter/pro/power)
**When** checking usage
**Then** `period_type` is "monthly" and `period_key` is current month (e.g., "2026-01")
**And** usage resets at the start of each month

**Given** any AI generation succeeds
**When** the operation completes
**Then** a `usage_event` record is created
**And** balance is decremented by 1

**Given** AI generation fails completely (both providers)
**When** the operation fails
**Then** NO `usage_event` is created (NFR24)
**And** balance is NOT decremented

**Given** a user with zero remaining credits (FR60)
**When** attempting any AI generation
**Then** response returns `422` with error code `CREDIT_EXHAUSTED`
**And** message: "You've used all your credits. Upgrade to continue." (FR61)

**Given** a new user signs up (FR56)
**When** their profile is created
**Then** they start with 5 lifetime free generations
**And** `subscription_tier` defaults to "free"

**Given** a user refers someone successfully (FR59)
**When** referral is validated
**Then** referring user receives bonus credits (from `global_config.referral_bonus_credits`)
**And** a usage_event with negative `credits_used` is recorded (credit addition)

**Technical Notes:**
- Usage check middleware runs before all AI endpoints
- Free tier: lifetime limit (never resets)
- Paid tiers: monthly limit (resets on 1st of each month)
- Referral tracking mechanism TBD (could be simple code or link)

---

### Story 6.2: Subscription & Billing API (Mocked)

**As a** user,
**I want** to upgrade my subscription and manage billing,
**So that** I can access more AI generations and manage my payment methods.

**FRs Covered:** FR55, FR57, FR58

**Implementation Note:** All Stripe API calls are **mocked** for MVP. API endpoints and request/response contracts remain unchanged. Real Stripe integration will be added when backend + frontend are complete.

**Acceptance Criteria:**

**Given** an authenticated free user wants to upgrade (FR57)
**When** a request is made to `POST /v1/subscriptions/checkout`:
```json
{
  "tier": "pro",
  "success_url": "https://app.jobswyft.com/account?success=true",
  "cancel_url": "https://app.jobswyft.com/account?canceled=true"
}
```
**Then** response returns checkout URL (mocked):
```json
{
  "success": true,
  "data": {
    "checkout_url": "mock://checkout?tier=pro",
    "mock": true
  }
}
```
**And** user's `subscription_tier` is immediately updated to requested tier
**And** `subscription_status` set to "active"

**Given** valid subscription tiers
**When** creating checkout
**Then** supported tiers are: `starter` ($4.99/mo), `pro` ($9.99/mo), `power` ($19.99/mo)

**Given** an authenticated paid user wants to manage subscription (FR58)
**When** a request is made to `POST /v1/subscriptions/portal`
**Then** response returns portal URL (mocked):
```json
{
  "success": true,
  "data": {
    "portal_url": "mock://portal",
    "mock": true
  }
}
```

**Given** an authenticated user (FR55)
**When** a request is made to `GET /v1/usage` (from Story 6.1)
**Then** response includes subscription info:
```json
{
  "subscription_tier": "pro",
  "subscription_status": "active",
  "current_period_end": "2026-02-28T23:59:59Z"
}
```

**Given** webhook endpoint exists
**When** `POST /v1/webhooks/stripe` is called
**Then** endpoint exists but is not actively used during mock phase

**Given** testing tier changes (dev/test only)
**When** using mock mode
**Then** `POST /v1/subscriptions/checkout` immediately upgrades user
**And** `POST /v1/subscriptions/mock-cancel` can simulate cancellation

**Technical Notes:**
- Create `services/stripe_service.py` with interface
- `MockStripeService` implements interface for MVP
- `RealStripeService` to be implemented later (same interface)
- Toggle via environment variable: `STRIPE_MOCK_MODE=true`
- When `STRIPE_MOCK_MODE=false`, real Stripe calls are made

**Deferred to Post-MVP:**
- Real Stripe Checkout integration
- Real Customer Portal integration
- Webhook signature verification
- Payment failure handling

---

## Epic 7: Privacy, Feedback & Dashboard Support API

### Story 7.1: Privacy & Data Deletion API

**As a** user,
**I want** to understand what data is stored and request complete deletion,
**So that** I can exercise my privacy rights and control my personal information.

**FRs Covered:** FR73, FR74, FR75

**Acceptance Criteria:**

**Given** an authenticated user wants to know what data is stored (FR73)
**When** a request is made to `GET /v1/privacy/data-summary`
**Then** response returns summary of stored data:
```json
{
  "success": true,
  "data": {
    "profile": {
      "stored": true,
      "fields": ["email", "full_name", "subscription_tier", "preferences"],
      "location": "Supabase PostgreSQL (encrypted at rest)"
    },
    "resumes": {
      "count": 3,
      "storage": "Supabase Storage (encrypted)",
      "includes": ["PDF files", "parsed text data"]
    },
    "jobs": {
      "count": 25,
      "storage": "Supabase PostgreSQL"
    },
    "usage_history": {
      "count": 47,
      "storage": "Supabase PostgreSQL",
      "includes": ["operation type", "timestamp", "no content stored"]
    },
    "ai_generated_content": {
      "stored": false,
      "note": "AI outputs are never saved to our servers"
    },
    "data_retention": "Data retained until you delete your account",
    "export_available": false
  }
}
```

**Given** an authenticated user wants to delete their account (FR74)
**When** a request is made to `POST /v1/privacy/delete-request`
**Then** system generates a deletion confirmation token
**And** sends confirmation email to user's email address
**And** response indicates email sent:
```json
{
  "success": true,
  "data": {
    "message": "Confirmation email sent. Please check your inbox.",
    "email_sent_to": "j***@example.com",
    "expires_in": "24 hours"
  }
}
```
**And** token expires after 24 hours

**Given** a user receives the confirmation email (FR75)
**When** they click the confirmation link or submit token to `POST /v1/privacy/confirm-delete`:
```json
{
  "token": "abc123..."
}
```
**Then** system deletes ALL user data:
- Profile record
- All resumes (DB records + storage files)
- All jobs
- All usage_events
- Supabase auth user
**And** response confirms deletion:
```json
{
  "success": true,
  "data": {
    "message": "Your account and all data have been permanently deleted."
  }
}
```
**And** deletion is logged for audit (without PII)

**Given** an invalid or expired token
**When** attempting to confirm deletion
**Then** response returns `400` with error code `INVALID_TOKEN`
**And** message: "Invalid or expired deletion token. Please request again."

**Given** deletion confirmation is pending
**When** user makes other API requests
**Then** account functions normally until deletion is confirmed
**And** user can cancel by simply not confirming

**Technical Notes:**
- Deletion token stored temporarily (Redis or DB with expiry)
- Email sending via Supabase Auth email or external service (Resend, SendGrid)
- For MVP: Can mock email sending, log token to console for testing
- Audit log entry: `{ "event": "account_deleted", "timestamp": "...", "user_id_hash": "..." }`

---

### Story 7.2: Feedback API

**As a** user,
**I want** to submit feedback about the product,
**So that** the team can improve Jobswyft based on my experience.

**FRs Covered:** FR78, FR79, FR80

**Acceptance Criteria:**

**Given** the `feedback` table does not exist
**When** migrations are run
**Then** the table is created:
```sql
feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  category   TEXT,
  context    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
**And** RLS allows users to insert their own feedback
**And** RLS prevents users from reading others' feedback

**Given** an authenticated user wants to submit feedback (FR78)
**When** a request is made to `POST /v1/feedback`:
```json
{
  "content": "The cover letter generation is amazing! Would love to see more tone options.",
  "category": "feature_request",
  "context": {
    "page_url": "https://linkedin.com/jobs/123",
    "feature_used": "cover_letter",
    "browser": "Chrome 120"
  }
}
```
**Then** feedback is saved to database (FR80)
**And** response confirms submission:
```json
{
  "success": true,
  "data": {
    "message": "Thank you for your feedback!",
    "feedback_id": "uuid"
  }
}
```

**Given** feedback submission
**When** context is provided (FR79)
**Then** context is stored as JSONB for analysis
**And** context fields are optional and flexible

**Given** valid feedback categories
**When** submitting feedback
**Then** supported categories are: `bug`, `feature_request`, `general`, `praise`, `complaint`
**And** category is optional (defaults to `general`)

**Given** an unauthenticated user
**When** attempting to submit feedback
**Then** response returns `401` with `AUTH_REQUIRED`
**And** anonymous feedback is not supported (need user context for follow-up)

**Given** feedback content is empty
**When** attempting to submit
**Then** response returns `400` with `VALIDATION_ERROR`

**Technical Notes:**
- `user_id` uses ON DELETE SET NULL to preserve feedback even if user deletes account
- Context is freeform JSONB - extension/dashboard can send any relevant info
- No admin endpoints for reading feedback in MVP (access via Supabase dashboard)

---

# Part 2: Epic 0 Stories 0.2-0.6 (UI Component Stories)

> These detailed per-component stories were superseded by the EXT stories' "Component Inventory"
> sections. However, the acceptance criteria below are more granular and useful as a reference
> for expected component behavior.

## Story 0.2: Display & Feedback Primitives

**As a** developer building Jobswyft surfaces,
**I want** display and feedback primitives (Avatar, Separator, Skeleton, Progress, Toast) installed with comprehensive Storybook stories,
**So that** I can compose user profile displays, visual dividers, loading states, progress indicators, and notification feedback across the Extension and Dashboard.

**Acceptance Criteria:**

**Given** the shadcn CLI is available in `packages/ui`
**When** I run `pnpm dlx shadcn@latest add avatar separator skeleton progress sonner`
**Then** all 5 components are installed to `src/components/ui/`
**And** each component uses the project's OKLCH design tokens and Tailwind v4 styling

**Given** Avatar is installed
**When** I render `<Avatar>` with an image src
**Then** it displays the user's profile image in a circular container
**And** when the image fails to load, it falls back to `<AvatarFallback>` showing initials

_Storybook stories: WithImage, WithFallback, Sizes (sm/md/lg), dark/light_

**Given** Separator is installed
**When** I render `<Separator>`
**Then** it displays a horizontal divider using the `--border` design token
**And** it supports `orientation="vertical"` for vertical dividers

_Storybook stories: Horizontal, Vertical, WithLabel, dark/light_

**Given** Skeleton is installed
**When** I render `<Skeleton className="h-4 w-[200px]">`
**Then** it displays an animated placeholder matching the specified dimensions
**And** it uses the `--muted` design token for the shimmer effect

_Storybook stories: TextLine, CardSkeleton, AvatarSkeleton, ListSkeleton, dark/light_

**Given** Progress is installed
**When** I render `<Progress value={60}>`
**Then** it displays a progress bar filled to 60% using the `--primary` design token
**And** it supports values from 0-100 and an indeterminate state (no value prop)

_Storybook stories: Default (50%), Empty (0%), Complete (100%), Indeterminate, Animated, dark/light_

**Given** Sonner (Toast) is installed
**When** I call `toast("Job saved successfully")` with `<Toaster>` mounted
**Then** a toast notification appears with the message, auto-dismisses after timeout
**And** it supports variants: success, error, info, warning, and action buttons

_Storybook stories: Success, Error, Warning, Info, WithDescription, WithAction, dark/light_

---

## Story 0.3: Form & Overlay Primitives

**As a** developer building Jobswyft surfaces,
**I want** form primitives (Textarea, Label, Tooltip) and overlay/navigation primitives (ScrollArea, Sheet, Popover, Dropdown Menu) installed with comprehensive Storybook stories,
**So that** I can build interactive forms with validation labels, scrollable content areas, slide-out panels, contextual popovers, and action menus across the Extension and Dashboard.

**Components:** Textarea, Label, Tooltip, ScrollArea, Sheet, Popover, Dropdown Menu (7 total)

_Storybook stories per component: Default, variant states, dark/light, all viewports_

---

## Story 0.4: Job & Match Compositions

**As a** developer building the Extension sidebar and Dashboard,
**I want** job-related custom compositions (JobCard, MatchScoreDisplay, ScanIndicator, EmptyState) with comprehensive Storybook stories.

**Key component specs:**

- **JobCard:** States: default, detected (highlighted border + pulse), scanning (skeleton), applied (muted + badge), error (destructive border). Optional inline `matchData` prop renders MatchScoreDisplay.
- **MatchScoreDisplay:** Score % with color coding (green >=70%, yellow 40-69%, red <40%). Strengths (green badges) and gaps (yellow badges) side-by-side. "+N more" collapse for >5 items.
- **ScanIndicator:** States: scanning (animated), success (auto-fade 2s), error (destructive), partial (warning + missing fields list).
- **EmptyState:** Centered icon + title + description + optional action button. Context variants: jobs (Briefcase), resumes (FileText), chat (MessageSquare).

---

## Story 0.5: Resume & AI Studio Compositions

**As a** developer building the Extension sidebar and Dashboard,
**I want** resume and AI studio custom compositions (ResumeCard, ResumeTray, AIToolPanel, ChatInterface, CreditBadge).

**Key component specs:**

- **ResumeCard:** File name, upload date, active indicator. Collapsible parsed data blocks with per-section copy-to-clipboard. Actions: Set Active, Delete (via DropdownMenu).
- **ResumeTray:** Compact bar showing active resume name (truncated). Click opens dropdown of all resumes. Empty state: "Upload Resume" prompt.
- **AIToolPanel:** Tool-specific options (tone/length selectors), custom instructions textarea, generate button with credit cost, output area (editable textarea + copy + regenerate). Tools: cover_letter, outreach, detailed_match.
- **ChatInterface:** ScrollArea message list, suggestion chips (hide after first message), text input + send button, typing indicator, "New Chat" button. User messages right-aligned (primary bg), AI messages left-aligned (muted bg) with copy button.
- **CreditBadge:** "N/M credits" compact format. Warning style at <=1 remaining. Destructive + "No credits" at 0. Free tier "Upgrade coming soon" tooltip. Optional daily auto-match secondary indicator.

---

## Story 0.6: Application & Layout Compositions

**As a** developer building the Extension sidebar and Dashboard,
**I want** application and layout compositions (AutofillPreview, FeedbackForm, Navbar, ExtensionSidebar).

**Key component specs:**

- **AutofillPreview:** Field list with status indicators (pending/filled/skipped). Autofill button (enabled when pending), Undo button (visible when filled).
- **FeedbackForm:** Category radio (Bug/Feature/General), content textarea, screenshot toggle, submit button. Validation: disabled when empty.
- **Navbar:** Logo + nav links (Jobs/Resumes/Account/Privacy) with active state + CreditBadge + Avatar dropdown. Mobile: hamburger -> Sheet.
- **ExtensionSidebar:** 4-state rendering: logged_out (sign-in CTA), non_job_page (ResumeTray + waiting message), job_page (ResumeTray + JobCard + locked AI Studio), application_page (full features). Offline banner support.
