/**
 * Pipeline Context Factory — Creates and maintains DetectionContext instances.
 *
 * Provides createDetectionContext() for initializing a zeroed pipeline context,
 * updateCompleteness() for recomputing weighted completeness after field writes,
 * and recordLayerExecution() for standardized trace recording.
 */

import { computeCompleteness } from "../scoring/extraction-validator";
import type { DetectionContext, LayerName } from "./types";

/**
 * Create a fresh DetectionContext with zeroed fields and initialized trace.
 */
export function createDetectionContext(
  url: string,
  dom: Document
): DetectionContext {
  return {
    url,
    dom,
    board: null,
    fields: {},
    completeness: 0,
    trace: {
      fields: [],
      board: null,
      url,
      timestamp: Date.now(),
      totalTimeMs: 0,
      layersExecuted: [],
      gateDecisions: [],
      aiTriggered: false,
      completeness: 0,
    },
    metadata: {},
  };
}

/**
 * Recompute ctx.completeness from ctx.fields using weighted average.
 *
 * Must be called after any layer writes to ctx.fields — without this,
 * confidence gates always see completeness = 0 and never short-circuit.
 */
export function updateCompleteness(ctx: DetectionContext): void {
  const data: Record<string, string | undefined> = {};
  const confidenceMap: Record<string, number> = {};
  for (const [field, extraction] of Object.entries(ctx.fields)) {
    if (extraction) {
      data[field] = extraction.value;
      confidenceMap[field] = extraction.confidence;
    }
  }
  ctx.completeness = computeCompleteness(data, confidenceMap);
}

/**
 * Record that a layer executed in the pipeline trace.
 */
export function recordLayerExecution(
  ctx: DetectionContext,
  layer: LayerName
): void {
  ctx.trace.layersExecuted.push(layer);
}
