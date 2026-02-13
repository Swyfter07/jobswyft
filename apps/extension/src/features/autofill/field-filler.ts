/**
 * Pure injectable form fill functions for chrome.scripting.executeScript().
 *
 * IMPORTANT: These functions are serialized by Chrome and injected into the page.
 * They MUST NOT use any imports, closures, or external references.
 * All logic is inlined. Same pattern as field-detector.ts.
 */

/**
 * Fill form fields with provided values using native setter patterns
 * to bypass React/framework synthetic event systems.
 */
export function fillFormFields(
  instructions: Array<{
    selector: string;
    value: string;
    inputType: string;
    stableId: string;
  }>
): {
  filled: number;
  failed: number;
  results: Array<{
    stableId: string;
    selector: string;
    success: boolean;
    previousValue: string;
    error: string | null;
  }>;
  durationMs: number;
} {
  const startTime = performance.now();
  const results: Array<{
    stableId: string;
    selector: string;
    success: boolean;
    previousValue: string;
    error: string | null;
  }> = [];

  let filled = 0;
  let failed = 0;

  for (const inst of instructions) {
    try {
      const el = document.querySelector<HTMLElement>(inst.selector);
      if (!el) {
        results.push({
          stableId: inst.stableId,
          selector: inst.selector,
          success: false,
          previousValue: "",
          error: `Element not found: ${inst.selector}`,
        });
        failed++;
        continue;
      }

      // ─── Capture previous value ───────────────────────────────────
      let previousValue = "";
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        previousValue = el.value;
      } else if (el instanceof HTMLSelectElement) {
        previousValue = el.value;
      } else if ((el as HTMLElement).isContentEditable || el.getAttribute("contenteditable") === "true") {
        previousValue = el.textContent || "";
      }

      // ─── Fill by element type ─────────────────────────────────────

      if (el instanceof HTMLSelectElement) {
        // Select: fuzzy option matching
        const options = Array.from(el.options);
        const valueLower = inst.value.toLowerCase().trim();

        let matched: HTMLOptionElement | undefined;

        // 1. Exact value match
        matched = options.find((o) => o.value === inst.value);

        // 2. Case-insensitive text match
        if (!matched) {
          matched = options.find(
            (o) => (o.textContent || "").trim().toLowerCase() === valueLower
          );
        }

        // 3. Starts-with text match
        if (!matched) {
          matched = options.find((o) =>
            (o.textContent || "").trim().toLowerCase().startsWith(valueLower)
          );
        }

        // 4. Substring text match (e.g., "Yes" matches "Yes, I am authorized")
        if (!matched) {
          matched = options.find((o) =>
            (o.textContent || "").trim().toLowerCase().includes(valueLower)
          );
        }

        // 5. Reverse substring (value is longer, option is shorter)
        if (!matched) {
          matched = options.find((o) =>
            valueLower.includes((o.textContent || "").trim().toLowerCase())
          );
        }

        if (matched) {
          el.value = matched.value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("blur", { bubbles: true }));
          results.push({
            stableId: inst.stableId,
            selector: inst.selector,
            success: true,
            previousValue,
            error: null,
          });
          filled++;
        } else {
          results.push({
            stableId: inst.stableId,
            selector: inst.selector,
            success: false,
            previousValue,
            error: `No matching option for value: ${inst.value}`,
          });
          failed++;
        }
      } else if (el instanceof HTMLTextAreaElement) {
        // Textarea: use native setter
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        if (setter) {
          setter.call(el, inst.value);
        } else {
          el.value = inst.value;
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        results.push({
          stableId: inst.stableId,
          selector: inst.selector,
          success: true,
          previousValue,
          error: null,
        });
        filled++;
      } else if (el instanceof HTMLInputElement) {
        const type = (el.type || "text").toLowerCase();

        if (type === "checkbox") {
          // Checkbox: set checked based on truthy value
          const shouldCheck =
            inst.value === "true" ||
            inst.value === "1" ||
            inst.value.toLowerCase() === "yes";
          if (el.checked !== shouldCheck) {
            el.click();
          }
          results.push({
            stableId: inst.stableId,
            selector: inst.selector,
            success: true,
            previousValue: String(previousValue),
            error: null,
          });
          filled++;
        } else if (type === "radio") {
          // Radio: click to select
          if (!el.checked) {
            el.click();
          }
          results.push({
            stableId: inst.stableId,
            selector: inst.selector,
            success: true,
            previousValue: String(el.checked),
            error: null,
          });
          filled++;
        } else if (type === "file") {
          // File inputs handled separately via resume-uploader
          results.push({
            stableId: inst.stableId,
            selector: inst.selector,
            success: false,
            previousValue: "",
            error: "File inputs require resume-uploader (skipped)",
          });
          failed++;
        } else {
          // Text, email, tel, url, number, date, etc.
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
          )?.set;
          if (setter) {
            setter.call(el, inst.value);
          } else {
            el.value = inst.value;
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("blur", { bubbles: true }));
          results.push({
            stableId: inst.stableId,
            selector: inst.selector,
            success: true,
            previousValue,
            error: null,
          });
          filled++;
        }
      } else if ((el as HTMLElement).isContentEditable || el.getAttribute("contenteditable") === "true") {
        // Contenteditable element
        el.textContent = inst.value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        results.push({
          stableId: inst.stableId,
          selector: inst.selector,
          success: true,
          previousValue,
          error: null,
        });
        filled++;
      } else {
        results.push({
          stableId: inst.stableId,
          selector: inst.selector,
          success: false,
          previousValue: "",
          error: `Unsupported element type: ${el.tagName}`,
        });
        failed++;
      }
    } catch (err) {
      results.push({
        stableId: inst.stableId,
        selector: inst.selector,
        success: false,
        previousValue: "",
        error: `Fill error: ${String(err)}`,
      });
      failed++;
    }
  }

  return {
    filled,
    failed,
    results,
    durationMs: Math.round(performance.now() - startTime),
  };
}

