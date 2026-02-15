/**
 * BoardDetector Layer — Identifies the job board from the URL.
 *
 * Delegates to existing getJobBoard() from detection/job-detector.ts.
 * Sets ctx.board and ctx.trace.board. Populates ctx.siteConfig from
 * the board registry when available (Story 2.4).
 */

import { getJobBoard } from "../../detection/job-detector";
import { recordLayerExecution } from "../create-context";
import type { ExtractionMiddleware } from "../types";

export const boardDetector: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "board-detector");

  const board = getJobBoard(ctx.url);
  ctx.board = board;
  ctx.trace.board = board;

  // Story 2.4: Load site config from board registry
  // Only use registry when ctx.siteConfig is not already set (explicit override takes precedence)
  if (ctx.boardRegistry && !ctx.siteConfig) {
    ctx.siteConfig = ctx.boardRegistry.getConfig(ctx.url);
  }

  await next();
};
