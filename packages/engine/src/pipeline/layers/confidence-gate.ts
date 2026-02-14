/**
 * Confidence Gate — Inline short-circuit middleware for the extraction pipeline.
 *
 * When ctx.completeness >= threshold, skips remaining layers (does not call next()).
 * Records gate decision in ctx.trace.gateDecisions.
 *
 * Architecture reference: ADR-REV-SE5 (Confidence Gates)
 */

import type { ExtractionMiddleware } from "../types";

/**
 * Create a confidence gate middleware that short-circuits when
 * ctx.completeness meets or exceeds the given threshold.
 */
export function createConfidenceGate(
  threshold: number
): ExtractionMiddleware {
  return async (ctx, next) => {
    const action =
      ctx.completeness >= threshold ? "short-circuit" : "continue";

    ctx.trace.gateDecisions.push({
      gate: threshold,
      completeness: ctx.completeness,
      action,
    });

    if (action === "continue") {
      await next();
    }
    // short-circuit: do NOT call next()
  };
}
