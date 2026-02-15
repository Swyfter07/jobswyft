/**
 * @deprecated Logic moved to @jobswyft/engine pipeline.
 * Adapter: features/scanning/engine-scan-adapter.ts + scan-collector.ts
 * Content script: entrypoints/content-engine.content.ts
 *
 * Self-contained scraping function for chrome.scripting.executeScript().
 *
 * IMPORTANT: This function is serialized by Chrome and injected into the page.
 * It MUST NOT use any imports, closures, or external references.
 * All helpers are inlined within the function body.
 *
 * Extraction strategy (layered, each fills gaps from the previous):
 *   1. JSON-LD structured data (most reliable when present)
 *   2. Registry-driven CSS selectors (board-filtered + generic fallbacks)
 *   3. OpenGraph meta tags
 *   4. Generic fallbacks (document.title, meta description)
 *   5. Heuristic fallback (hidden content, extended selectors — READ ONLY, no DOM clicks)
 *
 * Returns job data + per-field extraction source + sourceSelectorIds for traceability.
 */
export function scrapeJobPage(
  board: string | null,
  registry: Array<{
    id: string;
    board: string;
    field: string;
    selectors: string[];
    priority: number;
    status: string;
  }>
) {
  const clean = (str: string | null | undefined): string =>
    str ? str.trim().replace(/\s+/g, " ") : "";

  /** Reject titles that are clearly page/section headings, not job titles */
  const isValidJobTitle = (t: string): boolean => {
    if (!t || t.length < 3 || t.length > 200) return false;
    const lower = t.toLowerCase();
    const badPatterns = [
      "top job picks", "job picks for you", "recommended for you",
      "jobs you might like", "search results", "people also viewed",
      "similar jobs", "more jobs", "sign in", "join now",
      "notification", "notifications", "messaging", "my network",
    ];
    return !badPatterns.some(p => lower.includes(p));
  };

  /** Strip leading notification count like "(3) " from titles */
  const stripNotificationPrefix = (t: string): string =>
    t.replace(/^\(\d+\)\s*/, "");

  /** Query a list of CSS selectors, return first non-empty text match */
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

  const url = window.location.href;

  let title = "";
  let company = "";
  let description = "";
  let location = "";
  let salary = "";
  let employmentType = "";

  // Per-field source tracking for confidence scoring
  const sources: Record<string, string> = {};
  // Per-field registry entry ID tracking for traceability
  const sourceSelectorIds: Record<string, string> = {};

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

  // ─── Layer 2: Registry-Driven CSS Selectors ────────────────────────
  // Filter registry: active entries for this board + generic fallbacks, sorted by priority
  const activeEntries = registry
    .filter(r => r.status !== "deprecated" && (r.board === board || r.board === "generic"))
    .sort((a, b) => a.priority - b.priority);

  // Field accessor helpers — map field name to getter/setter
  const getField = (field: string): string => {
    switch (field) {
      case "title": return title;
      case "company": return company;
      case "description": return description;
      case "location": return location;
      case "salary": return salary;
      case "employmentType": return employmentType;
      default: return "";
    }
  };

  const setField = (field: string, value: string): void => {
    switch (field) {
      case "title": title = value; break;
      case "company": company = value; break;
      case "description": description = value; break;
      case "location": location = value; break;
      case "salary": salary = value; break;
      case "employmentType": employmentType = value; break;
    }
  };

  for (const entry of activeEntries) {
    const currentValue = getField(entry.field);

    // Non-description fields: skip if already filled
    if (entry.field !== "description" && currentValue) continue;

    // Description: user selection override (highest priority)
    if (entry.field === "description" && !currentValue) {
      const selection = window.getSelection()?.toString() || "";
      if (selection.length > 50) {
        description = selection;
        sources.description = "user-edit";
        continue;
      }
    }

    const result = qs(entry.selectors);
    if (!result) continue;

    const sourceType = entry.board === "generic" ? "css-generic" : "css-board";

    // Field-specific validation
    if (entry.field === "title") {
      if (!isValidJobTitle(result)) continue;
      setField("title", stripNotificationPrefix(result));
      sources.title = sourceType;
      sourceSelectorIds.title = entry.id;
    } else if (entry.field === "salary") {
      // Salary must contain a currency symbol or formatted number
      if (!/[$€£¥]|\d{1,3}(,\d{3})/.test(result)) continue;
      setField("salary", result);
      sources.salary = sourceType;
      sourceSelectorIds.salary = entry.id;
    } else if (entry.field === "description") {
      if (result.length > (currentValue?.length || 0)) {
        setField("description", result);
        sources.description = sources.description || sourceType;
        sourceSelectorIds.description = entry.id;
      }
    } else {
      setField(entry.field, result);
      sources[entry.field] = sourceType;
      sourceSelectorIds[entry.field] = entry.id;
    }
  }

  // OG site_name fallback for company (not in registry — special case)
  if (!company) {
    const ogCompany = document
      .querySelector('meta[property="og:site_name"]')
      ?.getAttribute("content")
      ?.trim() || "";
    if (ogCompany) { company = ogCompany; sources.company = "og-meta"; }
  }

  // ─── Layer 3: OpenGraph Meta Tags ─────────────────────────────────
  if (!title) {
    let ogTitle = document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content")
      ?.trim() || "";
    ogTitle = stripNotificationPrefix(ogTitle);
    if (ogTitle && isValidJobTitle(ogTitle)) { title = ogTitle; sources.title = "og-meta"; }
  }

  // ─── Layer 4: Generic Fallbacks ───────────────────────────────────
  if (!title) {
    let docTitle = document.title.split(/[|\-–—]/).shift()?.trim() || "";
    docTitle = stripNotificationPrefix(docTitle);
    if (docTitle && isValidJobTitle(docTitle)) { title = docTitle; sources.title = "css-generic"; }
  }
  if (!description) {
    const metaDesc = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
      ?.trim() || "";
    if (metaDesc) { description = metaDesc; sources.description = "og-meta"; }
  }

  // ─── Layer 5: Heuristic Fallback (READ ONLY — no DOM clicks) ──────
  // Reads hidden content and tries extended selectors.
  // DOES NOT click "show more", expand <details>, or trigger [aria-expanded].
  if (!title || !company || !description || description.length < 50) {
    try {
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
    } catch {
      // Ignore heuristic fallback failures
    }
  }

  // ─── Detect "Show More" buttons (detection only, no clicking) ─────
  const showMoreSelectors = [
    ".show-more-less-html__button--more",
    'button[aria-label="Show full description"]',
    '[class*="show-more"]',
    '[class*="showMore"]',
    '[class*="read-more"]',
    '[class*="readMore"]',
    "details:not([open])",
  ];
  const hasShowMore = showMoreSelectors.some(sel => {
    try { return document.querySelector(sel) !== null; } catch { return false; }
  });

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
    sourceSelectorIds,
    hasShowMore,
  };
}
