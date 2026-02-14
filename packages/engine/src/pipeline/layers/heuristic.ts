/**
 * Heuristic Layer — Pattern-match common heading structures for job data.
 *
 * Looks for h1/h2 near job keywords, expands <details> elements,
 * and extracts CSS-hidden content. Confidence: 0.30.
 *
 * Architecture reference: ADR-REV-SE2 (Confidence Scores Per Layer)
 */

import {
  addSignal,
  recordFieldTraces,
  recordLayerExecution,
  trySetField,
  updateCompleteness,
} from "../create-context";
import type {
  DetectionContext,
  ExtractionMiddleware,
  TraceAttempt,
} from "../types";

const HEURISTIC_CONFIDENCE = 0.30;

const JOB_TITLE_PATTERNS = [
  /job\s*title/i,
  /position/i,
  /role/i,
  /opening/i,
];

const COMPANY_PATTERNS = [
  /company/i,
  /employer/i,
  /organization/i,
  /hiring/i,
];

const LOCATION_PATTERNS = [
  /location/i,
  /where/i,
  /office/i,
  /remote/i,
];

function setField(
  ctx: DetectionContext,
  field: keyof DetectionContext["fields"],
  value: string | undefined,
  attempts: TraceAttempt[]
): void {
  trySetField(ctx, field, value, "heuristic", HEURISTIC_CONFIDENCE, "heuristic", attempts);

  // Also accumulate signal for later resolution
  if (value && value.trim().length > 0) {
    addSignal(ctx, field, {
      value: value.trim(),
      source: "heuristic",
      confidence: HEURISTIC_CONFIDENCE,
      layer: "heuristic",
    });
  }
}

function matchesPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function findHeadingValue(
  dom: Document,
  headingPatterns: RegExp[]
): string | undefined {
  const headings = dom.querySelectorAll("h1, h2, h3");
  for (const heading of Array.from(headings)) {
    const text = heading.textContent?.trim() ?? "";
    if (matchesPatterns(text, headingPatterns)) {
      // Look for sibling or child content after the heading
      const next = heading.nextElementSibling;
      if (next) {
        const content = next.textContent?.trim();
        if (content && content.length > 0 && content.length < 500) {
          return content;
        }
      }
    }
  }
  return undefined;
}

function extractFirstH1(dom: Document): string | undefined {
  const h1 = dom.querySelector("h1");
  const text = h1?.textContent?.trim();
  return text && text.length > 0 && text.length < 300 ? text : undefined;
}

function extractDescription(dom: Document): string | undefined {
  // Try main content areas
  const selectors = [
    "main",
    '[role="main"]',
    ".job-description",
    ".description",
    "#job-description",
    "article",
  ];

  for (const sel of selectors) {
    const el = dom.querySelector(sel);
    if (el) {
      const text = el.textContent?.trim();
      if (text && text.length > 50) {
        return text.slice(0, 5000); // Cap description length
      }
    }
  }

  // Expand <details> elements
  const details = dom.querySelectorAll("details");
  for (const d of Array.from(details)) {
    const text = d.textContent?.trim();
    if (text && text.length > 100) {
      return text.slice(0, 5000);
    }
  }

  return undefined;
}

export const heuristic: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "heuristic");

  const attempts: TraceAttempt[] = [];

  // Title: try first h1 on the page
  if (!ctx.fields.title) {
    const h1Title = extractFirstH1(ctx.dom);
    setField(ctx, "title", h1Title, attempts);
  }

  // Company: look for heading patterns
  const companyValue = findHeadingValue(ctx.dom, COMPANY_PATTERNS);
  setField(ctx, "company", companyValue, attempts);

  // Description: search main content areas
  const descValue = extractDescription(ctx.dom);
  setField(ctx, "description", descValue, attempts);

  // Location: look for heading patterns
  const locationValue = findHeadingValue(ctx.dom, LOCATION_PATTERNS);
  setField(ctx, "location", locationValue, attempts);

  recordFieldTraces(ctx, attempts, "heuristic");

  updateCompleteness(ctx);
  await next();
};
