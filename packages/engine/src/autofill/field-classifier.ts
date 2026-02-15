/**
 * Field Classifier — Three-tier classification system for detected form fields.
 *
 * Classification tiers:
 * 1. Known (compile-time): autocomplete attr, exact name/id match → high confidence
 * 2. Inferrable (runtime): label/placeholder fuzzy match → medium confidence
 * 3. Unknown (fallback): → customQuestion with low confidence
 *
 * Reuses resolveFieldType() and computeFieldConfidence() from scoring/signal-weights.ts
 */

import type {
  DetectedField,
  AutofillFieldType,
  FieldCategory,
} from "../types/field-types";
import { getFieldCategory } from "../types/field-types";
import { resolveFieldType } from "../scoring/signal-weights";
import { evaluateAllSignals } from "./signal-evaluators";

/**
 * Classify a single field using its pre-computed signals.
 *
 * @param field - Partial DetectedField with inputType, label, and signals
 * @param options - Optional board context
 * @returns Classification result with fieldType, confidence, and category
 */
export function classifyField(
  field: Pick<DetectedField, "inputType" | "label" | "signals">,
): { fieldType: AutofillFieldType; confidence: number; category: FieldCategory } {
  const signals = field.signals;

  if (signals.length === 0) {
    return { fieldType: "unknown", confidence: 0, category: "custom" };
  }

  const { fieldType, confidence } = resolveFieldType(signals);
  const category = getFieldCategory(fieldType);

  return { fieldType, confidence, category };
}

/**
 * Classify all detected fields by evaluating signals and resolving field types.
 *
 * For each field, evaluates all signal types against the DOM element, then
 * uses weighted voting to determine the field type and confidence.
 *
 * @param fields - Array of DetectedFields from field-detector
 * @param dom - The Document (needed for label-for signal evaluation)
 * @param options - Optional board context
 * @returns Updated DetectedField[] with fieldType, confidence, category, and signals populated
 */
export function classifyFields(
  fields: DetectedField[],
  dom: Document,
  options?: { board?: string | null },
): DetectedField[] {
  const board = options?.board ?? null;

  return fields.map((field) => {
    // Find the DOM element for this field to evaluate signals
    const el = dom.querySelector(field.selector);
    if (!el) {
      return { ...field, fieldType: "unknown" as const, confidence: 0, category: "custom" as const };
    }

    // Evaluate all signals for this element
    const signals = evaluateAllSignals(el, dom, board);

    // Resolve field type via weighted voting
    const { fieldType, confidence } = resolveFieldType(signals);
    const category = getFieldCategory(fieldType);

    return {
      ...field,
      fieldType,
      confidence,
      category,
      signals,
    };
  });
}
