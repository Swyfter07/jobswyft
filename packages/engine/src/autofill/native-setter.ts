/**
 * Native Property Descriptor Setter — PATTERN-SE9 (MANDATORY)
 *
 * All form field writes in the engine MUST use these functions.
 * The native property descriptor setter pattern is required for React/Vue/Angular
 * controlled forms, which ignore direct `element.value = x` assignments.
 *
 * Architecture reference: ADR-REV-SE6 (Native Setter Pattern)
 */

/**
 * Set value on an input or textarea element using the native property descriptor.
 *
 * Uses Object.getOwnPropertyDescriptor to find the prototype's setter,
 * then calls it with the new value. This ensures React/Vue/Angular pick up
 * the value change. Falls back to direct assignment if no descriptor found.
 *
 * Dispatches input, change, and blur events in sequence.
 */
export function setFieldValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const proto = Object.getPrototypeOf(el);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");

  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value; // Fallback for non-standard elements
  }

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

/**
 * Set value on a <select> element by matching option values/text.
 *
 * Tries matching in order: exact value, case-insensitive value,
 * case-insensitive text content, substring match.
 *
 * @returns true if a matching option was found and selected, false otherwise
 */
export function setSelectValue(
  el: HTMLSelectElement,
  value: string,
): boolean {
  const options = Array.from(el.options);

  // 1. Exact value match
  const exactMatch = options.findIndex((o) => o.value === value);
  if (exactMatch !== -1) {
    el.selectedIndex = exactMatch;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // 2. Case-insensitive value match
  const lowerValue = value.toLowerCase();
  const ciValueMatch = options.findIndex((o) => o.value.toLowerCase() === lowerValue);
  if (ciValueMatch !== -1) {
    el.selectedIndex = ciValueMatch;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // 3. Case-insensitive text match
  const ciTextMatch = options.findIndex(
    (o) => o.textContent?.trim().toLowerCase() === lowerValue,
  );
  if (ciTextMatch !== -1) {
    el.selectedIndex = ciTextMatch;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // 4. Substring match
  const substringMatch = options.findIndex(
    (o) =>
      o.value.toLowerCase().includes(lowerValue) ||
      (o.textContent?.trim().toLowerCase().includes(lowerValue) ?? false),
  );
  if (substringMatch !== -1) {
    el.selectedIndex = substringMatch;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}

/**
 * Set checkbox value using click() for React compatibility.
 *
 * Parses value as boolean (true/1/yes/on/checked → check, false/0/no/off/unchecked → uncheck).
 * Uses click() instead of direct property assignment for React event propagation.
 */
export function setCheckboxValue(
  el: HTMLInputElement,
  value: string,
): void {
  const shouldCheck = /^(true|1|yes|on|checked)$/i.test(value);
  if (el.checked !== shouldCheck) {
    el.click(); // Use click() for React compatibility
  }
}

/**
 * Set radio button value by finding matching radio in the group.
 *
 * Finds radios with the same name, matches by value, and uses click() for
 * React compatibility.
 */
export function setRadioValue(
  el: HTMLInputElement,
  value: string,
): void {
  const name = el.getAttribute("name");
  if (!name) {
    // No group name — toggle this single radio
    if (!el.checked) el.click();
    return;
  }

  const form = el.closest("form") ?? el.ownerDocument;
  const radios = form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`);

  const lowerValue = value.toLowerCase();

  for (const radio of radios) {
    if (
      radio.value.toLowerCase() === lowerValue ||
      radio.getAttribute("id")?.toLowerCase() === lowerValue
    ) {
      if (!radio.checked) radio.click();
      return;
    }
  }

  // Fallback: substring match on label text
  for (const radio of radios) {
    const label = radio.ownerDocument.querySelector(`label[for="${radio.id}"]`);
    if (label?.textContent?.toLowerCase().includes(lowerValue)) {
      if (!radio.checked) radio.click();
      return;
    }
  }
}

/**
 * Set contenteditable element value.
 *
 * Sets textContent directly and dispatches an InputEvent with inputType 'insertText'.
 */
export function setContentEditableValue(
  el: HTMLElement,
  value: string,
): void {
  el.textContent = value;
  el.dispatchEvent(
    new InputEvent("input", { bubbles: true, inputType: "insertText" }),
  );
}
