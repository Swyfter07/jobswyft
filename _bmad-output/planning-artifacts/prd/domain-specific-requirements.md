# Domain-Specific Requirements

## Job Board Terms of Service Compliance

**Overall Risk: LOW to MEDIUM** — LinkedIn is the primary concern.

**Compliance Posture:** Jobswyft is a "job application autofill assistant" — user-initiated, single-page, read-only extraction with form autofill. This is fundamentally different from bulk scraping. Key mitigating factors: (1) legal precedent (hiQ v. LinkedIn) favoring access to publicly available data, (2) user-initiated single-page nature, (3) Simplify Jobs (1M+ users, YC-backed) operates identically without legal action, (4) Chrome Web Store explicitly accommodates extensions that read page content for user-facing features.

**Platform Risk Matrix:**

| Platform | Risk | Key Finding |
|----------|------|-------------|
| **LinkedIn** | **HIGH** | Explicit prohibition of browser extensions; blacklists exist; C&D history. Simplify Jobs operates identically at scale without legal action. |
| **Indeed** | **MEDIUM** | Standard anti-scraping ToS; enforcement targets bulk bots, not page-reading extensions. |
| **Glassdoor** | **MEDIUM** | Standard ToS; primary concern is review/salary data scraping, not job details. |
| **ZipRecruiter** | **LOW-MED** | Standard ToS; partner API available. |
| **Monster** | **LOW** | Declining enforcement posture. |
| **Greenhouse** | **LOW** | Has **public Job Board API** — most permissive ATS. |
| **Lever** | **LOW** | Public career pages, standard terms. |
| **Workday** | **LOW** | Public career pages; `data-automation-id` attributes suggest anticipation of programmatic access. |
| **iCIMS** | **LOW** | Developer platform available; enforcement focus on enterprise data. |
| **Taleo (Oracle)** | **LOW** | Oracle's focus is enterprise licensing, not public career pages. |
| **SmartRecruiters** | **LOW** | Active developer platform and Marketplace API. |
| **BambooHR** | **LOW** | Standard terms; public career pages. |
| **Ashby** | **LOW** | Most integration-friendly — open API, partner-first approach. |

**Legal Precedent:**

- **hiQ v. LinkedIn (9th Circuit, 2022):** Accessing publicly available data does not violate CFAA. ToS breach is separate civil matter but extension developer typically lacks privity of contract.
- **Meta v. Bright Data (2024):** When logged in, breach of contract claims may apply — but the *user* agreed to ToS, and the extension is a tool they employ (like a screen reader or password manager).
- **Market distinction:** "Autofill assistants" (Simplify, Jobswyft) are tolerated; "auto-apply bots" (LazyApply) are actively blocked.

**Compliance Requirements:**

1. **Positioning**: Frame as "job application autofill assistant" — never use "scrape," "extract," or "crawl" in user-facing materials
2. **Chrome Web Store compliance**: Clear listing description, published privacy policy, Limited Use compliance statement, user consent prompt
3. **Technical safeguards** (many already implemented):
   - READ ONLY extraction (no DOM clicks during scanning) — already in place
   - Single-page operation only — already in place
   - JSON-LD extraction as primary strategy — already in place
   - No bulk navigation or crawling — already in place
   - No raw HTML persistence — only structured job data
   - Extension-side rate limiting: pause scanning if user navigates 10+ pages rapidly
4. **LinkedIn-specific mitigations** (HIGH risk):
   - Consider opt-in scanning on LinkedIn (not automatic)
   - Prefer JSON-LD + OpenGraph extraction over CSS selectors on LinkedIn
   - Graceful degradation path if LinkedIn blocks the extension
   - Monitor LinkedIn's extension blocking behavior
5. **Legal documentation**:
   - "How It Works" page explaining single-page, user-initiated, read-only behavior
   - User ToS with disclaimer: "Users are responsible for complying with the terms of service of the websites they visit"
   - DMCA/takedown response plan
6. **API partnerships to explore long-term**:
   - Greenhouse (public Job Board API — can use today)
   - Ashby (open API, partner-friendly)
   - SmartRecruiters (Marketplace API)
   - ZipRecruiter (partner platform)

## Rate Limiting & Abuse Prevention (MVP — Low Priority)

- Backend rate limiting on AI generation endpoints (per-user, per-tier, configurable via backend config)
- Account creation rate limiting (prevent mass free-tier abuse)
- API endpoint rate limiting (standard per-IP and per-token)
- Extension-side: pause scanning with notice if user navigates 10+ job pages rapidly
- Multiple-account detection deferred to post-MVP
- All rate limits configurable per tier via backend config system

## AI Content Guardrails (Must-Have)

- AI outputs must never fabricate experience, skills, or qualifications the user doesn't have
- Cover letters and outreach must be grounded in the user's actual resume data
- Match analysis must accurately reflect gaps — not hide them to please the user
- Coach responses must give honest, grounded advice (not "you're perfect for every job")
- System prompts enforce truthfulness constraints across all AI tools
- If AI detects a significant mismatch, surface it transparently
- No hallucinated company names, dates, or project details

## Chrome Extension Permissions Model

- Minimal permissions principle — request only what's needed
- `host_permissions` limited to specific domains listed in content sentinel (not `<all_urls>`)
- Content script scope: matched URL patterns only
- Privacy policy published and linked in extension manifest
- In-extension consent prompt before first data collection
- Chrome Web Store Limited Use compliance statement on website
