/**
 * Confidence Scorer — Multi-signal confidence combiner for extraction signals.
 *
 * Combines multiple extraction signals for the same field using a
 * diminishing-returns algorithm. Corroborating signals (same value) boost
 * confidence; disagreeing signals keep the highest.
 *
 * Architecture reference: ADR-REV-SE2 (Weighted Multi-Signal Combination)
 */

import type { ExtractionSource } from "./extraction-validator";
import { computeDiminishingScore } from "./signal-weights";
import type { ExtractionSignal } from "../pipeline/types";

/**
 * Combine multiple extraction signals for a single field into a resolved value
 * with combined confidence.
 *
 * Algorithm:
 * 1. Group signals by value (exact match)
 * 2. For the group with the highest aggregate confidence:
 *    - Base = highest confidence signal in the group
 *    - Bonus = diminishing returns from corroborating signals
 *    - Cap at 0.99
 * 3. Return value + combined confidence + source of the BASE signal
 */
export function combineSignals(
  signals: ExtractionSignal[]
): { value: string; confidence: number; source: ExtractionSource } | null {
  if (signals.length === 0) return null;

  if (signals.length === 1) {
    return {
      value: signals[0].value,
      confidence: signals[0].confidence,
      source: signals[0].source,
    };
  }

  // Group by normalized value (trimmed, lowercase for comparison, original for output)
  const groups = new Map<string, ExtractionSignal[]>();
  for (const signal of signals) {
    const key = signal.value.trim().toLowerCase();
    const group = groups.get(key) ?? [];
    group.push(signal);
    groups.set(key, group);
  }

  // Find the best group: sort each group's signals by confidence desc,
  // then pick the group with the highest combined score
  let bestGroup: ExtractionSignal[] | null = null;
  let bestScore = -1;

  for (const [, group] of groups) {
    group.sort((a, b) => b.confidence - a.confidence);
    const sortedWeights = group.map((s) => s.confidence);
    const score = computeDiminishingScore(sortedWeights);
    if (score > bestScore) {
      bestScore = score;
      bestGroup = group;
    }
  }

  if (!bestGroup || bestGroup.length === 0) return null;

  // The source is from the highest-confidence "base" signal
  const baseSignal = bestGroup[0];

  return {
    value: baseSignal.value.trim(),
    confidence: bestScore,
    source: baseSignal.source,
  };
}