/**
 * Undo previously filled form fields by restoring their previous values.
 * Uses the same fill strategies as fillFormFields.
 */
export function undoFormFills(
  entries: Array<{
    selector: string;
    previousValue: string;
    inputType: string;
    stableId: string;
  }>
): {
  undone: number;
  failed: number;
  results: Array<{
    stableId: string;
    success: boolean;
    error: string | null;
  }>;
} {
  const results: Array<{
    stableId: string;
    success: boolean;
    error: string | null;
  }> = [];

  let undone = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const el = document.querySelector<HTMLElement>(entry.selector);
      if (!el) {
        results.push({
          stableId: entry.stableId,
          success: false,
          error: `Element not found: ${entry.selector}`,
        });
        failed++;
        continue;
      }

      if (el instanceof HTMLSelectElement) {
        el.value = entry.previousValue;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        results.push({ stableId: entry.stableId, success: true, error: null });
        undone++;
      } else if (el instanceof HTMLTextAreaElement) {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        if (setter) {
          setter.call(el, entry.previousValue);
        } else {
          el.value = entry.previousValue;
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        results.push({ stableId: entry.stableId, success: true, error: null });
        undone++;
      } else if (el instanceof HTMLInputElement) {
        const type = (el.type || "text").toLowerCase();

        if (type === "checkbox") {
          const wasChecked =
            entry.previousValue === "true" ||
            entry.previousValue === "1" ||
            entry.previousValue.toLowerCase() === "yes";
          if (el.checked !== wasChecked) {
            el.click();
          }
          results.push({ stableId: entry.stableId, success: true, error: null });
          undone++;
        } else if (type === "radio") {
          // Radio undo is limited — we can't "uncheck" a radio. Skip gracefully.
          results.push({
            stableId: entry.stableId,
            success: false,
            error: "Cannot undo radio selection",
          });
          failed++;
        } else {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
          )?.set;
          if (setter) {
            setter.call(el, entry.previousValue);
          } else {
            el.value = entry.previousValue;
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("blur", { bubbles: true }));
          results.push({ stableId: entry.stableId, success: true, error: null });
          undone++;
        }
      } else if ((el as HTMLElement).isContentEditable || el.getAttribute("contenteditable") === "true") {
        el.textContent = entry.previousValue;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        results.push({ stableId: entry.stableId, success: true, error: null });
        undone++;
      } else {
        results.push({
          stableId: entry.stableId,
          success: false,
          error: `Unsupported element type: ${el.tagName}`,
        });
        failed++;
      }
    } catch (err) {
      results.push({
        stableId: entry.stableId,
        success: false,
        error: `Undo error: ${String(err)}`,
      });
      failed++;
    }
  }

  return { undone, failed, results };
}
