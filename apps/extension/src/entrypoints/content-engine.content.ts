/**
 * Content Engine Script — WXT content script for engine bridge operations.
 *
 * Runs in ISOLATED world in every matching frame. Handles autofill operations
 * by dynamically importing @jobswyft/engine modules on first use.
 *
 * Messages handled:
 * - autofill.detect  → detectFormFields + classifyFields
 * - autofill.fill    → captureUndoSnapshot + executeFillInstructions
 * - autofill.undo    → executeUndo
 *
 * Architecture references:
 * - ADR-REV-D4 (Engine = Pure Functional Core)
 * - PATTERN-SE9 (Native Setter from ISOLATED world)
 * - PATTERN-SE10 (Operation ID Addressing)
 */

import type { DetectedField } from "@jobswyft/engine";
import type {
  SerializedDetectedField,
  ExtensionMessage,
} from "@/lib/message-types";

// ─── Field Serialization ──────────────────────────────────────────────────────
// Strip any non-serializable properties (Element refs, WeakRefs) and pick
// only the properties defined in SerializedDetectedField for safe message passing.

function serializeFields(
  fields: DetectedField[],
): SerializedDetectedField[] {
  return fields.map((f) => ({
    stableId: f.stableId,
    opid: f.stableId, // opid === stableId in engine (jf-field-{n})
    inputType: f.inputType,
    label: f.label,
    fieldType: f.fieldType,
    confidence: f.confidence,
    category: f.category,
    signals: f.signals,
    selector: f.selector,
    currentValue: f.currentValue,
    isVisible: f.isVisible,
    isDisabled: f.isDisabled,
    isRequired: f.isRequired,
    registryEntryId: f.registryEntryId,
    board: f.board,
    frameId: f.frameId,
  }));
}

// ─── Closed Shadow DOM Support ────────────────────────────────────────────────
// Wraps engine's deepQueryFormFields with chrome.dom closed root access.
// Approach A (preferred): Pre-collect all form elements including closed roots,
// then pass to engine detection. See Task 5 for full implementation.

function queryFormFieldsWithClosedRoots(root: Document | ShadowRoot): Element[] {
  const FORM_SELECTOR =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select, [contenteditable="true"], [contenteditable=""]';
  const MAX_DEPTH = 5;
  const results: Element[] = [];

  function walk(node: Document | ShadowRoot | Element, depth: number): void {
    if (depth > MAX_DEPTH) return;

    const container = node instanceof Element ? node.shadowRoot ?? node : node;

    // Query for form fields in this context
    try {
      const fields = container.querySelectorAll(FORM_SELECTOR);
      for (const field of fields) {
        results.push(field);
      }
    } catch {
      // Ignore query errors on detached nodes
    }

    // Recurse into open shadow roots
    const allElements = container.querySelectorAll("*");
    for (const el of allElements) {
      if (el.shadowRoot) {
        walk(el.shadowRoot, depth + 1);
      }

      // Check for closed shadow roots via chrome.dom API
      if (typeof chrome !== "undefined" && chrome.dom?.openOrClosedShadowRoot) {
        try {
          const closedRoot = chrome.dom.openOrClosedShadowRoot(el);
          if (closedRoot && closedRoot !== el.shadowRoot) {
            walk(closedRoot, depth + 1);
          }
        } catch {
          // chrome.dom may throw for certain elements
        }
      }
    }
  }

  walk(root, 0);
  return results;
}

// ─── Content Script Definition ────────────────────────────────────────────────

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  runAt: "document_idle",

  main() {
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void,
      ) => {
        if (!message || typeof message.type !== "string") return false;

        switch (message.type) {
          case "autofill.detect": {
            handleDetect(message.payload.board, sendResponse);
            return true; // Keep channel open for async response
          }

          case "autofill.fill": {
            handleFill(message.payload.instructions, sendResponse);
            return true;
          }

          case "autofill.undo": {
            handleUndo(message.payload.entries, sendResponse);
            return true;
          }

          default:
            return false; // Not handled — let other listeners process
        }
      },
    );
  },
});

// ─── Message Handlers ─────────────────────────────────────────────────────────
// Dynamic imports defer engine loading until first use, minimizing per-tab overhead.

