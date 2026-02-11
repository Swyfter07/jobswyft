/**
 * Selector Registry — Data-driven CSS selector definitions for job board extraction.
 *
 * Each entry maps a board + field to an ordered list of CSS selectors.
 * The registry is JSON-serializable so it can be passed via chrome.scripting.executeScript({ args }).
 *
 * Board filtering: scanner receives the detected board name and only runs
 * entries matching that board + "generic" fallbacks.
 *
 * Lifecycle fields (added, lastVerified, status) support future selector health tracking.
 */

export interface SelectorEntry {
  /** Unique identifier, e.g. "li-title-unified-v3" */
  id: string;
  /** Board name matching job-detector.ts output, or "generic" for cross-board fallbacks */
  board: string;
  /** Field this entry targets */
  field: "title" | "company" | "description" | "location" | "salary" | "employmentType";
  /** Ordered CSS selectors — tried in sequence, first non-empty match wins */
  selectors: string[];
  /** Lower number = tried first within same board+field */
  priority: number;
  /** Lifecycle status */
  status: "active" | "degraded" | "deprecated";
  /** ISO date when entry was added */
  added: string;
  /** ISO date of last manual verification (optional) */
  lastVerified?: string;
  /** Human-readable notes (optional) */
  notes?: string;
}

export const SELECTOR_REGISTRY: SelectorEntry[] = [
  // ─── LinkedIn ──────────────────────────────────────────────────────

  {
    id: "li-title-unified",
    board: "linkedin",
    field: "title",
    selectors: [
      ".job-details-jobs-unified-top-card__job-title h1",
      ".job-details-jobs-unified-top-card__job-title a",
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title a",
      ".jobs-unified-top-card__job-title",
      ".t-24.job-details-jobs-unified-top-card__job-title",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
    notes: "LinkedIn unified top card — multiple generations of class names",
  },
  {
    id: "li-title-detail",
    board: "linkedin",
    field: "title",
    selectors: [
      ".jobs-details__main-content h1",
      ".jobs-details-top-card__job-title",
      ".job-view-layout h1",
      ".jobs-search__job-details h1",
      ".jobs-details h1",
    ],
    priority: 2,
    status: "active",
    added: "2026-02-10",
    notes: "LinkedIn detail/search views — older layouts",
  },
  {
    id: "li-company-unified",
    board: "linkedin",
    field: "company",
    selectors: [
      ".job-details-jobs-unified-top-card__company-name a",
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name",
      ".jobs-details-top-card__company-info a",
      ".jobs-details-top-card__company-info",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "li-description",
    board: "linkedin",
    field: "description",
    selectors: [
      ".jobs-description__content",
      ".jobs-box__html-content",
      "#job-details",
      ".show-more-less-html__markup",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "li-location",
    board: "linkedin",
    field: "location",
    selectors: [
      ".job-details-jobs-unified-top-card__bullet",
      ".jobs-unified-top-card__bullet",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "li-salary",
    board: "linkedin",
    field: "salary",
    selectors: [
      ".job-details-jobs-unified-top-card__job-insight--highlight span",
      ".salary-main-rail__current-range",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Indeed ────────────────────────────────────────────────────────

  {
    id: "indeed-title",
    board: "indeed",
    field: "title",
    selectors: [
      'h1[data-testid="jobsearch-JobInfoHeader-title"]',
      ".jobsearch-JobInfoHeader-title",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "indeed-company",
    board: "indeed",
    field: "company",
    selectors: [
      '[data-testid="inlineHeader-companyName"] a',
      '[data-company-name="true"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "indeed-description",
    board: "indeed",
    field: "description",
    selectors: [
      "#jobDescriptionText",
      ".jobsearch-jobDescriptionText",
      ".jobsearch-JobComponent-description",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "indeed-location",
    board: "indeed",
    field: "location",
    selectors: [
      '[data-testid="inlineHeader-companyLocation"]',
      ".jobsearch-JobInfoHeader-subtitle > div:last-child",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "indeed-salary",
    board: "indeed",
    field: "salary",
    selectors: [
      '[data-testid="attribute_snippet_testid"]',
      "#salaryInfoAndJobType",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "indeed-employment-type",
    board: "indeed",
    field: "employmentType",
    selectors: [
      "#salaryInfoAndJobType .jobsearch-JobInfoHeader-item",
      '[data-testid="jobsearch-JobInfoHeader-companyRating"] ~ div',
    ],
    priority: 2,
    status: "active",
    added: "2026-02-10",
    notes: "Separate from salary — avoids ambiguity with shared attribute_snippet_testid",
  },

  // ─── Greenhouse ───────────────────────────────────────────────────

  {
    id: "greenhouse-title",
    board: "greenhouse",
    field: "title",
    selectors: [
      ".app-title",
      "h1.heading",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "greenhouse-company",
    board: "greenhouse",
    field: "company",
    selectors: [
      ".company-name",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "greenhouse-description",
    board: "greenhouse",
    field: "description",
    selectors: [
      "#content",
      ".job-post-description",
      "#job_description",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "greenhouse-location",
    board: "greenhouse",
    field: "location",
    selectors: [
      ".location",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Lever ────────────────────────────────────────────────────────

  {
    id: "lever-title",
    board: "lever",
    field: "title",
    selectors: [
      ".posting-headline h2",
      ".section-header h2",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "lever-description",
    board: "lever",
    field: "description",
    selectors: [
      '[data-testid="jobDescription-container"]',
      ".section-wrapper",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "lever-location",
    board: "lever",
    field: "location",
    selectors: [
      ".posting-categories .sort-by-time .posting-category:first-child",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "lever-employment-type",
    board: "lever",
    field: "employmentType",
    selectors: [
      ".posting-categories .workplaceTypes",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Workday ──────────────────────────────────────────────────────

  {
    id: "workday-title",
    board: "workday",
    field: "title",
    selectors: [
      '[data-automation-id="jobPostingHeader"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "workday-description",
    board: "workday",
    field: "description",
    selectors: [
      '[data-automation-id="jobPostingDescription"]',
      ".job-description-container",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Glassdoor ────────────────────────────────────────────────────

  {
    id: "glassdoor-description",
    board: "glassdoor",
    field: "description",
    selectors: [
      '[class*="JobDetails_jobDescription"]',
      ".jobDescriptionContent",
      '[data-test="jobDescription"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── ZipRecruiter ─────────────────────────────────────────────────

  {
    id: "ziprecruiter-description",
    board: "ziprecruiter",
    field: "description",
    selectors: [
      ".jobDescriptionSection",
      ".job_description",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Wellfound / AngelList ────────────────────────────────────────

  {
    id: "wellfound-description",
    board: "wellfound",
    field: "description",
    selectors: [
      ".job-details",
      '[class*="styles_description"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── SmartRecruiters ──────────────────────────────────────────────

  {
    id: "smartrecruiters-description",
    board: "smartrecruiters",
    field: "description",
    selectors: [
      ".job-sections",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Ashby ────────────────────────────────────────────────────────

  {
    id: "ashby-description",
    board: "ashby",
    field: "description",
    selectors: [
      ".ashby-job-posting-description",
    ],
    priority: 1,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Generic Fallbacks ────────────────────────────────────────────

  {
    id: "generic-title",
    board: "generic",
    field: "title",
    selectors: [
      "h1",
    ],
    priority: 10,
    status: "active",
    added: "2026-02-10",
    notes: "Generic h1 fallback — validated via isValidJobTitle before use",
  },
  {
    id: "generic-company",
    board: "generic",
    field: "company",
    selectors: [
      '[class*="company"]',
      '[class*="employer"]',
      '[class*="organization"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "generic-description",
    board: "generic",
    field: "description",
    selectors: [
      '[data-test="job-description-text"]',
      '[id*="job_description"]',
      '[id*="job-description"]',
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="description"]',
      "article",
      "main",
    ],
    priority: 10,
    status: "active",
    added: "2026-02-10",
    notes: "Generic description selectors — broadest fallbacks last",
  },
  {
    id: "generic-location",
    board: "generic",
    field: "location",
    selectors: [
      '[class*="location"]',
      '[class*="jobLocation"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "generic-salary",
    board: "generic",
    field: "salary",
    selectors: [
      '[class*="salary"]',
      '[class*="compensation"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-10",
  },

  // ─── Heuristic Fallbacks (Layer 5 read-only) ──────────────────────

  {
    id: "heuristic-title",
    board: "generic",
    field: "title",
    selectors: [
      '[role="heading"]',
      "h2",
    ],
    priority: 20,
    status: "active",
    added: "2026-02-10",
    notes: "Heuristic — last resort for titles when board-specific + generic fail",
  },
  {
    id: "heuristic-company",
    board: "generic",
    field: "company",
    selectors: [
      '[class*="brand"]',
      '[class*="org"]',
    ],
    priority: 20,
    status: "active",
    added: "2026-02-10",
  },
  {
    id: "heuristic-description",
    board: "generic",
    field: "description",
    selectors: [
      '[role="main"] p',
      "article p",
      ".content p",
    ],
    priority: 20,
    status: "active",
    added: "2026-02-10",
    notes: "Paragraph-level heuristic fallback",
  },
  {
    id: "heuristic-location",
    board: "generic",
    field: "location",
    selectors: [
      '[class*="address"]',
      '[class*="region"]',
    ],
    priority: 20,
    status: "active",
    added: "2026-02-10",
  },
];
