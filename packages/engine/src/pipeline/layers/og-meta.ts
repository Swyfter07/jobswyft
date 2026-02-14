/**
 * OG Meta Layer — Extracts job data from Open Graph meta tags.
 *
 * Extracts og:title and og:description from <meta property="og:*"> tags.
 * Confidence: 0.40 (low priority, fallback data source).
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

const OG_CONFIDENCE = 0.40;

function trySetField(
  ctx: DetectionContext,
  field: keyof DetectionContext["fields"],
  value: string | undefined,
  attempts: TraceAttempt[]
): void {
  if (!value || value.trim().length === 0) {
    attempts.push({
      layer: "og-meta",
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

  if (existing && existing.confidence >= OG_CONFIDENCE) {
    attempts.push({
      layer: "og-meta",
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
    source: "og-meta",
    confidence: OG_CONFIDENCE,
  };

  ctx.fields[field] = extraction;
  attempts.push({
    layer: "og-meta",
    attempted: true,
    matched: true,
    field,
    rawValue: trimmed,
    cleanedValue: trimmed,
    accepted: true,
  });
}

export const ogMeta: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "og-meta");

  const attempts: TraceAttempt[] = [];

  // Extract og:title
  const ogTitle = ctx.dom
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  trySetField(ctx, "title", ogTitle ?? undefined, attempts);

  // Extract og:description
  const ogDesc = ctx.dom
    .querySelector('meta[property="og:description"]')
    ?.getAttribute("content");
  trySetField(ctx, "description", ogDesc ?? undefined, attempts);

  // Record traces
  for (const attempt of attempts) {
    if (attempt.accepted && attempt.field) {
      const existing = ctx.trace.fields.find((f) => f.field === attempt.field);
      if (existing) {
        existing.attempts.push(attempt);
        existing.finalValue = attempt.cleanedValue ?? "";
        existing.finalSource = "og-meta";
      } else {
        ctx.trace.fields.push({
          field: attempt.field,
          finalValue: attempt.cleanedValue ?? "",
          finalSource: "og-meta",
          attempts: [attempt],
        });
      }
    }
  }

  updateCompleteness(ctx);
  await next();
};
