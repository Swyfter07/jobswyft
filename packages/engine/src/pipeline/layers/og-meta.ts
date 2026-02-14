/**
 * OG Meta Layer — Extracts job data from Open Graph meta tags.
 *
 * Extracts og:title and og:description from <meta property="og:*"> tags.
 * Confidence: 0.40 (low priority, fallback data source).
 *
 * Architecture reference: ADR-REV-SE2 (Confidence Scores Per Layer)
 */

import {
  recordFieldTraces,
  recordLayerExecution,
  trySetField,
  updateCompleteness,
} from "../create-context";
import type { ExtractionMiddleware, TraceAttempt } from "../types";

const OG_CONFIDENCE = 0.40;

export const ogMeta: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "og-meta");

  const attempts: TraceAttempt[] = [];

  // Extract og:title
  const ogTitle = ctx.dom
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  trySetField(ctx, "title", ogTitle ?? undefined, "og-meta", OG_CONFIDENCE, "og-meta", attempts);

  // Extract og:description
  const ogDesc = ctx.dom
    .querySelector('meta[property="og:description"]')
    ?.getAttribute("content");
  trySetField(ctx, "description", ogDesc ?? undefined, "og-meta", OG_CONFIDENCE, "og-meta", attempts);

  recordFieldTraces(ctx, attempts, "og-meta");

  updateCompleteness(ctx);
  await next();
};
