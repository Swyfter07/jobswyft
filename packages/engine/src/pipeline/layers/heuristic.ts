/**
 * Heuristic Layer — Pattern-match common heading structures for job data.
 *
 * Looks for h1/h2 near job keywords, expands <details> elements,
 * and extracts CSS-hidden content. Confidence: 0.30.
 *
 * Architecture reference: ADR-REV-SE2 (Confidence Scores Per Layer)
 */

import { recordLayerExecution, updateCompleteness } from "../create-context";
import type {
  DetectionContext,
  ExtractionMiddleware,
  FieldExtraction,
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

function trySetField(
  ctx: DetectionContext,
  field: keyof DetectionContext["fields"],
  value: string | undefined,
  attempts: TraceAttempt[]
): void {
  if (!value || value.trim().length === 0) {
    attempts.push({
      layer: "heuristic",
      attempted: true,
      matched: false,
      field,
      accepted: false,
      rejectionReason: "empty-value",
    });
    return;
  }

  const trimmed = value.trim();
  const existing = ctx.fields[field];

  if (existing && existing.confidence >= HEURISTIC_CONFIDENCE) {
    attempts.push({
      layer: "heuristic",
      attempted: true,
      matched: true,
      field,
      rawValue: trimmed,
      accepted: false,
      rejectionReason: "higher-confidence-exists",
    });
    return;
  }

  const extraction: FieldExtraction = {
    value: trimmed,
    source: "heuristic",
    confidence: HEURISTIC_CONFIDENCE,
  };

  ctx.fields[field] = extraction;
  attempts.push({
    layer: "heuristic",
    attempted: true,
    matched: true,
    field,
    rawValue: trimmed,
    cleanedValue: trimmed,
    accepted: true,
  });
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
    trySetField(ctx, "title", h1Title, attempts);
  }

  // Company: look for heading patterns
  const companyValue = findHeadingValue(ctx.dom, COMPANY_PATTERNS);
  trySetField(ctx, "company", companyValue, attempts);

  // Description: search main content areas
  const descValue = extractDescription(ctx.dom);
  trySetField(ctx, "description", descValue, attempts);

  // Location: look for heading patterns
  const locationValue = findHeadingValue(ctx.dom, LOCATION_PATTERNS);
  trySetField(ctx, "location", locationValue, attempts);

  // Record traces
  for (const attempt of attempts) {
    if (attempt.accepted && attempt.field) {
      const existing = ctx.trace.fields.find((f) => f.field === attempt.field);
      if (existing) {
        existing.attempts.push(attempt);
        existing.finalValue = attempt.cleanedValue ?? "";
        existing.finalSource = "heuristic";
      } else {
        ctx.trace.fields.push({
          field: attempt.field,
          finalValue: attempt.cleanedValue ?? "",
          finalSource: "heuristic",
          attempts: [attempt],
        });
      }
    }
  }

  updateCompleteness(ctx);
  await next();
};
