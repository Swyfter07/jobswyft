/**
 * Heuristic Repair — Last-resort selector repair strategies.
 *
 * When all CSS selectors fail for a field, attempts to recover data using:
 * (a) Sibling/Parent Traversal — walk DOM from known containers
 * (b) Attribute Discovery — search for data-*, aria-label, itemprop attributes
 * (c) Class Name Fuzzy Match — Levenshtein distance < 3 on class names
 *
 * Architecture reference: ADR-REV-SE3 (Self-Healing Selectors)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RepairResult {
  value: string;
  repairedSelector: string;
  confidence: number;
  strategy: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REPAIR_CONFIDENCE = 0.40;

const FIELD_KEYWORDS: Record<string, string[]> = {
  title: ["title", "job-title", "jobtitle", "position", "role", "heading"],
  company: ["company", "employer", "organization", "hiring", "org"],
  description: ["description", "job-description", "details", "about", "overview"],
  location: ["location", "address", "city", "where", "office", "remote"],
  salary: ["salary", "compensation", "pay", "wage", "range"],
  employmentType: ["employment", "type", "contract", "full-time", "part-time"],
};

// ─── Levenshtein Distance ───────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix: number[][] = [];
  for (let i = 0; i <= aLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[aLen][bLen];
}

// ─── Repair Strategies ──────────────────────────────────────────────────────

/**
 * Strategy A: Sibling/Parent Traversal
 * Look for elements with similar structure/classes within the same container.
 */
function trySiblingParentTraversal(
  dom: Document,
  field: string
): RepairResult | null {
  const keywords = FIELD_KEYWORDS[field];
  if (!keywords) return null;

  // Look for containers commonly used in job listings
  const containers = dom.querySelectorAll(
    "section, article, div[class*='job'], div[class*='posting'], div[class*='details'], main"
  );

  for (const container of Array.from(containers)) {
    // Search headings within container
    const headings = container.querySelectorAll("h1, h2, h3, h4");
    for (const heading of Array.from(headings)) {
      const headingText = heading.textContent?.toLowerCase() ?? "";
      const matchesKeyword = keywords.some((kw) => headingText.includes(kw));
      if (!matchesKeyword) continue;

      // Found a heading matching our field keywords — get sibling content
      const sibling = heading.nextElementSibling;
      if (sibling) {
        const value = sibling.textContent?.trim();
        if (value && value.length > 0 && value.length < 2000) {
          // Build a selector for the repair
          const tag = sibling.tagName.toLowerCase();
          const classStr = sibling.getAttribute("class") ?? "";
          const cls = classStr
            ? `.${classStr.split(/\s+/).filter(Boolean).join(".")}`
            : "";
          const selector = cls ? `${tag}${cls}` : tag;

          return {
            value,
            repairedSelector: selector,
            confidence: REPAIR_CONFIDENCE,
            strategy: "sibling-parent-traversal",
          };
        }
      }
    }
  }

  return null;
}

/**
 * Strategy B: Attribute Discovery
 * Search for data-*, aria-label, itemprop attributes containing field keywords.
 */
function tryAttributeDiscovery(
  dom: Document,
  field: string
): RepairResult | null {
  const keywords = FIELD_KEYWORDS[field];
  if (!keywords) return null;

  for (const keyword of keywords) {
    // Try data-* attributes
    const dataSelectors = [
      `[data-testid*="${keyword}"]`,
      `[data-automation-id*="${keyword}"]`,
      `[data-field*="${keyword}"]`,
      `[data-qa*="${keyword}"]`,
    ];

    for (const selector of dataSelectors) {
      try {
        const el = dom.querySelector(selector);
        if (el) {
          const value = el.textContent?.trim();
          if (value && value.length > 0 && value.length < 2000) {
            return {
              value,
              repairedSelector: selector,
              confidence: REPAIR_CONFIDENCE,
              strategy: "attribute-discovery",
            };
          }
        }
      } catch {
        continue;
      }
    }

    // Try aria-label
    try {
      const ariaEl = dom.querySelector(`[aria-label*="${keyword}" i]`);
      if (ariaEl) {
        const value = ariaEl.textContent?.trim();
        if (value && value.length > 0 && value.length < 2000) {
          return {
            value,
            repairedSelector: `[aria-label*="${keyword}" i]`,
            confidence: REPAIR_CONFIDENCE,
            strategy: "attribute-discovery",
          };
        }
      }
    } catch {
      // Selector not supported in some environments
    }

    // Try itemprop
    try {
      const itemEl = dom.querySelector(`[itemprop*="${keyword}"]`);
      if (itemEl) {
        const value = itemEl.textContent?.trim();
        if (value && value.length > 0 && value.length < 2000) {
          return {
            value,
            repairedSelector: `[itemprop*="${keyword}"]`,
            confidence: REPAIR_CONFIDENCE,
            strategy: "attribute-discovery",
          };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Strategy C: Class Name Fuzzy Match
 * Find elements with class names similar to expected patterns (Levenshtein < 3).
 */
function tryClassNameFuzzyMatch(
  dom: Document,
  field: string
): RepairResult | null {
  const keywords = FIELD_KEYWORDS[field];
  if (!keywords) return null;

  // Get all elements with class names
  const allElements = dom.querySelectorAll("[class]");

  for (const el of Array.from(allElements)) {
    const classAttr = el.getAttribute("class") ?? "";
    const classes = classAttr.split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      const clsLower = cls.toLowerCase();
      for (const keyword of keywords) {
        // Check exact containment first (faster)
        if (clsLower.includes(keyword)) {
          const value = el.textContent?.trim();
          if (value && value.length > 0 && value.length < 2000) {
            return {
              value,
              repairedSelector: `.${cls}`,
              confidence: REPAIR_CONFIDENCE,
              strategy: "class-fuzzy-match",
            };
          }
        }

        // Levenshtein distance on class name segments
        // Split by common separators
        const segments = clsLower.split(/[-_]/);
        for (const seg of segments) {
          if (seg.length >= 3 && levenshtein(seg, keyword) < 3) {
            const value = el.textContent?.trim();
            if (value && value.length > 0 && value.length < 2000) {
              return {
                value,
                repairedSelector: `.${cls}`,
                confidence: REPAIR_CONFIDENCE,
                strategy: "class-fuzzy-match",
              };
            }
          }
        }
      }
    }
  }

  return null;
}

// ─── Main Repair Function ───────────────────────────────────────────────────

/**
 * Attempt to repair a failed selector for a given field.
 *
 * Tries three strategies in order:
 * 1. Sibling/Parent Traversal
 * 2. Attribute Discovery
 * 3. Class Name Fuzzy Match
 *
 * Returns the first successful repair result, or null if all fail.
 */
export function attemptHeuristicRepair(
  dom: Document,
  field: string,
  _board: string | null
): RepairResult | null {
  // Strategy A: Sibling/Parent Traversal
  const siblingResult = trySiblingParentTraversal(dom, field);
  if (siblingResult) return siblingResult;

  // Strategy B: Attribute Discovery
  const attrResult = tryAttributeDiscovery(dom, field);
  if (attrResult) return attrResult;

  // Strategy C: Class Name Fuzzy Match
  const fuzzyResult = tryClassNameFuzzyMatch(dom, field);
  if (fuzzyResult) return fuzzyResult;

  return null;
}
