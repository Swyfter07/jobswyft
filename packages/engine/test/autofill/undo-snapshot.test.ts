import { describe, it, expect, beforeEach } from "vitest";
import { captureUndoSnapshot, executeUndo } from "../../src/autofill/undo-snapshot";
import type { FillInstruction, UndoEntry } from "../../src/types/field-types";

describe("captureUndoSnapshot", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input type="text" data-jf-opid="jf-field-0" value="John" />
        <input type="email" data-jf-opid="jf-field-1" value="john@test.com" />
        <select data-jf-opid="jf-field-2">
          <option value="us" selected>United States</option>
          <option value="uk">United Kingdom</option>
        </select>
        <input type="checkbox" data-jf-opid="jf-field-3" />
        <div contenteditable="true" data-jf-opid="jf-field-4">Editable content</div>
      </form>
    `;
  });

  // ─── Stores previous values for all fields ────────────────────────────────

  it("stores previous values for all fields in instructions", () => {
    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-0"]', value: "New Name", inputType: "text", stableId: "jf-field-0" },
      { selector: '[data-jf-opid="jf-field-1"]', value: "new@test.com", inputType: "email", stableId: "jf-field-1" },
      { selector: '[data-jf-opid="jf-field-2"]', value: "uk", inputType: "select", stableId: "jf-field-2" },
    ];

    const snapshot = captureUndoSnapshot(document, instructions);

    expect(snapshot).toHaveLength(3);
    expect(snapshot[0].previousValue).toBe("John");
    expect(snapshot[0].stableId).toBe("jf-field-0");
    expect(snapshot[1].previousValue).toBe("john@test.com");
    expect(snapshot[2].previousValue).toBe("us");
  });

  // ─── Skips elements not found in DOM ──────────────────────────────────────

  it("skips elements not found in DOM", () => {
    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-0"]', value: "New Name", inputType: "text", stableId: "jf-field-0" },
      { selector: '[data-jf-opid="jf-field-99"]', value: "missing", inputType: "text", stableId: "jf-field-99" },
    ];

    const snapshot = captureUndoSnapshot(document, instructions);

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].stableId).toBe("jf-field-0");
  });

  // ─── Captures checkbox state ──────────────────────────────────────────────

  it("captures checkbox checked state as string", () => {
    const checkbox = document.querySelector('[data-jf-opid="jf-field-3"]') as HTMLInputElement;
    checkbox.checked = true;

    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-3"]', value: "false", inputType: "checkbox", stableId: "jf-field-3" },
    ];

    const snapshot = captureUndoSnapshot(document, instructions);

    expect(snapshot[0].previousValue).toBe("true");
  });

  // ─── Captures contenteditable value ───────────────────────────────────────

  it("captures contenteditable textContent", () => {
    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-4"]', value: "new content", inputType: "contenteditable", stableId: "jf-field-4" },
    ];

    const snapshot = captureUndoSnapshot(document, instructions);

    expect(snapshot[0].previousValue).toBe("Editable content");
  });
});

describe("executeUndo", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input type="text" data-jf-opid="jf-field-0" value="filled-value" />
        <input type="email" data-jf-opid="jf-field-1" value="filled@test.com" />
        <select data-jf-opid="jf-field-2">
          <option value="us">United States</option>
          <option value="uk" selected>United Kingdom</option>
        </select>
        <div contenteditable="true" data-jf-opid="jf-field-3">filled content</div>
      </form>
    `;
  });

  // ─── Restores text input values ───────────────────────────────────────────

  it("restores text input values to their previous state", () => {
    // Grab element references BEFORE undo (opid will be removed after)
    const el0 = document.querySelector('[data-jf-opid="jf-field-0"]') as HTMLInputElement;
    const el1 = document.querySelector('[data-jf-opid="jf-field-1"]') as HTMLInputElement;
    expect(el0).not.toBeNull();
    expect(el1).not.toBeNull();

    const entries: UndoEntry[] = [
      { stableId: "jf-field-0", selector: '[data-jf-opid="jf-field-0"]', previousValue: "original", inputType: "text" },
      { stableId: "jf-field-1", selector: '[data-jf-opid="jf-field-1"]', previousValue: "original@test.com", inputType: "email" },
    ];

    const result = executeUndo(document, entries);

    expect(result.undone).toBe(2);
    expect(result.failed).toBe(0);

    // Verify actual DOM values were restored
    expect(el0.value).toBe("original");
    expect(el1.value).toBe("original@test.com");
  });

  // ─── Restores select values ───────────────────────────────────────────────

  it("restores select element values", () => {
    const entries: UndoEntry[] = [
      { stableId: "jf-field-2", selector: '[data-jf-opid="jf-field-2"]', previousValue: "us", inputType: "select" },
    ];

    const result = executeUndo(document, entries);

    expect(result.undone).toBe(1);
    expect(result.failed).toBe(0);
  });

  // ─── Removes data-jf-opid attributes ─────────────────────────────────────

  it("removes data-jf-opid attribute after undo", () => {
    const entries: UndoEntry[] = [
      { stableId: "jf-field-0", selector: '[data-jf-opid="jf-field-0"]', previousValue: "original", inputType: "text" },
    ];

    executeUndo(document, entries);

    // The element should no longer have data-jf-opid
    const elementsWithOpid = document.querySelectorAll('[data-jf-opid="jf-field-0"]');
    expect(elementsWithOpid).toHaveLength(0);
  });

  // ─── Handles missing elements gracefully ──────────────────────────────────

  it("increments failed count for missing elements", () => {
    const entries: UndoEntry[] = [
      { stableId: "jf-field-0", selector: '[data-jf-opid="jf-field-0"]', previousValue: "original", inputType: "text" },
      { stableId: "jf-field-99", selector: '[data-jf-opid="jf-field-99"]', previousValue: "missing", inputType: "text" },
    ];

    const result = executeUndo(document, entries);

    expect(result.undone).toBe(1);
    expect(result.failed).toBe(1);
  });

  // ─── Empty entries ────────────────────────────────────────────────────────

  it("handles empty entries array", () => {
    const result = executeUndo(document, []);

    expect(result.undone).toBe(0);
    expect(result.failed).toBe(0);
  });

  // ─── Restores contenteditable ─────────────────────────────────────────────

  it("restores contenteditable elements", () => {
    const entries: UndoEntry[] = [
      { stableId: "jf-field-3", selector: '[data-jf-opid="jf-field-3"]', previousValue: "original content", inputType: "contenteditable" },
    ];

    const result = executeUndo(document, entries);

    expect(result.undone).toBe(1);
    expect(result.failed).toBe(0);
  });
});
