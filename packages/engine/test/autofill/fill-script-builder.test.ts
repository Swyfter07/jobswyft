import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildFillInstructions,
  executeFillInstruction,
  executeFillInstructions,
} from "../../src/autofill/fill-script-builder";
import type {
  MappedField,
  FillInstruction,
  AutofillFieldType,
  FieldCategory,
  MappedFieldStatus,
  SignalEvaluation,
} from "../../src/types/field-types";

// ─── Mock Helpers ───────────────────────────────────────────────────────────

function mockMappedField(overrides: Partial<MappedField>): MappedField {
  return {
    stableId: "jf-field-0",
    selector: '[data-jf-opid="jf-field-0"]',
    label: "",
    fieldType: "firstName" as AutofillFieldType,
    confidence: 0.9,
    category: "personal" as FieldCategory,
    isRequired: false,
    isVisible: true,
    isDisabled: false,
    currentValue: "",
    inputType: "text",
    signals: [] as SignalEvaluation[],
    registryEntryId: null,
    board: null,
    frameId: 0,
    status: "ready" as MappedFieldStatus,
    mappedValue: "Test Value",
    valueSource: "personal",
    ...overrides,
  };
}

describe("buildFillInstructions", () => {
  // ─── Only "ready" fields with values → instructions ───────────────────────

  it('only includes fields with status "ready" and non-null mappedValue', () => {
    const fields: MappedField[] = [
      mockMappedField({ stableId: "jf-field-0", status: "ready", mappedValue: "John" }),
      mockMappedField({ stableId: "jf-field-1", status: "missing", mappedValue: null }),
      mockMappedField({ stableId: "jf-field-2", status: "ready", mappedValue: "Doe" }),
      mockMappedField({ stableId: "jf-field-3", status: "ready", mappedValue: null }),
    ];

    const instructions = buildFillInstructions(fields);

    expect(instructions).toHaveLength(2);
    expect(instructions[0].stableId).toBe("jf-field-0");
    expect(instructions[1].stableId).toBe("jf-field-2");
  });

  // ─── Skips file inputs ────────────────────────────────────────────────────

  it("skips file input fields", () => {
    const fields: MappedField[] = [
      mockMappedField({ stableId: "jf-field-0", inputType: "file", status: "ready", mappedValue: "resume.pdf" }),
      mockMappedField({ stableId: "jf-field-1", inputType: "text", status: "ready", mappedValue: "John" }),
    ];

    const instructions = buildFillInstructions(fields);

    expect(instructions).toHaveLength(1);
    expect(instructions[0].stableId).toBe("jf-field-1");
  });

  // ─── Skips "missing" and "skipped" fields ─────────────────────────────────

  it('skips fields with status "missing" and "skipped"', () => {
    const fields: MappedField[] = [
      mockMappedField({ stableId: "jf-field-0", status: "missing", mappedValue: null }),
      mockMappedField({ stableId: "jf-field-1", status: "skipped", mappedValue: null }),
      mockMappedField({ stableId: "jf-field-2", status: "ready", mappedValue: "value" }),
    ];

    const instructions = buildFillInstructions(fields);

    expect(instructions).toHaveLength(1);
    expect(instructions[0].stableId).toBe("jf-field-2");
  });

  // ─── Orders visible required first ────────────────────────────────────────

  it("orders visible required fields before optional and hidden fields", () => {
    const fields: MappedField[] = [
      mockMappedField({
        stableId: "jf-field-0",
        selector: '[data-jf-opid="jf-field-0"]',
        isVisible: false,
        isRequired: false,
        status: "ready",
        mappedValue: "hidden",
      }),
      mockMappedField({
        stableId: "jf-field-1",
        selector: '[data-jf-opid="jf-field-1"]',
        isVisible: true,
        isRequired: true,
        status: "ready",
        mappedValue: "visible-required",
      }),
      mockMappedField({
        stableId: "jf-field-2",
        selector: '[data-jf-opid="jf-field-2"]',
        isVisible: true,
        isRequired: false,
        status: "ready",
        mappedValue: "visible-optional",
      }),
    ];

    const instructions = buildFillInstructions(fields);

    expect(instructions).toHaveLength(3);
    // Visible required should be first
    expect(instructions[0].stableId).toBe("jf-field-1");
    // Visible optional second
    expect(instructions[1].stableId).toBe("jf-field-2");
    // Hidden last
    expect(instructions[2].stableId).toBe("jf-field-0");
  });
});

