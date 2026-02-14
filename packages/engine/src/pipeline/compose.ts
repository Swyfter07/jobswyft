/**
 * Koa-Style Compose — Onion-model middleware composition for the extraction pipeline.
 *
 * Each middleware receives (ctx, next). Calling next() delegates to the next middleware.
 * NOT calling next() short-circuits the chain (used by confidence gates).
 * Errors in a middleware are caught, logged to trace, and the pipeline continues.
 *
 * Architecture reference: ADR-REV-SE5 (Koa Middleware Pipeline)
 */

import type { DetectionContext, ExtractionMiddleware } from "./types";

/**
 * Compose an array of middleware into a single pipeline function.
 *
 * Returns a function that accepts a DetectionContext, runs all middleware
 * in onion-model order, records total execution time, and returns the
 * mutated context.
 */
export function compose(
  middlewares: ExtractionMiddleware[]
): (ctx: DetectionContext) => Promise<DetectionContext> {
  return async (ctx: DetectionContext): Promise<DetectionContext> => {
    const start = Date.now();

    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i >= middlewares.length) {
        return;
      }

      const middleware = middlewares[i];
      try {
        await middleware(ctx, () => dispatch(i + 1));
      } catch (err) {
        // Log error to trace and mark pipeline as degraded
        ctx.metadata.degraded = true;
        const errorMessage =
          err instanceof Error ? err.message : String(err);
        ctx.metadata.lastError = errorMessage;
        // Continue pipeline despite error
        await dispatch(i + 1);
      }
    }

    await dispatch(0);

    ctx.trace.totalTimeMs = Date.now() - start;
    ctx.trace.completeness = ctx.completeness;

    return ctx;
  };
}
