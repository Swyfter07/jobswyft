/**
 * Shadow DOM Traversal — TreeWalker-based DOM traversal for form field discovery.
 *
 * Traverses open shadow roots to find form elements across shadow DOM boundaries.
 * Closed shadow roots are detected and logged (cannot be traversed without chrome.dom API).
 *
 * Architecture reference: ADR-REV-SE7 (Shadow DOM Traversal)
 */

const FORM_ELEMENT_SELECTOR = "input, textarea, select, [contenteditable]";
const MAX_SHADOW_DEPTH = 5;

/**
 * Options for shadow DOM traversal.
 */
export interface DeepQueryOptions {
  /** Callback invoked when a probable closed shadow root is detected. */
  onClosedShadowRoot?: (el: Element, tagName: string) => void;
}

/**
 * Recursively query form fields across open shadow DOM boundaries.
 *
 * Uses TreeWalker to traverse the DOM tree. For each element with an open
 * shadowRoot, recurses into the shadow tree. Closed shadow roots are detected
 * (custom elements with no accessible shadowRoot) and reported via callback.
 *
 * @param root - Document or ShadowRoot to start traversal from
 * @param results - Accumulator array (used internally for recursion)
 * @param depth - Current shadow DOM nesting depth (max 5)
 * @param options - Optional callbacks for closed shadow root detection
 * @returns Flat array of all form elements found
 */
export function deepQueryFormFields(
  root: Document | ShadowRoot,
  results: Element[] = [],
  depth: number = 0,
  options?: DeepQueryOptions,
): Element[] {
  // Collect form elements at this level
  const elements = root.querySelectorAll(FORM_ELEMENT_SELECTOR);
  for (const el of elements) {
    results.push(el);
  }

  // If we've hit max depth, stop recursing into shadow roots
  if (depth >= MAX_SHADOW_DEPTH) {
    return results;
  }

  // Walk all elements looking for shadow roots
  const isDocument = root.nodeType === 9;
  const walkRoot = isDocument ? (root as Document).documentElement ?? root : root;
  const doc = isDocument ? (root as Document) : (root as ShadowRoot).ownerDocument;
  const walker = doc.createTreeWalker(walkRoot, NodeFilter.SHOW_ELEMENT);

  let node = walker.nextNode();
  while (node) {
    const el = node as Element;

    if (el.shadowRoot) {
      // Open shadow root — recurse into it
      deepQueryFormFields(el.shadowRoot, results, depth + 1, options);
    } else if (isLikelyClosedShadowHost(el)) {
      // Probable closed shadow root — cannot traverse, report via callback
      options?.onClosedShadowRoot?.(el, el.tagName.toLowerCase());
    }

    node = walker.nextNode();
  }

  return results;
}

/**
 * Heuristic to detect elements that likely have a closed shadow root.
 *
 * Custom elements (tag names containing a hyphen) that have no accessible
 * shadowRoot are probable closed shadow hosts. This cannot be confirmed
 * without chrome.dom.openOrClosedShadowRoot (extension adapter scope).
 */
function isLikelyClosedShadowHost(el: Element): boolean {
  // Custom elements have a hyphen in their tag name (web components spec)
  const tagName = el.tagName.toLowerCase();
  if (!tagName.includes("-")) return false;

  // If shadowRoot is null on a custom element, it may have a closed shadow root
  // (or no shadow root at all — this is a heuristic, not a guarantee)
  return el.shadowRoot === null;
}
