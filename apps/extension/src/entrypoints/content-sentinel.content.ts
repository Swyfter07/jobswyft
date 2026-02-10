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
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver(() => {
      if (readinessSelector && document.querySelector(readinessSelector)) {
        observer.disconnect();
        if (fallbackTimer) clearTimeout(fallbackTimer);
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
    fallbackTimer = setTimeout(() => {
      observer.disconnect();
      expandShowMore();
      signalReady();
    }, FALLBACK_TIMEOUT_MS);

    // ─── Form Detection & Filling Handlers ─────────────────────────

    function detectJobBoard(): string {
      const url = window.location.href;
      if (url.includes("ashbyhq.com")) return "ashby";
      if (url.includes("myworkdayjobs.com") || url.includes("myworkdaysite.com")) return "workday";
      if (url.includes("greenhouse.io")) return "greenhouse";
      if (url.includes("lever.co")) return "lever";
      if (url.includes("linkedin.com")) return "linkedin";
      if (url.includes("indeed.com")) return "indeed";
      return "unknown";
    }

    function getEEOFieldType(label: string): string | null {
      const l = label.toLowerCase();
      if (/veteran/i.test(l)) return "veteranStatus";
      if (/disability|disabilit/i.test(l)) return "disabilityStatus";
      if (/race|ethnic/i.test(l)) return "raceEthnicity";
      if (/gender|sex\b/i.test(l)) return "gender";
      if (/sponsor/i.test(l)) return "sponsorshipRequired";
      if (/authorized|authorization|work.*auth/i.test(l)) return "authorizedToWork";
      return null;
    }

    function getFieldLabel(el: HTMLElement): string {
      // 1. Associated <label> via for/id
      if (el.id) {
        const label = document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);
        if (label?.textContent?.trim()) return label.textContent.trim();
      }
      // 2. Parent <label>
      const parentLabel = el.closest("label");
      if (parentLabel?.textContent?.trim()) return parentLabel.textContent.trim();
      // 3. Ashby-specific
      const ashbyLabel = el.closest("[data-ui]")?.querySelector("label");
      if (ashbyLabel?.textContent?.trim()) return ashbyLabel.textContent.trim();
      // 4. Workday-specific
      const workdayLabel = el.closest("[data-automation-id]")?.querySelector("label");
      if (workdayLabel?.textContent?.trim()) return workdayLabel.textContent.trim();
      // 5. aria-label
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel?.trim()) return ariaLabel.trim();
      // 6. placeholder
      const placeholder = el.getAttribute("placeholder");
      if (placeholder?.trim()) return placeholder.trim();
      // 7. name attribute
      const name = el.getAttribute("name");
      if (name) return name.replace(/[-_]/g, " ").trim();
      return "Unknown field";
    }

    function generateSelector(el: HTMLElement): string {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const name = el.getAttribute("name");
      if (name) return `[name="${CSS.escape(name)}"]`;
      const tag = el.tagName.toLowerCase();
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll(tag));
        const idx = siblings.indexOf(el);
        return `${tag}:nth-of-type(${idx + 1})`;
      }
      return tag;
    }

    function categorizeField(label: string, type: string): string {
      const l = label.toLowerCase();
      // Resume/file upload
      if (type === "file") return "resume";
      // Personal info
      if (/^(first|last|full)?\s*name$|^name$/i.test(l)) return "personal";
      if (/email/i.test(l)) return "personal";
      if (/phone|mobile|tel/i.test(l)) return "personal";
      if (/linkedin/i.test(l)) return "personal";
      if (/website|portfolio|url/i.test(l)) return "personal";
      if (/address|city|state|zip|country|location/i.test(l)) return "personal";
      // EEO
      if (getEEOFieldType(l)) return "eeo";
      // Default to questions
      return "questions";
    }

    function setNativeValue(el: HTMLElement, value: string): void {
      if (el instanceof HTMLSelectElement) {
        const option = Array.from(el.options).find(
          (o) => o.value === value || o.textContent?.trim().toLowerCase() === value.toLowerCase()
        );
        if (option) {
          el.value = option.value;
        }
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const nativeInputValueSetter =
          Object.getOwnPropertyDescriptor(
            el instanceof HTMLTextAreaElement
              ? HTMLTextAreaElement.prototype
              : HTMLInputElement.prototype,
            "value"
          )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, value);
        } else {
          el.value = value;
        }
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    }

    // Message listener for form detection/filling from side panel
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === "DETECT_FORM_FIELDS") {
        try {
          const selector =
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="image"]), textarea, select, input[type="file"]';
          const elements = document.querySelectorAll<HTMLElement>(selector);
          const board = detectJobBoard();

          const fields = Array.from(elements)
            .filter((el) => !(el as HTMLInputElement).disabled)
            .map((el) => {
              const label = getFieldLabel(el);
              const type = el.getAttribute("type") ?? el.tagName.toLowerCase();
              const category = categorizeField(label, type);
              const eeoType = category === "eeo" ? getEEOFieldType(label) : null;
              return {
                id: el.id || null,
                selector: generateSelector(el),
                label,
                type,
                currentValue: (el as HTMLInputElement).value || "",
                category,
                eeoType,
                jobBoard: board,
              };
            });

          sendResponse({ success: true, fields });
        } catch (err) {
          sendResponse({ success: false, error: String(err) });
        }
        return true;
      }

      if (message.action === "FILL_FORM_FIELDS") {
        try {
          const fieldValues: Array<{ selector: string; value: string }> = message.fieldValues || [];
          let filled = 0;
          const errors: string[] = [];

          for (const { selector, value } of fieldValues) {
            try {
              const el = document.querySelector<HTMLElement>(selector);
              if (el) {
                setNativeValue(el, value);
                filled++;
              } else {
                errors.push(`Element not found: ${selector}`);
              }
            } catch (e) {
              errors.push(`Failed to fill ${selector}: ${String(e)}`);
            }
          }

          sendResponse({ success: true, filled, errors });
        } catch (err) {
          sendResponse({ success: false, error: String(err) });
        }
        return true;
      }

      return false;
    });
  },
});
