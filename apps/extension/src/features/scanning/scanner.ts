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
 *   5. Heuristic fallback (hidden content, details/accordions, extended selectors)
 *
 * Returns job data + per-field extraction source for confidence scoring.
 */
export function scrapeJobPage(_board?: string | null) {
  const clean = (str: string | null | undefined): string =>
    str ? str.trim().replace(/\s+/g, " ") : "";

  const url = window.location.href;

  let title = "";
  let company = "";
  let description = "";
  let location = "";
  let salary = "";
  let employmentType = "";

  // Per-field source tracking for confidence scoring
  const sources: Record<string, string> = {};

  // ─── Layer 1: JSON-LD Structured Data ──────────────────────────────
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    // Recursive helper to find JobPosting in @graph arrays
    const findJobPosting = (obj: unknown): Record<string, unknown> | null => {
      if (!obj || typeof obj !== "object") return null;
      const record = obj as Record<string, unknown>;

      if (record["@type"] === "JobPosting") return record;

      // Handle @graph arrays
      if (Array.isArray(record["@graph"])) {
        for (const item of record["@graph"]) {
          const found = findJobPosting(item);
          if (found) return found;
        }
      }

      // Handle top-level arrays
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const found = findJobPosting(item);
          if (found) return found;
        }
      }

      return null;
    };

    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent || "");
        const data = findJobPosting(raw);
        if (!data) continue;

        const t = clean(data.title as string);
        if (t) { title = t; sources.title = "json-ld"; }

        const org = data.hiringOrganization;
        const c = typeof org === "string"
          ? clean(org)
          : clean((org as Record<string, unknown>)?.name as string);
        if (c) { company = c; sources.company = "json-ld"; }

        if (data.description) {
          const div = document.createElement("div");
          div.innerHTML = data.description as string;
          const d = clean(div.textContent);
          if (d) { description = d; sources.description = "json-ld"; }
        }

        if (data.jobLocation) {
          const loc = data.jobLocation as Record<string, unknown>;
          const l = typeof loc === "string"
            ? clean(loc)
            : clean(
                [
                  (loc.address as Record<string, unknown>)?.addressLocality,
                  (loc.address as Record<string, unknown>)?.addressRegion,
                ]
                  .filter(Boolean)
                  .join(", ") as string
              );
          if (l) { location = l; sources.location = "json-ld"; }
        }

        if ((data.baseSalary as Record<string, unknown>)?.value) {
          const bs = data.baseSalary as Record<string, unknown>;
          const val = bs.value as Record<string, unknown>;
          const cur = (bs.currency as string) || "";
          const s = val.minValue && val.maxValue
            ? `${cur} ${val.minValue}–${val.maxValue}`.trim()
            : val.value
              ? `${cur} ${val.value}`.trim()
              : "";
          if (s) { salary = s; sources.salary = "json-ld"; }
        }

        const et = clean(data.employmentType as string);
        if (et) { employmentType = et; sources.employmentType = "json-ld"; }

        break; // Use first JobPosting found
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

  // Determine source type for CSS layer (board-specific vs generic)
  const cssSource = "css-board";
  const cssGenericSource = "css-generic";

  if (!title) {
    const t = qs([
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
    ]);
    if (t) {
      title = t;
      sources.title = cssSource;
    } else {
      const generic = qs(["h1"]);
      if (generic) { title = generic; sources.title = cssGenericSource; }
    }
  }

  if (!company) {
    const c = qs([
      // LinkedIn
      ".job-details-jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name a",
      // Indeed
      '[data-testid="inlineHeader-companyName"] a',
      '[data-company-name="true"]',
      // Greenhouse
      ".company-name",
    ]);
    if (c) {
      company = c;
      sources.company = cssSource;
    } else {
      const generic = qs([
        '[class*="company"]',
        '[class*="employer"]',
        '[class*="organization"]',
      ]);
      if (generic) { company = generic; sources.company = cssGenericSource; }
    }
    // OG site_name fallback for company
    if (!company) {
      const ogCompany = document
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content")
        ?.trim() || "";
      if (ogCompany) { company = ogCompany; sources.company = "og-meta"; }
    }
  }

  if (!description || description.length < 50) {
    // User selection (highest priority if deliberate)
    const selection = window.getSelection()?.toString() || "";
    if (selection.length > 50) {
      description = selection;
      sources.description = "user-edit";
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
        sources.description = sources.description || cssSource;
      }
    }
  }

  if (!location) {
    const l = qs([
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
    ]);
    if (l) {
      location = l;
      sources.location = cssSource;
    } else {
      const generic = qs([
        '[class*="location"]',
        '[class*="jobLocation"]',
      ]);
      if (generic) { location = generic; sources.location = cssGenericSource; }
    }
  }

  if (!salary) {
    const s = qs([
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
    // Validate: salary text must contain a currency symbol or formatted number
    if (s && /[$€£¥]|\d{1,3}(,\d{3})/.test(s)) { salary = s; sources.salary = cssSource; }
  }

  if (!employmentType) {
    const et = qs([
      // Indeed
      '[data-testid="attribute_snippet_testid"]',
      // Lever
      ".posting-categories .workplaceTypes",
    ]);
    if (et) { employmentType = et; sources.employmentType = cssSource; }
  }

  // ─── Layer 3: OpenGraph Meta Tags ─────────────────────────────────
  if (!title) {
    const ogTitle = document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content")
      ?.trim() || "";
    if (ogTitle) { title = ogTitle; sources.title = "og-meta"; }
  }

  // ─── Layer 4: Generic Fallbacks ───────────────────────────────────
  if (!title) {
    const docTitle = document.title.split(/[|\-–—]/).shift()?.trim() || "";
    if (docTitle) { title = docTitle; sources.title = cssGenericSource; }
  }
  if (!description) {
    const metaDesc = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
      ?.trim() || "";
    if (metaDesc) { description = metaDesc; sources.description = "og-meta"; }
  }

  // ─── Layer 5: Heuristic Fallback ──────────────────────────────────
  // Reads hidden content, expands collapsed sections, tries extended selectors.
  // Only runs if key fields are still missing.
  if (!title || !company || !description || description.length < 50) {
    try {
      // Expand <details> elements that aren't open
      const closedDetails = document.querySelectorAll("details:not([open])");
      for (const d of closedDetails) {
        (d as HTMLDetailsElement).open = true;
      }

      // Expand accordion sections
      const collapsed = document.querySelectorAll('[aria-expanded="false"]');
      for (const el of collapsed) {
        try { (el as HTMLElement).click(); } catch { /* ignore click failures */ }
      }

      // Read CSS-hidden content that may contain description text
      if (!description || description.length < 50) {
        const hiddenEls = document.querySelectorAll(
          '[style*="display: none"], [style*="max-height"], [style*="overflow: hidden"]'
        );
        for (const el of hiddenEls) {
          const text = clean(el.textContent);
          if (text.length > (description?.length || 0) && text.length > 50) {
            description = text;
            sources.description = "heuristic";
          }
        }
      }

      // Extended generic selectors for remaining missing fields
      if (!title) {
        const t = qs(['[role="heading"]', "h2"]);
        if (t) { title = t; sources.title = "heuristic"; }
      }
      if (!company) {
        const c = qs(['[class*="brand"]', '[class*="org"]']);
        if (c) { company = c; sources.company = "heuristic"; }
      }
      if (!description || description.length < 50) {
        const d = qs(['[role="main"] p', "article p", ".content p"]);
        if (d && d.length > (description?.length || 0)) {
          description = d;
          sources.description = "heuristic";
        }
      }
      if (!location) {
        const l = qs(['[class*="address"]', '[class*="region"]']);
        if (l) { location = l; sources.location = "heuristic"; }
      }
    } catch {
      // Ignore heuristic fallback failures
    }
  }

  // Strip common heading prefixes from description
  if (description) {
    description = clean(
      description.replace(/^(About the job|Job Description|Description|Overview)\s*/i, "")
    );
  }

  return {
    title,
    company,
    description,
    location,
    salary,
    employmentType,
    sourceUrl: url,
    sources,
  };
}
