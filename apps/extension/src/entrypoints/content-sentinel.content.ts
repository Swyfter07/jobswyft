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
    const POST_EXPAND_DELAY_MS = 500;

    let signaled = false;

    function signalReady(): void {
      if (signaled) return;
      signaled = true;

      // Use chrome.storage.session to signal the background worker
      chrome.storage.session.set({
        [SENTINEL_KEY]: {
          tabId: -1, // Will be resolved by background
          url: window.location.href,
          timestamp: Date.now(),
        },
      });
    }

    // ─── Show More Expansion ──────────────────────────────────────────
    function expandShowMore(): boolean {
      let expanded = false;

      // LinkedIn: show-more-less-html button
      const linkedInShowMore = document.querySelector<HTMLButtonElement>(
        ".show-more-less-html__button--more"
      );
      if (linkedInShowMore) {
        linkedInShowMore.click();
        expanded = true;
      }

      // Indeed: Show full description button
      const indeedShowMore = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Show full description"]'
      );
      if (indeedShowMore) {
        indeedShowMore.click();
        expanded = true;
      }

      // Generic "show more" buttons
      const genericButtons = document.querySelectorAll<HTMLButtonElement>(
        '[class*="show-more"], [class*="showMore"], [class*="read-more"], [class*="readMore"]'
      );
      for (const btn of genericButtons) {
        try {
          btn.click();
          expanded = true;
        } catch {
          // Ignore click failures
        }
      }

      // Expand collapsed <details> elements
      const closedDetails = document.querySelectorAll<HTMLDetailsElement>(
        "details:not([open])"
      );
      for (const d of closedDetails) {
        d.open = true;
        expanded = true;
      }

      // Expand aria-expanded="false" elements
      const collapsed = document.querySelectorAll<HTMLElement>(
        '[aria-expanded="false"]'
      );
      for (const el of collapsed) {
        try {
          el.click();
          expanded = true;
        } catch {
          // Ignore click failures
        }
      }

      return expanded;
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
      const expanded = expandShowMore();
      if (expanded) {
        setTimeout(signalReady, POST_EXPAND_DELAY_MS);
      } else {
        signalReady();
      }
      return;
    }

    // Observe for content appearing
    const observer = new MutationObserver(() => {
      if (readinessSelector && document.querySelector(readinessSelector)) {
        observer.disconnect();
        const expanded = expandShowMore();
        if (expanded) {
          setTimeout(signalReady, POST_EXPAND_DELAY_MS);
        } else {
          signalReady();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // ─── Fallback Timeout (AC1: 3 second fallback) ───────────────────
    setTimeout(() => {
      observer.disconnect();
      expandShowMore();
      signalReady();
    }, FALLBACK_TIMEOUT_MS);
  },
});
