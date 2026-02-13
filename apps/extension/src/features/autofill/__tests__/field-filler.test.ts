/**
 * Field Filler Tests — Tests the pure injectable fillFormFields and undoFormFills functions.
 *
 * Uses JSDOM fixtures to simulate form elements.
 * Verifies fill strategies, pre-fill snapshots, error handling, and undo.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fillFormFields, undoFormFills } from "../field-filler";

function setupDOM(html: string) {
  document.body.innerHTML = html;
}

describe("fillFormFields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Text Input Fill ──────────────────────────────────────────────

  describe("text input fill", () => {
    it("should fill a text input using native setter and dispatch events", () => {
      setupDOM(`<input id="name" type="text" value="" />`);
      const el = document.querySelector<HTMLInputElement>("#name")!;

      const inputHandler = vi.fn();
      const changeHandler = vi.fn();
      const blurHandler = vi.fn();
      el.addEventListener("input", inputHandler);
      el.addEventListener("change", changeHandler);
      el.addEventListener("blur", blurHandler);

      const result = fillFormFields([
        {
          selector: "#name",
          value: "John Doe",
          inputType: "text",
          stableId: "af-0-name",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].previousValue).toBe("");
      expect(result.results[0].error).toBeNull();
      expect(el.value).toBe("John Doe");

      // Events dispatched
      expect(inputHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(blurHandler).toHaveBeenCalledTimes(1);
    });

    it("should capture previous value before filling", () => {
      setupDOM(`<input id="email" type="email" value="old@example.com" />`);

      const result = fillFormFields([
        {
          selector: "#email",
          value: "new@example.com",
          inputType: "email",
          stableId: "af-0-email",
        },
      ]);

      expect(result.results[0].previousValue).toBe("old@example.com");
      expect(result.results[0].success).toBe(true);
    });
  });

  // ─── Textarea Fill ────────────────────────────────────────────────

  describe("textarea fill", () => {
    it("should fill a textarea using textarea-specific prototype setter", () => {
      setupDOM(`<textarea id="bio"></textarea>`);
      const el = document.querySelector<HTMLTextAreaElement>("#bio")!;

      const result = fillFormFields([
        {
          selector: "#bio",
          value: "Software engineer with 5 years of experience.",
          inputType: "textarea",
          stableId: "af-0-bio",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(el.value).toBe("Software engineer with 5 years of experience.");
    });
  });

  // ─── Select Fill ──────────────────────────────────────────────────

  describe("select fill", () => {
    const selectHTML = `
      <select id="gender">
        <option value="">Select...</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="nonbinary">Non-Binary</option>
        <option value="decline">Decline to Self Identify</option>
        <option value="yes_auth">Yes, I am authorized to work</option>
      </select>
    `;

    it("should match select option by exact value", () => {
      setupDOM(selectHTML);
      const el = document.querySelector<HTMLSelectElement>("#gender")!;

      const result = fillFormFields([
        {
          selector: "#gender",
          value: "female",
          inputType: "select-one",
          stableId: "af-0-gender",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(el.value).toBe("female");
    });

    it("should match select option by case-insensitive text", () => {
      setupDOM(selectHTML);
      const el = document.querySelector<HTMLSelectElement>("#gender")!;

      const result = fillFormFields([
        {
          selector: "#gender",
          value: "non-binary",
          inputType: "select-one",
          stableId: "af-0-gender",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(el.value).toBe("nonbinary");
    });

    it("should match select option by starts-with text", () => {
      setupDOM(selectHTML);
      const el = document.querySelector<HTMLSelectElement>("#gender")!;

      const result = fillFormFields([
        {
          selector: "#gender",
          value: "decline",
          inputType: "select-one",
          stableId: "af-0-gender",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(el.value).toBe("decline");
    });

    it("should match select option by substring (fuzzy)", () => {
      setupDOM(selectHTML);
      const el = document.querySelector<HTMLSelectElement>("#gender")!;

      const result = fillFormFields([
        {
          selector: "#gender",
          value: "Yes",
          inputType: "select-one",
          stableId: "af-0-auth",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(el.value).toBe("yes_auth");
    });

    it("should fail gracefully when no option matches", () => {
      setupDOM(selectHTML);

      const result = fillFormFields([
        {
          selector: "#gender",
          value: "Agender",
          inputType: "select-one",
          stableId: "af-0-gender",
        },
      ]);

      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain("No matching option");
    });
  });

  // ─── Contenteditable Fill ─────────────────────────────────────────

  describe("contenteditable fill", () => {
    it("should fill a contenteditable element", () => {
      setupDOM(`<div id="editor" contenteditable="true">Old content</div>`);
      const el = document.querySelector<HTMLElement>("#editor")!;

      const result = fillFormFields([
        {
          selector: "#editor",
          value: "New content here",
          inputType: "contenteditable",
          stableId: "af-0-editor",
        },
      ]);

      expect(result.filled).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].previousValue).toBe("Old content");
      expect(el.textContent).toBe("New content here");
    });
  });

  // ─── Missing Element ──────────────────────────────────────────────

  describe("missing element", () => {
    it("should handle missing elements gracefully", () => {
      setupDOM(`<input id="exists" />`);

      const result = fillFormFields([
        {
          selector: "#nonexistent",
          value: "value",
          inputType: "text",
          stableId: "af-0-missing",
        },
      ]);

      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain("Element not found");
    });
  });

  // ─── Multiple Fields ──────────────────────────────────────────────

  describe("multiple fields", () => {
    it("should process all fields, with partial success handled", () => {
      setupDOM(`
        <input id="first" type="text" value="" />
        <input id="last" type="text" value="" />
      `);

      const result = fillFormFields([
        {
          selector: "#first",
          value: "Jane",
          inputType: "text",
          stableId: "af-0-first",
        },
        {
          selector: "#nonexistent",
          value: "will fail",
          inputType: "text",
          stableId: "af-1-missing",
        },
        {
          selector: "#last",
          value: "Smith",
          inputType: "text",
          stableId: "af-2-last",
        },
      ]);

      expect(result.filled).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Checkbox Fill ────────────────────────────────────────────────

  describe("checkbox fill", () => {
    it("should check a checkbox when value is true", () => {
      setupDOM(`<input id="agree" type="checkbox" />`);
      const el = document.querySelector<HTMLInputElement>("#agree")!;

      fillFormFields([
        {
          selector: "#agree",
          value: "true",
          inputType: "checkbox",
          stableId: "af-0-agree",
        },
      ]);

      expect(el.checked).toBe(true);
    });
  });

  // ─── File Input Skipped ───────────────────────────────────────────

  describe("file input", () => {
    it("should skip file inputs with an informative error", () => {
      setupDOM(`<input id="resume" type="file" />`);

      const result = fillFormFields([
        {
          selector: "#resume",
          value: "resume.pdf",
          inputType: "file",
          stableId: "af-0-resume",
        },
      ]);

      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain("resume-uploader");
    });
  });
});

// ─── Undo Tests ──────────────────────────────────────────────────────────────

describe("undoFormFills", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should restore text input to previous value", () => {
    setupDOM(`<input id="name" type="text" />`);
    const el = document.querySelector<HTMLInputElement>("#name")!;

    // Fill first
    fillFormFields([
      {
        selector: "#name",
        value: "John",
        inputType: "text",
        stableId: "af-0-name",
      },
    ]);
    expect(el.value).toBe("John");

    // Undo
    const result = undoFormFills([
      {
        selector: "#name",
        previousValue: "",
        inputType: "text",
        stableId: "af-0-name",
      },
    ]);

    expect(result.undone).toBe(1);
    expect(result.failed).toBe(0);
    expect(el.value).toBe("");
  });

  it("should restore textarea to previous value", () => {
    setupDOM(`<textarea id="bio">Original bio</textarea>`);
    const el = document.querySelector<HTMLTextAreaElement>("#bio")!;

    // Fill
    fillFormFields([
      {
        selector: "#bio",
        value: "New bio",
        inputType: "textarea",
        stableId: "af-0-bio",
      },
    ]);

    // Undo
    const result = undoFormFills([
      {
        selector: "#bio",
        previousValue: "Original bio",
        inputType: "textarea",
        stableId: "af-0-bio",
      },
    ]);

    expect(result.undone).toBe(1);
    expect(el.value).toBe("Original bio");
  });

  it("should restore select to previous value", () => {
    setupDOM(`
      <select id="country">
        <option value="">Select...</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
      </select>
    `);
    const el = document.querySelector<HTMLSelectElement>("#country")!;

    // Fill
    fillFormFields([
      {
        selector: "#country",
        value: "us",
        inputType: "select-one",
        stableId: "af-0-country",
      },
    ]);
    expect(el.value).toBe("us");

    // Undo
    const result = undoFormFills([
      {
        selector: "#country",
        previousValue: "",
        inputType: "select-one",
        stableId: "af-0-country",
      },
    ]);

    expect(result.undone).toBe(1);
    expect(el.value).toBe("");
  });

  it("should restore contenteditable to previous content", () => {
    setupDOM(`<div id="editor" contenteditable="true">Original</div>`);
    const el = document.querySelector<HTMLElement>("#editor")!;

    // Fill
    fillFormFields([
      {
        selector: "#editor",
        value: "Changed",
        inputType: "contenteditable",
        stableId: "af-0-editor",
      },
    ]);

    // Undo
    const result = undoFormFills([
      {
        selector: "#editor",
        previousValue: "Original",
        inputType: "contenteditable",
        stableId: "af-0-editor",
      },
    ]);

    expect(result.undone).toBe(1);
    expect(el.textContent).toBe("Original");
  });

  it("should handle missing elements during undo gracefully", () => {
    setupDOM(`<input id="exists" />`);

    const result = undoFormFills([
      {
        selector: "#nonexistent",
        previousValue: "",
        inputType: "text",
        stableId: "af-0-missing",
      },
    ]);

    expect(result.failed).toBe(1);
    expect(result.results[0].error).toContain("Element not found");
  });

  it("should report radio undo as not supported", () => {
    setupDOM(`<input id="radio1" type="radio" name="choice" />`);

    const result = undoFormFills([
      {
        selector: "#radio1",
        previousValue: "false",
        inputType: "radio",
        stableId: "af-0-radio",
      },
    ]);

    expect(result.failed).toBe(1);
    expect(result.results[0].error).toContain("Cannot undo radio");
  });
});
