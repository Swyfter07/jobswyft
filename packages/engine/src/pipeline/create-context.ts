/**
 * Pipeline Context Factory — Creates and maintains DetectionContext instances.
 *
 * Provides createDetectionContext() for initializing a zeroed pipeline context,
 * updateCompleteness() for recomputing weighted completeness after field writes,
 * and recordLayerExecution() for standardized trace recording.
 */

import { computeCompleteness } from "../scoring/extraction-validator";
import type {
  DetectionContext,
  FieldExtraction,
  LayerName,
  TraceAttempt,
} from "./types";

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

/**
 * Try to set a field on the context, respecting the field override rule:
 * only write if the field is not already set or the new confidence is higher.
 *
 * Pushes a TraceAttempt describing the outcome (accepted/rejected/empty).
 */
export function trySetField(
  ctx: DetectionContext,
  field: keyof DetectionContext["fields"],
  value: string | undefined,
  layer: LayerName,
  confidence: number,
  source: FieldExtraction["source"],
  attempts: TraceAttempt[]
): void {
  if (!value || value.trim().length === 0) {
    attempts.push({
      layer,
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

  if (existing && existing.confidence >= confidence) {
    attempts.push({
      layer,
      attempted: true,
      matched: true,
      field,
      rawValue: trimmed,
      accepted: false,
      rejectionReason: "higher-confidence-exists",
    });
    return;
  }

  ctx.fields[field] = { value: trimmed, source, confidence };
  attempts.push({
    layer,
    attempted: true,
    matched: true,
    field,
    rawValue: trimmed,
    cleanedValue: trimmed,
    accepted: true,
  });
}

/**
 * Record accepted field trace attempts into ctx.trace.fields.
 *
 * For each accepted attempt, either updates an existing FieldTrace entry
 * or creates a new one.
 */
export function recordFieldTraces(
  ctx: DetectionContext,
  attempts: TraceAttempt[],
  defaultSource: string
): void {
  for (const attempt of attempts) {
    if (attempt.accepted && attempt.field) {
      const existing = ctx.trace.fields.find((f) => f.field === attempt.field);
      if (existing) {
        existing.attempts.push(attempt);
        existing.finalValue = attempt.cleanedValue ?? "";
        existing.finalSource = defaultSource;
      } else {
        ctx.trace.fields.push({
          field: attempt.field,
          finalValue: attempt.cleanedValue ?? "",
          finalSource: defaultSource,
          attempts: [attempt],
        });
      }
    }
  }
}
