/**
 * Signal weight configuration and confidence computation for the autofill detection engine.
 *
 * Modeled on Chromium's autofill heuristics: each signal type has a base weight,
 * and multiple corroborating signals boost confidence via diminishing returns.
 */

import type { SignalType, SignalEvaluation, AutofillFieldType } from "../types/field-types";

// ─── Signal Weights ───────────────────────────────────────────────────────────

export const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  "autocomplete": 0.95,
  "name-id-regex": 0.85,
  "board-selector": 0.85,
  "input-type": 0.80,
  "label-for": 0.75,
  "aria-label": 0.75,
  "parent-label": 0.70,
  "placeholder": 0.65,
  "sibling-text": 0.50,
  "css-data-attr": 0.50,
  "heading-context": 0.40,
  "section-context": 0.30,
};

// ─── Shared Diminishing Returns Algorithm ────────────────────────────────────

/**
 * Compute a combined confidence score from a pre-sorted (descending) array of weights.
 *
 * Algorithm: base = first (highest) weight, then diminishing bonuses for each
 * additional corroborating weight. Capped at 0.99.
 *
 * Shared by both autofill signal computation (SignalEvaluation[]) and
 * extraction signal combination (ExtractionSignal[]).
 */
export function computeDiminishingScore(sortedWeights: number[]): number {
  if (sortedWeights.length === 0) return 0;

  // Base = highest weight signal
  let confidence = sortedWeights[0];

  // Diminishing bonus for each additional corroborating signal
  for (let i = 1; i < sortedWeights.length; i++) {
    const bonus = sortedWeights[i] * 0.1 * Math.pow(0.5, i - 1);
    confidence += bonus;
  }

  return Math.min(confidence, 0.99);
}

// ─── Confidence Computation ───────────────────────────────────────────────────

/**
 * Compute overall confidence from matched signals.
 * Uses highest matching signal as base + diminishing bonuses for corroborating signals.
 * Capped at 0.99.
 */
export function computeFieldConfidence(signals: SignalEvaluation[]): number {
  const matched = signals
    .filter((s) => s.matched)
    .sort((a, b) => b.weight - a.weight);

  if (matched.length === 0) return 0;

  return computeDiminishingScore(matched.map((s) => s.weight));
}

// ─── Field Type Resolution ────────────────────────────────────────────────────

/**
 * Resolve the field type via weighted voting.
 * Each matched signal votes for its suggested type, weighted by signal confidence.
 * Highest total weight wins.
 */
export function resolveFieldType(
  signals: SignalEvaluation[]
): { fieldType: AutofillFieldType; confidence: number } {
  const matched = signals.filter((s) => s.matched);

  if (matched.length === 0) {
    return { fieldType: "unknown", confidence: 0 };
  }

  // Tally votes per suggested type
  const votes = new Map<AutofillFieldType, number>();
  for (const signal of matched) {
    const current = votes.get(signal.suggestedType) ?? 0;
    votes.set(signal.suggestedType, current + signal.weight);
  }

  // Find the type with the highest vote total
  let bestType: AutofillFieldType = "unknown";
  let bestScore = 0;
  for (const [type, score] of votes) {
    if (score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }

  const confidence = computeFieldConfidence(
    matched.filter((s) => s.suggestedType === bestType)
  );

  return { fieldType: bestType, confidence };
}
