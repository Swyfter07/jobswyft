/**
 * AI Fallback Layer — Stub for Story 2.2.
 *
 * Sets ctx.trace.aiTriggered = true, records a trace attempt as not-implemented,
 * and calls next(). Does NOT call any external API.
 *
 * Real AI implementation deferred to a later story.
 */

import { recordLayerExecution } from "../create-context";
import type { ExtractionMiddleware } from "../types";

export const aiFallback: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "ai-fallback");

  ctx.trace.aiTriggered = true;

  ctx.trace.fields.push({
    field: "ai-fallback",
    finalValue: "",
    finalSource: "ai-fallback",
    attempts: [
      {
        layer: "ai-fallback",
        attempted: true,
        matched: false,
        accepted: false,
        rejectionReason: "stub-not-implemented",
      },
    ],
  });

  await next();
};
