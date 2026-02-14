/**
 * Job page URL detection patterns.
 * Used by the background service worker to detect when the user navigates to a job posting.
 * Patterns adapted from V1 prototype with additional coverage.
 */
const JOB_BOARD_PATTERNS: Array<{ pattern: RegExp; board: string }> = [
  // LinkedIn Jobs - multiple URL formats
  { pattern: /linkedin\.com\/jobs\/view\//i, board: "linkedin" },
  { pattern: /linkedin\.com\/jobs\/collections\//i, board: "linkedin" },
  { pattern: /linkedin\.com\/jobs\/search\//i, board: "linkedin" },
  { pattern: /currentJobId=/i, board: "linkedin" }, // Job modal open (key indicator for SPA!)

  // Indeed
  { pattern: /indeed\.com\/viewjob/i, board: "indeed" },
  { pattern: /indeed\.com\/jobs\?/i, board: "indeed" },

  // Greenhouse (hosted job boards)
  { pattern: /boards\.greenhouse\.io\/.*\/jobs\//i, board: "greenhouse" },
  { pattern: /job-boards\.greenhouse\.io/i, board: "greenhouse" },

  // Lever
  { pattern: /jobs\.lever\.co\//i, board: "lever" },

  // Workday
  { pattern: /myworkdayjobs\.com\/.*\/job\//i, board: "workday" },
  { pattern: /wd\d+\.myworkdaysite\.com/i, board: "workday" },

  // Glassdoor
  { pattern: /glassdoor\.com\/job-listing\//i, board: "glassdoor" },

  // ZipRecruiter
  { pattern: /ziprecruiter\.com\/c\/.*\/job\//i, board: "ziprecruiter" },
  { pattern: /ziprecruiter\.com\/jobs\//i, board: "ziprecruiter" },

  // Monster
  { pattern: /monster\.com\/job-openings\//i, board: "monster" },

  // AngelList / Wellfound
  { pattern: /wellfound\.com\/jobs/i, board: "wellfound" },
  { pattern: /angel\.co\/company\/.*\/jobs/i, board: "wellfound" },

  // Dice (tech jobs)
  { pattern: /dice\.com\/job-detail\//i, board: "dice" },

  // SimplyHired
  { pattern: /simplyhired\.com\/job\//i, board: "simplyhired" },

  // CareerBuilder
  { pattern: /careerbuilder\.com\/job\//i, board: "careerbuilder" },

  // Built In
  { pattern: /builtin\.com\/job\//i, board: "builtin" },

  // iCIMS
  { pattern: /icims\.com/i, board: "icims" },

  // SmartRecruiters
  { pattern: /smartrecruiters\.com/i, board: "smartrecruiters" },

  // Generic career page patterns (lower priority)
  { pattern: /careers\.[^/]+\.com\/.*job/i, board: "generic" },
  { pattern: /\/careers\/.*positions?\//i, board: "generic" },
  { pattern: /\/jobs\/\d+/i, board: "generic" },
];

/** Check if a URL is a job posting page. */
export function detectJobPage(url: string): boolean {
  return JOB_BOARD_PATTERNS.some(({ pattern }) => pattern.test(url));
}

/** Return the job board name for board-specific extraction, or null for unknown. */
export function getJobBoard(url: string): string | null {
  const match = JOB_BOARD_PATTERNS.find(({ pattern }) => pattern.test(url));
  return match?.board ?? null;
}
