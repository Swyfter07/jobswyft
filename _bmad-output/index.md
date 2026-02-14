# BMAD Output Index

This directory contains all planning and implementation artifacts for the Jobswyft project.

## Planning Artifacts

- **[architecture/](./planning-artifacts/architecture/index.md)** - Technical architecture decisions and stack choices (sharded)
- **[epics/](./planning-artifacts/epics/)** - Epic and story breakdown (8 epics, 24 stories)
- **[prd/](./planning-artifacts/prd/index.md)** - Complete product requirements document (sharded)
- **[ux-design-specification.md](./planning-artifacts/ux-design-specification.md)** - UX design specification

## Implementation Artifacts

### Sprint Tracking

- **[sprint-status.yaml](./implementation-artifacts/sprint-status.yaml)** - Current sprint status and story progress

### Epic 1: User Authentication & Account Foundation

- **[1-1-project-foundation-auth-system.md](./implementation-artifacts/1-1-project-foundation-auth-system.md)** - Monorepo setup and Supabase auth configuration
- **[1-2-profile-account-management-api.md](./implementation-artifacts/1-2-profile-account-management-api.md)** - User profile and account deletion endpoints

### Epic 2: Resume Management API

- **[2-1-resume-upload-storage-parsing.md](./implementation-artifacts/2-1-resume-upload-storage-parsing.md)** - Resume upload with AI-powered parsing
- **[2-2-resume-crud-active-selection.md](./implementation-artifacts/2-2-resume-crud-active-selection.md)** - Resume list, view, delete, and active selection

### Epic 3: Job Management & Matching API

- **[3-1-job-data-storage-api.md](./implementation-artifacts/3-1-job-data-storage-api.md)** - Job scanning and storage endpoints
- **[3-2-ai-match-analysis-endpoint.md](./implementation-artifacts/3-2-ai-match-analysis-endpoint.md)** - AI resume-job match scoring

### Epic 4: AI Content Generation API

- **[4-1-cover-letter-generation-api.md](./implementation-artifacts/4-1-cover-letter-generation-api.md)** - Tailored cover letter generation
- **[4-2-answer-outreach-generation-api.md](./implementation-artifacts/4-2-answer-outreach-generation-api.md)** - Application answers and recruiter outreach

### Epic 5: Application Support API

- **[5-1-autofill-data-api.md](./implementation-artifacts/5-1-autofill-data-api.md)** - Autofill data retrieval for forms
- **[5-2-job-tracking-notes-api.md](./implementation-artifacts/5-2-job-tracking-notes-api.md)** - Job application tracking and notes

### Epic 6: Usage & Subscription API

- **[6-1-usage-tracking-balance-api.md](./implementation-artifacts/6-1-usage-tracking-balance-api.md)** - AI credit balance and usage tracking
- **[6-1-usage-tracking-balance-api-validation.md](./implementation-artifacts/6-1-usage-tracking-balance-api-validation.md)** - Usage API endpoint validation report
- **[6-2-subscription-billing-api-mocked.md](./implementation-artifacts/6-2-subscription-billing-api-mocked.md)** - Subscription checkout and billing (mocked)

### Epic 7: Privacy & Feedback API

- **[7-1-privacy-data-deletion-api.md](./implementation-artifacts/7-1-privacy-data-deletion-api.md)** - Data summary and deletion with email confirmation
- **[7-2-feedback-api.md](./implementation-artifacts/7-2-feedback-api.md)** - User feedback submission endpoint
