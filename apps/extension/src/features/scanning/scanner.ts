/**
 * Self-contained scraping function for chrome.scripting.executeScript().
 *
 * IMPORTANT: This function is serialized by Chrome and injected into the page.
 * It MUST NOT use any imports, closures, or external references.
 * All helpers are inlined within the function body.
 *
 * Extraction strategy (layered, each fills gaps from the previous):
 *   1. JSON-LD structured data (most reliable when present)
 *   2. Board-specific + heuristic CSS selectors
 *   3. OpenGraph meta tags
 *   4. Generic fallbacks (document.title, meta description)
 */
export function scrapeJobPage() {
  const clean = (str: string | null | undefined): string =>
    str ? str.trim().replace(/\s+/g, " ") : "";

  const url = window.location.href;

  let title = "";
  let company = "";
  let description = "";
  let location = "";
  let salary = "";
  let employmentType = "";

  // ─── Layer 1: JSON-LD Structured Data ──────────────────────────────
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent || "");
        const items = Array.isArray(raw) ? raw : [raw];
        for (const data of items) {
          if (data["@type"] !== "JobPosting") continue;

          title = clean(data.title) || title;
          company =
            typeof data.hiringOrganization === "string"
              ? clean(data.hiringOrganization)
              : clean(data.hiringOrganization?.name) || company;

          if (data.description) {
            // Strip HTML tags from JSON-LD description
            const div = document.createElement("div");
            div.innerHTML = data.description;
            description = clean(div.textContent) || description;
          }

          if (data.jobLocation) {
            const loc = data.jobLocation;
            location =
              typeof loc === "string"
                ? clean(loc)
                : clean(
                    [loc.address?.addressLocality, loc.address?.addressRegion]
                      .filter(Boolean)
                      .join(", ")
                  ) || location;
          }

          if (data.baseSalary?.value) {
            const val = data.baseSalary.value;
            const cur = data.baseSalary.currency || "";
            salary =
              val.minValue && val.maxValue
                ? `${cur} ${val.minValue}–${val.maxValue}`.trim()
                : val.value
                  ? `${cur} ${val.value}`.trim()
                  : salary;
          }

          employmentType = clean(data.employmentType) || employmentType;
          break; // Use first JobPosting found
        }
      } catch {
        // Ignore invalid JSON-LD blocks
      }
    }
  } catch {
    // Ignore JSON-LD extraction failure
  }

  // ─── Layer 2: CSS Selectors (Board-Specific + Heuristic) ──────────
  const qs = (selectors: string[]): string => {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        const text = el?.textContent?.trim();
        if (text && text.length > 0) return clean(text);
      } catch {
        // Ignore invalid selectors
      }
    }
    return "";
  };

  if (!title) {
    title = qs([
      // LinkedIn
      ".job-details-jobs-unified-top-card__job-title h1",
      ".jobs-unified-top-card__job-title",
      ".t-24.job-details-jobs-unified-top-card__job-title",
      "h1.t-24",
      // Indeed
      'h1[data-testid="jobsearch-JobInfoHeader-title"]',
      ".jobsearch-JobInfoHeader-title",
      // Greenhouse
      ".app-title",
      "h1.heading",
      // Lever
      ".posting-headline h2",
      ".section-header h2",
      // Workday
      '[data-automation-id="jobPostingHeader"]',
      // Generic
      "h1",
    ]);
  }

  if (!company) {
    company = qs([
      // LinkedIn
      ".job-details-jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name a",
      // Indeed
      '[data-testid="inlineHeader-companyName"] a',
      '[data-company-name="true"]',
      // Greenhouse
      ".company-name",
      // Generic class heuristics
      '[class*="company"]',
      '[class*="employer"]',
      '[class*="organization"]',
    ]);
    // OG site_name fallback for company
    if (!company) {
      company =
        document
          .querySelector('meta[property="og:site_name"]')
          ?.getAttribute("content")
          ?.trim() || "";
    }
  }

  if (!description || description.length < 50) {
    // User selection (highest priority if deliberate)
    const selection = window.getSelection()?.toString() || "";
    if (selection.length > 50) {
      description = selection;
    } else {
      const descResult = qs([
        // Indeed
        "#jobDescriptionText",
        ".jobsearch-jobDescriptionText",
        ".jobsearch-JobComponent-description",
        // LinkedIn
        ".jobs-description__content",
        ".jobs-box__html-content",
        "#job-details",
        ".show-more-less-html__markup",
        // Glassdoor
        '[class*="JobDetails_jobDescription"]',
        ".jobDescriptionContent",
        '[data-test="jobDescription"]',
        // ZipRecruiter
        ".jobDescriptionSection",
        ".job_description",
        // Lever
        '[data-testid="jobDescription-container"]',
        ".section-wrapper",
        // Workday
        '[data-automation-id="jobPostingDescription"]',
        ".job-description-container",
        // Greenhouse
        "#content",
        ".job-post-description",
        "#job_description",
        // AngelList / Wellfound
        ".job-details",
        '[class*="styles_description"]',
        // SmartRecruiters
        ".job-sections",
        // Ashby
        ".ashby-job-posting-description",
        // Generic fallbacks
        '[data-test="job-description-text"]',
        '[id*="job_description"]',
        '[id*="job-description"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[class*="description"]',
        "article",
        "main",
      ]);
      if (descResult.length > (description?.length || 0)) {
        description = descResult;
      }
    }
  }

  if (!location) {
    location = qs([
      // LinkedIn
      ".job-details-jobs-unified-top-card__bullet",
      ".jobs-unified-top-card__bullet",
      // Indeed
      '[data-testid="inlineHeader-companyLocation"]',
      ".jobsearch-JobInfoHeader-subtitle > div:last-child",
      // Greenhouse
      ".location",
      // Lever
      ".posting-categories .sort-by-time .posting-category:first-child",
      // Generic
      '[class*="location"]',
      '[class*="jobLocation"]',
    ]);
  }

  if (!salary) {
    salary = qs([
      // LinkedIn
      ".job-details-jobs-unified-top-card__job-insight--highlight span",
      ".salary-main-rail__current-range",
      // Indeed
      '[data-testid="attribute_snippet_testid"]',
      "#salaryInfoAndJobType",
      // Generic
      '[class*="salary"]',
      '[class*="compensation"]',
    ]);
  }

  if (!employmentType) {
    employmentType = qs([
      // Indeed
      '[data-testid="attribute_snippet_testid"]',
      // Lever
      ".posting-categories .workplaceTypes",
    ]);
  }

  // ─── Layer 3: OpenGraph Meta Tags ─────────────────────────────────
  if (!title) {
    title =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content")
        ?.trim() || "";
  }

  // ─── Layer 4: Generic Fallbacks ───────────────────────────────────
  if (!title) {
    title = document.title.split(/[|\-–—]/).shift()?.trim() || "";
  }
  if (!description) {
    description =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim() || "";
  }

  return {
    title,
    company,
    description,
    location,
    salary,
    employmentType,
    sourceUrl: url,
  };
}
