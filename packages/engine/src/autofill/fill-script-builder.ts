/**
 * Fill Script Builder — Generates and executes fill instructions from mapped fields.
 *
 * Converts MappedField[] into FillInstruction[], then executes them on the DOM
 * using the native setter pattern (PATTERN-SE9).
 */

import type {
  MappedField,
  FillInstruction,
  FieldFillResult,
  FillResult,
} from "../types/field-types";
import {
  setFieldValue,
  setSelectValue,
  setCheckboxValue,
  setRadioValue,
  setContentEditableValue,
} from "./native-setter";

/**
 * Build fill instructions from mapped fields.
 *
 * Filters to fields with status "ready" and a non-null mappedValue.
 * Skips file inputs (resume upload handled by extension adapter).
 * Orders: visible required fields first.
 */
export function buildFillInstructions(
  mappedFields: MappedField[],
): FillInstruction[] {
  const instructions: FillInstruction[] = [];

  for (const field of mappedFields) {
    if (field.status !== "ready" || field.mappedValue === null) continue;

    // Skip file inputs — extension adapter scope
    if (field.inputType === "file") continue;

    instructions.push({
      selector: field.selector,
      value: field.mappedValue,
      inputType: field.inputType,
      stableId: field.stableId,
    });
  }

  // Sort: visible required first (pre-build lookup map for O(1) access)
  const fieldMap = new Map(mappedFields.map((f) => [f.stableId, f]));
  instructions.sort((a, b) => {
    const fieldA = fieldMap.get(a.stableId);
    const fieldB = fieldMap.get(b.stableId);
    if (!fieldA || !fieldB) return 0;

    if (fieldA.isVisible !== fieldB.isVisible) return fieldA.isVisible ? -1 : 1;
    if (fieldA.isRequired !== fieldB.isRequired) return fieldA.isRequired ? -1 : 1;
    return 0;
  });

  return instructions;
}

/**
 * Execute a single fill instruction on the DOM.
 *
 * Finds the element by selector (opid-based), determines fill strategy
 * by element type, and uses native setter pattern.
 */
export function executeFillInstruction(
  dom: Document,
  instruction: FillInstruction,
): FieldFillResult {
  const el = dom.querySelector(instruction.selector);

  if (!el) {
    return {
      stableId: instruction.stableId,
      selector: instruction.selector,
      success: false,
      previousValue: "",
      error: "Element not found",
    };
  }

  const previousValue = getPreviousValue(el);

  try {
    switch (instruction.inputType) {
      case "select":
        const matched = setSelectValue(el as HTMLSelectElement, instruction.value);
        if (!matched) {
          return {
            stableId: instruction.stableId,
            selector: instruction.selector,
            success: false,
            previousValue,
            error: `No matching option for value "${instruction.value}"`,
          };
        }
        break;

      case "checkbox":
        setCheckboxValue(el as HTMLInputElement, instruction.value);
        break;

      case "radio":
        setRadioValue(el as HTMLInputElement, instruction.value);
        break;

      case "contenteditable":
        setContentEditableValue(el as HTMLElement, instruction.value);
        break;

      case "file":
        // File inputs are extension adapter scope — skip
        return {
          stableId: instruction.stableId,
          selector: instruction.selector,
          success: false,
          previousValue,
          error: "File inputs require extension adapter",
        };

      default:
        // text, email, tel, url, number, date, textarea, etc.
        setFieldValue(el as HTMLInputElement | HTMLTextAreaElement, instruction.value);
        break;
    }

    return {
      stableId: instruction.stableId,
      selector: instruction.selector,
      success: true,
      previousValue,
      error: null,
    };
  } catch (err) {
    return {
      stableId: instruction.stableId,
      selector: instruction.selector,
      success: false,
      previousValue,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Execute all fill instructions sequentially on the DOM.
 *
 * @returns FillResult with filled/failed counts, per-field results, and duration
 */
export function executeFillInstructions(
  dom: Document,
  instructions: FillInstruction[],
): FillResult {
  const start = performance.now();
  const results: FieldFillResult[] = [];
  let filled = 0;
  let failed = 0;

  for (const instruction of instructions) {
    const result = executeFillInstruction(dom, instruction);
    results.push(result);
    if (result.success) {
      filled++;
    } else {
      failed++;
    }
  }

  return {
    filled,
    failed,
    results,
    durationMs: Math.round(performance.now() - start),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPreviousValue(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") {
    return (el as HTMLInputElement).value ?? "";
  }
  if (tag === "select") {
    const select = el as HTMLSelectElement;
    return select.options[select.selectedIndex]?.value ?? "";
  }
  if (el.hasAttribute("contenteditable")) {
    return el.textContent ?? "";
  }
  return "";
}
