/**
 * ATS Form Detection — Identifies application form pages by URL pattern.
 *
 * Unlike job-detector.ts (which detects job listing pages for scraping),
 * this module detects application/apply pages where form autofill is relevant.
 */

const ATS_FORM_PATTERNS: Array<{ pattern: RegExp; board: string }> = [
  // Greenhouse application forms
  { pattern: /boards\.greenhouse\.io\/.*\/jobs\/\d+/i, board: "greenhouse" },
  { pattern: /job-boards\.greenhouse\.io\/.+/i, board: "greenhouse" },

  // Lever application forms
  { pattern: /jobs\.lever\.co\/[^/]+\/[a-f0-9-]+\/apply/i, board: "lever" },
  { pattern: /jobs\.lever\.co\/[^/]+\/[a-f0-9-]+/i, board: "lever" },

  // Workday application forms
  { pattern: /myworkdayjobs\.com\/.*\/job\/.*\/apply/i, board: "workday" },
  { pattern: /myworkdayjobs\.com\/.*\/job\//i, board: "workday" },
  { pattern: /myworkdaysite\.com\/.*\/apply/i, board: "workday" },
  { pattern: /myworkdaysite\.com\/.+/i, board: "workday" },

  // Ashby application forms
  { pattern: /jobs\.ashbyhq\.com\/[^/]+\/[a-f0-9-]+\/application/i, board: "ashby" },
  { pattern: /jobs\.ashbyhq\.com\/[^/]+\/[a-f0-9-]+/i, board: "ashby" },

  // SmartRecruiters
  { pattern: /jobs\.smartrecruiters\.com\/[^/]+\/\d+/i, board: "smartrecruiters" },
  { pattern: /smartrecruiters\.com\/.*\/apply/i, board: "smartrecruiters" },

  // iCIMS
  { pattern: /\.icims\.com\//i, board: "icims" },

  // Workable
  { pattern: /apply\.workable\.com\//i, board: "workable" },
  { pattern: /workable\.com\/.*\/j\//i, board: "workable" },

  // BambooHR
  { pattern: /bamboohr\.com\/.*\/jobs\/view\.php/i, board: "bamboohr" },

  // Jobvite
  { pattern: /jobs\.jobvite\.com\/.*\/job\//i, board: "jobvite" },
  { pattern: /jobvite\.com\/.*\/apply/i, board: "jobvite" },

  // Generic application patterns (lower priority, must be last)
  { pattern: /\/apply\b/i, board: "generic" },
  { pattern: /\/application\//i, board: "generic" },
  { pattern: /\/careers\/.*apply/i, board: "generic" },
];

export interface ATSFormDetection {
  isATS: boolean;
  board: string;
}

/**
 * Detect if a URL is an ATS application form page.
 * Returns the board name if detected, "generic" for unknown ATS, or empty string if not an ATS form.
 */
export function detectATSForm(url: string): ATSFormDetection {
  for (const { pattern, board } of ATS_FORM_PATTERNS) {
    if (pattern.test(url)) {
      return { isATS: true, board };
    }
  }
  return { isATS: false, board: "" };
}
