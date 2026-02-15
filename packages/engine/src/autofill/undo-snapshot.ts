/**
 * Undo Snapshot — Capture and restore form field values for autofill undo.
 *
 * The engine provides pure capture + restore functions.
 * Persistence and lifecycle management are extension adapter scope.
 *
 * Architecture reference: ADR-REV-AUTOFILL-FIX (Persistent undo, no timeout in engine)
 */

import type { FillInstruction, UndoEntry } from "../types/field-types";
import { setFieldValue, setSelectValue, setContentEditableValue } from "./native-setter";

/**
 * Capture current values of fields that are about to be filled.
 *
 * For each fill instruction, finds the element by selector and captures
 * its current value for later restore.
 */
export function captureUndoSnapshot(
  dom: Document,
  instructions: FillInstruction[],
): UndoEntry[] {
  const entries: UndoEntry[] = [];

  for (const instruction of instructions) {
    const el = dom.querySelector(instruction.selector);
    if (!el) continue;

    const previousValue = getElementValue(el);

    entries.push({
      stableId: instruction.stableId,
      selector: instruction.selector,
      previousValue,
      inputType: instruction.inputType,
    });
  }

  return entries;
}

/**
 * Execute undo — restore all captured previous values.
 *
 * For each undo entry, finds the element, restores the previous value
 * using the native setter pattern, and removes the data-jf-opid attribute.
 */
export function executeUndo(
  dom: Document,
  entries: UndoEntry[],
): { undone: number; failed: number } {
  let undone = 0;
  let failed = 0;

  for (const entry of entries) {
    const el = dom.querySelector(entry.selector);
    if (!el) {
      failed++;
      continue;
    }

    try {
      switch (entry.inputType) {
        case "select":
          setSelectValue(el as HTMLSelectElement, entry.previousValue);
          break;

        case "contenteditable":
          setContentEditableValue(el as HTMLElement, entry.previousValue);
          break;

        case "checkbox":
        case "radio":
          // For checkbox/radio, previousValue represents the checked state
          const input = el as HTMLInputElement;
          const wasChecked = entry.previousValue === "true" || entry.previousValue === "on";
          if (input.checked !== wasChecked) {
            input.click();
          }
          break;

        default:
          setFieldValue(
            el as HTMLInputElement | HTMLTextAreaElement,
            entry.previousValue,
          );
          break;
      }

      // Remove opid attribute
      el.removeAttribute("data-jf-opid");
      undone++;
    } catch {
      failed++;
    }
  }

  return { undone, failed };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getElementValue(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === "input") {
    const input = el as HTMLInputElement;
    if (input.type === "checkbox" || input.type === "radio") {
      return input.checked ? "true" : "false";
    }
    return input.value ?? "";
  }
  if (tag === "textarea") {
    return (el as HTMLTextAreaElement).value ?? "";
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
