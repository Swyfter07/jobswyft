/**
 * Field Detector — DOM scanning and operation ID assignment for autofill.
 *
 * Scans the DOM for form fields (input, textarea, select, contenteditable),
 * assigns unique operation IDs (opid), and collects field attributes for
 * downstream classification and mapping.
 *
 * Architecture references:
 * - ADR-REV-SE8 (Operation ID Addressing)
 * - PATTERN-SE10 (opid format: jf-field-{counter})
 */

import type { DetectedField } from "../types/field-types";
import { deepQueryFormFields } from "./shadow-dom-traversal";

const OPID_PREFIX = "jf-field-";
const MAX_FIELD_COUNT = 200;

/**
 * Detect all form fields on the page, assign operation IDs, and return
 * a DetectedField[] array with raw attribute data for classification.
 *
 * Steps:
 * 1. Walk DOM tree (including open shadow roots) for form elements
 * 2. Filter: input, textarea, select, [contenteditable]
 * 3. Assign opid via data-jf-opid attribute
 * 4. Collect attributes per field
 * 5. Enforce 200-field limit with priority filtering (visible > hidden, required > optional)
 *
 * @param dom - The Document to scan
 * @param options - Optional settings: maxFields, board
 * @returns DetectedField[] with raw data (fieldType defaults to "unknown", signals empty)
 */
export function detectFormFields(
  dom: Document,
  options?: { maxFields?: number; board?: string | null },
): DetectedField[] {
  const maxFields = options?.maxFields ?? MAX_FIELD_COUNT;
  const board = options?.board ?? null;

  // Collect all form elements including shadow DOM
  const allElements = deepQueryFormFields(dom);

  // Deduplicate (shadow DOM traversal may find elements already found by querySelectorAll)
  const seen = new Set<Element>();
  const uniqueElements: Element[] = [];
  for (const el of allElements) {
    if (!seen.has(el)) {
      seen.add(el);
      uniqueElements.push(el);
    }
  }

  // Build raw DetectedField entries
  const rawFields: Array<DetectedField & { _element: Element }> = [];
  let counter = 0;

  for (const el of uniqueElements) {
    const opid = `${OPID_PREFIX}${counter}`;
    el.setAttribute("data-jf-opid", opid);

    const isVisible = isElementVisible(el);
    const isDisabled = isElementDisabled(el);
    const isRequired = isElementRequired(el);
    const inputType = getInputType(el);
    const label = resolveLabel(el, dom);
    const currentValue = getCurrentValue(el);

    rawFields.push({
      stableId: opid,
      selector: `[data-jf-opid="${opid}"]`,
      label,
      fieldType: "unknown",
      confidence: 0,
      category: "custom",
      isRequired,
      isVisible,
      isDisabled,
      currentValue,
      inputType,
      signals: [],
      registryEntryId: null,
      board,
      frameId: 0,
      _element: el,
    });

    counter++;
  }

  // Apply 200-field limit with priority filtering
  if (rawFields.length > maxFields) {
    rawFields.sort((a, b) => {
      // Visible fields first
      if (a.isVisible !== b.isVisible) return a.isVisible ? -1 : 1;
      // Required fields first
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
      // Enabled fields first
      if (a.isDisabled !== b.isDisabled) return a.isDisabled ? 1 : -1;
      return 0;
    });
    rawFields.length = maxFields;
  }

  // Strip internal _element field and return clean DetectedField[]
  return rawFields.map(({ _element, ...field }) => field);
}

/**
 * Find a DOM element by its operation ID.
 *
 * @param dom - The Document to search
 * @param opid - The operation ID to look up
 * @returns The element, or null if not found (element removed from DOM)
 */
export function findFieldByOpid(
  dom: Document,
  opid: string,
): Element | null {
  return dom.querySelector(`[data-jf-opid="${cssEscape(opid)}"]`);
}

// ─── Selector Safety ────────────────────────────────────────────────────────

/** Escape a string for safe use inside a CSS attribute selector value. */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function isElementVisible(el: Element): boolean {
  const htmlEl = el as HTMLElement;
  if (htmlEl.hidden) return false;

  // Check inline style
  const style = htmlEl.style;
  if (style?.display === "none" || style?.visibility === "hidden") return false;

  // Check type="hidden" for inputs
  if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "hidden") return false;

  return true;
}

function isElementDisabled(el: Element): boolean {
  return (el as HTMLInputElement).disabled === true || el.hasAttribute("disabled");
}

function isElementRequired(el: Element): boolean {
  return (el as HTMLInputElement).required === true || el.hasAttribute("required");
}

function getInputType(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (tag === "select") return "select";
  if (el.hasAttribute("contenteditable")) return "contenteditable";
  if (tag === "input") {
    return (el.getAttribute("type") ?? "text").toLowerCase();
  }
  return tag;
}

function getCurrentValue(el: Element): string {
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

/**
 * Resolve a human-readable label for a form element.
 *
 * Resolution order (ADR-REV-SE8):
 * 1. <label for="id"> text
 * 2. aria-label attribute
 * 3. aria-labelledby reference
 * 4. placeholder attribute
 * 5. Closest <label> ancestor
 * 6. Sibling text (adjacent label-like element)
 * 7. Heading context (nearest h1-h6 above)
 */
function resolveLabel(el: Element, dom: Document): string {
  // 1. <label for="id">
  const id = el.getAttribute("id");
  if (id) {
    const label = dom.querySelector(`label[for="${cssEscape(id)}"]`);
    if (label) {
      const text = label.textContent?.trim();
      if (text) return text;
    }
  }

  // 2. aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();

  // 3. aria-labelledby
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const parts: string[] = [];
    for (const refId of labelledBy.split(/\s+/)) {
      const refEl = dom.getElementById(refId);
      if (refEl?.textContent?.trim()) {
        parts.push(refEl.textContent.trim());
      }
    }
    if (parts.length > 0) return parts.join(" ");
  }

  // 4. placeholder
  const placeholder = el.getAttribute("placeholder");
  if (placeholder?.trim()) return placeholder.trim();

  // 5. Closest <label> ancestor
  const parentLabel = el.closest("label");
  if (parentLabel) {
    const text = parentLabel.textContent?.trim();
    if (text) return text;
  }

  // 6. Sibling text — look for adjacent label-like text
  const prev = el.previousElementSibling;
  if (prev && (prev.tagName === "LABEL" || prev.tagName === "SPAN" || prev.tagName === "DIV")) {
    const text = prev.textContent?.trim();
    if (text && text.length < 100) return text;
  }

  // 7. Heading context — nearest h1-h6 in parent hierarchy
  let parent = el.parentElement;
  while (parent) {
    const heading = parent.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) {
      const text = heading.textContent?.trim();
      if (text) return text;
    }
    parent = parent.parentElement;
  }

  // Fallback: name or id attribute
  const name = el.getAttribute("name");
  if (name) return name;
  if (id) return id;

  return "";
}
