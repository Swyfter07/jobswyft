/**
 * Content Sentinel — Lightweight MutationObserver content script.
 *
 * Purpose: Detect when job content has loaded and expand "Show More" sections
 * BEFORE signaling readiness to the side panel for extraction.
 *
 * This script does NOT extract data — it only observes and signals.
 * Extraction still happens via chrome.scripting.executeScript() from the side panel.
 *
 * Architecture: ADR-SCAN-2 (Content Sentinel)
 * AC: #1 (Content readiness), #2 (Show More expansion)
 */

export default defineContentScript({
  matches: [
    // LinkedIn
    "*://*.linkedin.com/jobs/*",
    // Indeed
    "*://*.indeed.com/viewjob*",
    "*://*.indeed.com/jobs*",
    // Greenhouse
    "*://boards.greenhouse.io/*/jobs/*",
    "*://job-boards.greenhouse.io/*",
    // Lever
    "*://jobs.lever.co/*",
    // Workday
    "*://*.myworkdayjobs.com/*",
    "*://*.myworkdaysite.com/*",
    // Glassdoor
    "*://*.glassdoor.com/job-listing/*",
    // ZipRecruiter
    "*://*.ziprecruiter.com/c/*/job/*",
    "*://*.ziprecruiter.com/jobs/*",
    // Monster
    "*://*.monster.com/job-openings/*",
    // Wellfound
    "*://wellfound.com/jobs*",
    // Dice
    "*://*.dice.com/job-detail/*",
  ],
  runAt: "document_idle",

  main() {
    const SENTINEL_KEY = "jobswyft-content-ready";
    const FALLBACK_TIMEOUT_MS = 3000;

    let signaled = false;

    // ─── Show More Detection (READ ONLY — no clicking) ────────────────
    function detectShowMore(): boolean {
      const showMoreSelectors = [
        ".show-more-less-html__button--more",           // LinkedIn
        'button[aria-label="Show full description"]',   // Indeed
        '[class*="show-more"]', '[class*="showMore"]',
        '[class*="read-more"]', '[class*="readMore"]',
        "details:not([open])",
      ];
      return showMoreSelectors.some(sel => {
        try { return document.querySelector(sel) !== null; } catch { return false; }
      });
    }

    // ─── Form Field Detection (passive count for Full Power state) ────
    function detectFormFields(): number {
      const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select';
      return document.querySelectorAll(selector).length;
    }

    function signalReady(): void {
      if (signaled) return;
      signaled = true;

      // Use chrome.storage.session to signal the background worker
      chrome.storage.session.set({
        [SENTINEL_KEY]: {
          tabId: -1, // Will be resolved by background
          url: window.location.href,
          timestamp: Date.now(),
          hasShowMore: detectShowMore(),
          formFieldCount: detectFormFields(),
        },
      });
    }

    // ─── Board-Specific Readiness Signals ─────────────────────────────
    function getReadinessSelector(): string | null {
      const url = window.location.href;

      if (url.includes("linkedin.com")) {
        return ".jobs-description__content, .show-more-less-html__markup";
      }
      if (url.includes("indeed.com")) {
        return "#jobDescriptionText, .jobsearch-jobDescriptionText";
      }
      if (url.includes("greenhouse.io")) {
        return "#content, .job-post-description";
      }
      if (url.includes("lever.co")) {
        return '[data-testid="jobDescription-container"], .section-wrapper';
      }
      if (url.includes("myworkdayjobs.com") || url.includes("myworkdaysite.com")) {
        return '[data-automation-id="jobPostingDescription"]';
      }
      if (url.includes("glassdoor.com")) {
        return '[class*="JobDetails_jobDescription"]';
      }

      // Generic: wait for any description-like element
      return '[class*="job-description"], [class*="jobDescription"], article, main';
    }

    // ─── MutationObserver ─────────────────────────────────────────────
    const readinessSelector = getReadinessSelector();

    // Check if content is already present
    if (readinessSelector && document.querySelector(readinessSelector)) {
      signalReady();
      return;
    }

    // Observe for content appearing
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver(() => {
      if (readinessSelector && document.querySelector(readinessSelector)) {
        observer.disconnect();
        if (fallbackTimer) clearTimeout(fallbackTimer);
        signalReady();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // ─── Fallback Timeout (AC1: 3 second fallback) ───────────────────
    fallbackTimer = setTimeout(() => {
      observer.disconnect();
      signalReady();
    }, FALLBACK_TIMEOUT_MS);

  },
});