describe("executeFillInstruction", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input type="text" data-jf-opid="jf-field-0" />
        <input type="email" data-jf-opid="jf-field-1" />
        <select data-jf-opid="jf-field-2">
          <option value="">Select</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
        </select>
        <input type="checkbox" data-jf-opid="jf-field-3" />
        <div contenteditable="true" data-jf-opid="jf-field-4"></div>
      </form>
    `;
  });

  // ─── Text input value set ─────────────────────────────────────────────────

  it("sets value on a text input", () => {
    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-0"]',
      value: "Hello World",
      inputType: "text",
      stableId: "jf-field-0",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    const el = document.querySelector('[data-jf-opid="jf-field-0"]') as HTMLInputElement;
    expect(el.value).toBe("Hello World");
  });

  // ─── Input event dispatched ───────────────────────────────────────────────

  it("dispatches input and change events when filling", () => {
    const events: string[] = [];
    const el = document.querySelector('[data-jf-opid="jf-field-0"]') as HTMLInputElement;
    el.addEventListener("input", () => events.push("input"));
    el.addEventListener("change", () => events.push("change"));
    el.addEventListener("blur", () => events.push("blur"));

    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-0"]',
      value: "test",
      inputType: "text",
      stableId: "jf-field-0",
    };

    executeFillInstruction(document, instruction);

    expect(events).toContain("input");
    expect(events).toContain("change");
    expect(events).toContain("blur");
  });

  // ─── Select value matched and set ─────────────────────────────────────────

  it("sets select value by exact match", () => {
    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-2"]',
      value: "us",
      inputType: "select",
      stableId: "jf-field-2",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(true);
    const el = document.querySelector('[data-jf-opid="jf-field-2"]') as HTMLSelectElement;
    expect(el.value).toBe("us");
  });

  // ─── Checkbox toggled correctly ───────────────────────────────────────────

  it("toggles checkbox when filling with truthy value", () => {
    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-3"]',
      value: "true",
      inputType: "checkbox",
      stableId: "jf-field-3",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(true);
    const el = document.querySelector('[data-jf-opid="jf-field-3"]') as HTMLInputElement;
    expect(el.checked).toBe(true);
  });

  // ─── Contenteditable set ──────────────────────────────────────────────────

  it("sets contenteditable element value", () => {
    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-4"]',
      value: "Rich text content",
      inputType: "contenteditable",
      stableId: "jf-field-4",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(true);
    const el = document.querySelector('[data-jf-opid="jf-field-4"]') as HTMLElement;
    expect(el.textContent).toBe("Rich text content");
  });

  // ─── Missing element → error result ───────────────────────────────────────

  it("returns error when element is not found in DOM", () => {
    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-999"]',
      value: "test",
      inputType: "text",
      stableId: "jf-field-999",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Element not found");
  });

  // ─── File input → error ───────────────────────────────────────────────────

  it("returns error for file input type", () => {
    document.body.innerHTML += `<input type="file" data-jf-opid="jf-field-5" />`;

    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-5"]',
      value: "resume.pdf",
      inputType: "file",
      stableId: "jf-field-5",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(false);
    expect(result.error).toContain("File inputs");
  });

  // ─── previousValue captured ───────────────────────────────────────────────

  it("captures previousValue before filling", () => {
    const el = document.querySelector('[data-jf-opid="jf-field-0"]') as HTMLInputElement;
    el.value = "old value";

    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-0"]',
      value: "new value",
      inputType: "text",
      stableId: "jf-field-0",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(true);
    expect(result.previousValue).toBe("old value");
  });

  // ─── Select no match → error ──────────────────────────────────────────────

  it("returns error when select has no matching option", () => {
    const instruction: FillInstruction = {
      selector: '[data-jf-opid="jf-field-2"]',
      value: "nonexistent-country",
      inputType: "select",
      stableId: "jf-field-2",
    };

    const result = executeFillInstruction(document, instruction);

    expect(result.success).toBe(false);
    expect(result.error).toContain("No matching option");
  });
});

describe("executeFillInstructions", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input type="text" data-jf-opid="jf-field-0" />
        <input type="email" data-jf-opid="jf-field-1" />
        <input type="tel" data-jf-opid="jf-field-2" />
      </form>
    `;
  });

  // ─── Batch fill multiple fields ───────────────────────────────────────────

  it("fills multiple fields in a single batch call", () => {
    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-0"]', value: "John", inputType: "text", stableId: "jf-field-0" },
      { selector: '[data-jf-opid="jf-field-1"]', value: "john@test.com", inputType: "email", stableId: "jf-field-1" },
      { selector: '[data-jf-opid="jf-field-2"]', value: "+1555000000", inputType: "tel", stableId: "jf-field-2" },
    ];

    const result = executeFillInstructions(document, instructions);

    expect(result.filled).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(3);

    const el0 = document.querySelector('[data-jf-opid="jf-field-0"]') as HTMLInputElement;
    const el1 = document.querySelector('[data-jf-opid="jf-field-1"]') as HTMLInputElement;
    const el2 = document.querySelector('[data-jf-opid="jf-field-2"]') as HTMLInputElement;
    expect(el0.value).toBe("John");
    expect(el1.value).toBe("john@test.com");
    expect(el2.value).toBe("+1555000000");
  });

  // ─── Returns correct filled/failed counts ────────────────────────────────

  it("returns correct filled and failed counts with mixed results", () => {
    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-0"]', value: "John", inputType: "text", stableId: "jf-field-0" },
      { selector: '[data-jf-opid="jf-field-99"]', value: "missing", inputType: "text", stableId: "jf-field-99" },
      { selector: '[data-jf-opid="jf-field-1"]', value: "john@test.com", inputType: "email", stableId: "jf-field-1" },
    ];

    const result = executeFillInstructions(document, instructions);

    expect(result.filled).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results).toHaveLength(3);
  });

  // ─── Records durationMs ───────────────────────────────────────────────────

  it("records durationMs in the result", () => {
    const instructions: FillInstruction[] = [
      { selector: '[data-jf-opid="jf-field-0"]', value: "John", inputType: "text", stableId: "jf-field-0" },
    ];

    const result = executeFillInstructions(document, instructions);

    expect(typeof result.durationMs).toBe("number");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // ─── Performance: 20 fields within 500ms ──────────────────────────────────

  it("fills 20 fields within 500ms", () => {
    let formHtml = "<form>";
    for (let i = 0; i < 20; i++) {
      formHtml += `<input type="text" data-jf-opid="jf-perf-${i}" />`;
    }
    formHtml += "</form>";
    document.body.innerHTML = formHtml;

    const instructions: FillInstruction[] = [];
    for (let i = 0; i < 20; i++) {
      instructions.push({
        selector: `[data-jf-opid="jf-perf-${i}"]`,
        value: `Value ${i}`,
        inputType: "text",
        stableId: `jf-perf-${i}`,
      });
    }

    const result = executeFillInstructions(document, instructions);

    expect(result.filled).toBe(20);
    expect(result.failed).toBe(0);
    expect(result.durationMs).toBeLessThan(500);
  });

  // ─── Empty instructions ───────────────────────────────────────────────────

  it("handles empty instructions array", () => {
    const result = executeFillInstructions(document, []);

    expect(result.filled).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.results).toEqual([]);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
