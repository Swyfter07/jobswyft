/**
 * BoardDetector Layer — Identifies the job board from the URL.
 *
 * Delegates to existing getJobBoard() from detection/job-detector.ts.
 * Sets ctx.board and ctx.trace.board. Site config is a placeholder (Story 2.4).
 */

import { getJobBoard } from "../../detection/job-detector";
import { recordLayerExecution } from "../create-context";
import type { ExtractionMiddleware } from "../types";

export const boardDetector: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "board-detector");

  const board = getJobBoard(ctx.url);
  ctx.board = board;
  ctx.trace.board = board;
  ctx.siteConfig = undefined; // Placeholder — full site config loading deferred to Story 2.4

  await next();
};
