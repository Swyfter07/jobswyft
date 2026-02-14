/**
 * Default Pipeline — Assembles the standard extraction pipeline.
 *
 * Layer order: BoardDetector -> JsonLd -> Gate(0.85) -> CssSelector ->
 * Gate(0.75) -> OgMeta -> Heuristic -> Gate(0.70) -> AiFallback -> PostProcess
 *
 * Architecture reference: ADR-REV-SE5 (Pipeline Ordering)
 */

import { compose } from "./compose";
import {
  boardDetector,
  jsonLd,
  createConfidenceGate,
  cssSelector,
  ogMeta,
  heuristic,
  aiFallback,
  postProcess,
} from "./layers/index";
import type { DetectionContext } from "./types";

/**
 * Create the default extraction pipeline with all layers and confidence gates.
 */
export function createDefaultPipeline(): (
  ctx: DetectionContext
) => Promise<DetectionContext> {
  return compose([
    boardDetector,
    jsonLd,
    createConfidenceGate(0.85),
    cssSelector,
    createConfidenceGate(0.75),
    ogMeta,
    heuristic,
    createConfidenceGate(0.70),
    aiFallback,
    postProcess,
  ]);
}
