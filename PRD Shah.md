
# JobSwyft — Comprehensive Developer Specification

**Version:** v1  
**Platforms:** Chrome Extension + Web Dashboard  
**Status:** Implementation-ready

---

## 1. Overview

**JobSwyft** is a Chrome extension with an attached web dashboard that enables users to apply to jobs faster without leaving the job posting page. It provides a persistent sidebar with resume management, job scanning, AI-powered tools, and autofill capabilities, while the website is used for job tracking, account management, billing, and privacy controls.

Key principles:
- User-initiated actions 
- Unified sidebar workflow
- Ephemeral AI outputs (privacy-first, no storage)
- Hybrid data model (local + backend)
- Clear freemium + paid tiers with usage limits

---

## 2. User Personas & Goals

### Target Users
- All career stages (students → senior professionals)
- All job types (tech and non-tech)

### Primary Goal
Apply to jobs **faster**, with minimal context switching, directly on the job page.

---

## 3. Platforms & Components

### Chrome Extension (Primary)
- Persistent right-side sidebar
- Resume tray 
- Auto Scan Job Page
- AI Studio
- Autofill Application Form
- Usage balance display

### Web Dashboard (Secondary)
- Job tracking
- Resume management
- Subscription & billing
- Data & privacy controls

---

## 4. Authentication

- Required before any functionality
- **Google OAuth only**
- Auth handled inside sidebar
- One account per browser profile
- Logout clears auth tokens and ephemeral state

---

## 5. Chrome Extension UX & State Model

### Sidebar Invocation
- Triggered via Chrome extension icon
- Slides in from the right
- Pushes Page content (Not Overlay)
- Remains open until user closes or logs out

### Sidebar States
1. **Logged Out**
   - Google Sign-In button

2. **Logged In – Non-Job Page**
   - “No job detected” message
   - Resume tray enabled
   - Dashboard link enabled
   - AI Studio, Autofill disabled

1. **Logged In – Job Page**
   - Resume tray enabled
   - Scan Page automatically, show a card with job details
   - AI Studio locked
   - Autofill disabled

1. **Logged In – Job Application Page**
   - AI Studio unlocked
   - Autofill enabled


---

## 6. Resume Management

### Behavior
- Resume tray at top of sidebar
- Upload via drag & drop or file picker
- Max **5 resumes per user**
- 1 active resume at a time
- Switch via dropdown
- Resumes are **read-only**
- Parsing happens immediately on upload
- Parsed resume blocks cached (no re-parse unless re-uploaded)
- Add an expandable section for Resume Blocks (Shows different parsed section of resume and their content is expandable for quick copy)

### Storage
- Files & parsed blocks stored in backend
- Active resume selection cached locally

---

## 7. Scan Page

### Trigger
- User navigates to a Job Page (Detected through URL)
- If nto automatically detected, User can Select text based on DOM Element Picker

### Extraction Method
- Hybrid: rules + AI

### Required Fields (for success)
- Job title
- Company name
- Full job description text

### Optional Fields
- Location
- Salary
- Employment type
- Application questions

### Outcomes
- **Success:** AI Studio unlocked
- **Failure:** Partial data shown, missing fields flagged

### Failure UX
- Partial data remains visible
- Missing fields indicated
- Element picker icons change color
- AI Studio remains locked

---

## 8. Element Picker

- Circular icon next to each field
- Highlights DOM elements on hover
- Click assigns value to that field
- Works per-field
- Once required fields are filled, AI Studio unlocks

---

## 9. Manual Editing

- All scanned fields are directly editable text inputs
- Manual edits count as valid data
- AI Studio unlocks if required fields are present
- Re-scan overwrites manual edits without confirmation

---

## 10. AI Studio

### Unlock Condition
- Valid scan (required fields present)

### Tools (v1)
1. **Match**
   - Resume ↔ job analysis
   - Strengths, gaps, missing skills

2. **Cover Letter**
   - Tailored to job + resume
   - Tone Selector 
   - Length Selector
   - Custom instructions
   - Give Feedback and Regenerate
   - Export as PDF

3. **Answer**
   - Generate answers to application/interview questions
   - Give Feedback and Regenerate

4. **Outreach**
   - Personalized recruiter/hiring manager messages
   -  Tone Selector 
   - Length Selector
   - Custom instructions
   -  Give Feedback and Regenerate

### Output Rules
- Editable outputs
- Job-specific & resume-specific
- Client-only (no backend storage)
- Regeneration replaces previous output
- Refresh/navigation clears outputs
- Download/export is the only persistence

---

## 11. AI Usage, Plans & Gating

### Usage Definition
- 1 generation = 1 AI output
- Regenerate = new generation
- Rollover allowed
- Outputs not stored

### Plans
- **Free (Lifetime):**
  - 5 total generations
  - +5 per referral signup

- **$4.99/month:** 300 generations
- **$9.99/month:** 1,000 generations
- **$19.99/month:** 3,000 generations

### Balance Display
- Visible in AI Studio
- Raw numbers (e.g., `742 / 1000`)
- Expiry date shown
- Upgrade button present

### Out-of-Credits Behavior
- AI actions blocked via modal
- Existing outputs remain editable/downloadable
- Scan Page, Autofill, Save Job still work
- Upgrade opens website pricing page in new tab

---

## 12. Autofill Application Form

### Behavior
- Works on all sites
- Best-guess field mapping
- DOM Element Parsed and displayed in extension as to be filled
- Elements filled are ticked off or shown as a different UI state
- Directly autofills fields
- Highlights filled fields visually

### Covers
- Personal info
- Resume upload
- Cover letter (if generated)
- Long-form questions
- Standard application questions like disability and veteran status 

### Undo
- Single-step undo
- Reverts last autofill action only
- Undo always available (no timeout)

---

## 13. Job Saving & Tracking

- User explicitly saves jobs
- Extension only for applying
- All status changes happen on web dashboard

---

## 14. Web Dashboard (v1)

### Pages
1. **Jobs List**
   - Table view
   - Status tracking

2. **Resume Management**
   - View/upload/delete resumes

3. **Account & Billing**
   - Subscription management
   - Usage overview

4. **Data & Privacy**
   - Explanation of data storage
   - Delete all data action

---

## 15. Data Handling & Architecture

### Local (Chrome Storage)
- Active resume selection
- Unsaved scanned job data
- Scan state
- Autofill undo snapshot
- UI preferences

### Backend (Source of Truth)
- User account info
- Uploaded resume files
- Parsed resume blocks
- Saved jobs
- Subscription status & usage counters
- Referral credits

### Explicitly Not Stored Anywhere
- AI-generated outputs

---

## 16. Logout Behavior

- Clear auth tokens
- Clear ephemeral sidebar state
- Safe cache (resume metadata, parsed blocks) may remain
- Redirect sidebar to login screen