async function handleDetect(
  board: string | null,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const { detectFormFields, classifyFields } = await import(
      "@jobswyft/engine"
    );

    // 1. Run engine detection (discovers elements in open shadow roots)
    const fields = detectFormFields(document, { board });

    // 2. Supplement with elements from closed shadow roots (Approach A)
    //    Engine can't access closed roots — we discover them via chrome.dom API
    //    and create basic DetectedField entries for elements the engine missed.
    const closedRootFields = discoverClosedRootFields(fields.length, board);
    const allFields = [...fields, ...closedRootFields];

    // 3. Classify all fields with signal evaluation
    //    Note: closed-root fields will fall back to "unknown" type since
    //    classifyFields uses document.querySelector() which can't reach them.
    //    Full classification via Approach B (engine change) is a future enhancement.
    const classified = classifyFields(allFields, document, { board });

    sendResponse({
      type: "autofill.detect.result" as const,
      payload: {
        fields: serializeFields(classified),
        board,
        url: location.href,
        frameId: 0, // Will be resolved by side panel from adapter frameId
      },
    });
  } catch (err) {
    sendResponse({
      type: "autofill.detect.result" as const,
      payload: {
        fields: [],
        board,
        url: location.href,
        frameId: 0,
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

/**
 * Discover form elements in closed shadow roots that the engine missed.
 * Pre-collects all elements (including closed roots), then checks which
 * ones already have data-jf-opid (assigned by engine). For elements
 * without opid, creates basic DetectedField entries.
 */
function discoverClosedRootFields(
  nextCounter: number,
  board: string | null,
): DetectedField[] {
  const allElements = queryFormFieldsWithClosedRoots(document);

  // Filter to elements the engine didn't process (no opid attribute)
  const missed = allElements.filter(
    (el) => !el.hasAttribute("data-jf-opid"),
  );
  if (missed.length === 0) return [];

  const supplemental: DetectedField[] = [];
  let counter = nextCounter;

  for (const el of missed) {
    const opid = `jf-field-${counter}`;
    el.setAttribute("data-jf-opid", opid);

    supplemental.push({
      stableId: opid,
      selector: `[data-jf-opid="${opid}"]`,
      label: resolveBasicLabel(el),
      fieldType: "unknown",
      confidence: 0,
      category: "custom",
      isRequired: el.hasAttribute("required"),
      isVisible: isBasicVisible(el),
      isDisabled:
        el.hasAttribute("disabled") ||
        (el as HTMLInputElement).disabled === true,
      currentValue: (el as HTMLInputElement).value ?? "",
      inputType: getBasicInputType(el),
      signals: [],
      registryEntryId: null,
      board,
      frameId: 0,
    });
    counter++;
  }

  return supplemental;
}

// ─── Lightweight helpers for closed-root elements ────────────────────────────
// Minimal versions of engine's internal helpers, used only for elements
// the engine couldn't discover. These don't need full signal evaluation.

function resolveBasicLabel(el: Element): string {
  // Check aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check associated <label>
  const id = el.getAttribute("id");
  if (id) {
    // Try to find label in the same shadow root
    const root = el.getRootNode();
    if (root instanceof ShadowRoot || root instanceof Document) {
      const label = root.querySelector(`label[for="${id}"]`);
      if (label?.textContent) return label.textContent.trim();
    }
  }

  // Check placeholder
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return placeholder;

  // Check name attribute
  const name = el.getAttribute("name");
  if (name) return name.replace(/[_-]/g, " ");

  return "";
}

function isBasicVisible(el: Element): boolean {
  const style = (el as HTMLElement).style;
  if (style?.display === "none" || style?.visibility === "hidden") return false;
  return (el as HTMLElement).offsetParent !== null;
}

function getBasicInputType(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (tag === "select") return "select";
  if (el.hasAttribute("contenteditable")) return "contenteditable";
  return (el as HTMLInputElement).type || "text";
}

async function handleFill(
  instructions: import("@jobswyft/engine").FillInstruction[],
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const { executeFillInstructions, captureUndoSnapshot } = await import(
      "@jobswyft/engine"
    );

    // Capture pre-fill values for undo capability
    const undoEntries = captureUndoSnapshot(document, instructions);

    // Execute fill instructions using native setter pattern (PATTERN-SE9)
    const result = executeFillInstructions(document, instructions);

    sendResponse({
      type: "autofill.fill.result" as const,
      payload: {
        filled: result.filled,
        failed: result.failed,
        results: result.results,
        undoEntries,
      },
    });
  } catch (err) {
    sendResponse({
      type: "autofill.fill.result" as const,
      payload: {
        filled: 0,
        failed: instructions.length,
        results: [],
        undoEntries: [],
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

async function handleUndo(
  entries: import("@jobswyft/engine").UndoEntry[],
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const { executeUndo } = await import("@jobswyft/engine");

    const result = executeUndo(document, entries);

    sendResponse({
      type: "autofill.undo.result" as const,
      payload: {
        undone: result.undone,
        failed: result.failed,
      },
    });
  } catch (err) {
    sendResponse({
      type: "autofill.undo.result" as const,
      payload: {
        undone: 0,
        failed: entries.length,
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
