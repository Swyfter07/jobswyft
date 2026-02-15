import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectFormFields, findFieldByOpid } from "../../src/autofill/field-detector";

describe("detectFormFields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Standard form: all input types detected ──────────────────────────────

  it("detects all standard form element types (text, email, tel, select, textarea, file, checkbox)", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="first_name" />
        <input type="email" name="email" />
        <input type="tel" name="phone" />
        <select name="country"><option value="us">US</option></select>
        <textarea name="cover_letter"></textarea>
        <input type="file" name="resume" />
        <input type="checkbox" name="terms" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields).toHaveLength(7);
    const inputTypes = fields.map((f) => f.inputType);
    expect(inputTypes).toContain("text");
    expect(inputTypes).toContain("email");
    expect(inputTypes).toContain("tel");
    expect(inputTypes).toContain("select");
    expect(inputTypes).toContain("textarea");
    expect(inputTypes).toContain("file");
    expect(inputTypes).toContain("checkbox");
  });

  // ─── opid assignment ──────────────────────────────────────────────────────

  it("assigns unique data-jf-opid attributes with format jf-field-{N}", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="a" />
        <input type="text" name="b" />
        <input type="text" name="c" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields).toHaveLength(3);
    expect(fields[0].stableId).toBe("jf-field-0");
    expect(fields[1].stableId).toBe("jf-field-1");
    expect(fields[2].stableId).toBe("jf-field-2");

    // Verify the DOM was actually tagged
    const taggedElements = document.querySelectorAll("[data-jf-opid]");
    expect(taggedElements).toHaveLength(3);
    expect(taggedElements[0].getAttribute("data-jf-opid")).toBe("jf-field-0");
    expect(taggedElements[1].getAttribute("data-jf-opid")).toBe("jf-field-1");
    expect(taggedElements[2].getAttribute("data-jf-opid")).toBe("jf-field-2");
  });

  // ─── stableId matches opid ────────────────────────────────────────────────

  it("sets stableId equal to the data-jf-opid value", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="test" />
      </form>
    `;

    const fields = detectFormFields(document);
    const el = document.querySelector("input");
    expect(fields[0].stableId).toBe(el?.getAttribute("data-jf-opid"));
  });

  // ─── selector format ──────────────────────────────────────────────────────

  it('uses selector format [data-jf-opid="jf-field-N"]', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="test1" />
        <input type="text" name="test2" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].selector).toBe('[data-jf-opid="jf-field-0"]');
    expect(fields[1].selector).toBe('[data-jf-opid="jf-field-1"]');
  });

  // ─── Label resolution: for-label ──────────────────────────────────────────

  it("resolves label via label[for=id]", () => {
    document.body.innerHTML = `
      <form>
        <label for="email-input">Email Address</label>
        <input type="email" id="email-input" name="email" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].label).toBe("Email Address");
  });

  // ─── Label resolution: aria-label ─────────────────────────────────────────

  it("resolves label via aria-label attribute", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" aria-label="Your Full Name" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].label).toBe("Your Full Name");
  });

  // ─── Label resolution: placeholder ────────────────────────────────────────

  it("resolves label via placeholder when no other label source exists", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" placeholder="Enter your phone number" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].label).toBe("Enter your phone number");
  });

  // ─── Label resolution: closest label ancestor ─────────────────────────────

  it("resolves label via closest label ancestor", () => {
    document.body.innerHTML = `
      <form>
        <label>Company Name <input type="text" name="company" /></label>
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].label).toContain("Company Name");
  });

  // ─── Label resolution: sibling text ───────────────────────────────────────

  it("resolves label via previous sibling text element", () => {
    document.body.innerHTML = `
      <form>
        <span>Years of Experience</span>
        <input type="number" name="experience" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].label).toBe("Years of Experience");
  });

  // ─── inputType correctly reported ─────────────────────────────────────────

  it("correctly reports inputType for each element type", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="t" />
        <input type="email" name="e" />
        <input type="tel" name="p" />
        <input type="url" name="u" />
        <input type="number" name="n" />
        <input type="date" name="d" />
        <input type="file" name="f" />
        <input type="checkbox" name="c" />
        <input type="radio" name="r" />
        <textarea name="ta"></textarea>
        <select name="s"><option>A</option></select>
        <div contenteditable="true">editable</div>
      </form>
    `;

    const fields = detectFormFields(document);
    const typeMap = new Map(fields.map((f) => [f.inputType, true]));

    expect(typeMap.has("text")).toBe(true);
    expect(typeMap.has("email")).toBe(true);
    expect(typeMap.has("tel")).toBe(true);
    expect(typeMap.has("url")).toBe(true);
    expect(typeMap.has("number")).toBe(true);
    expect(typeMap.has("date")).toBe(true);
    expect(typeMap.has("file")).toBe(true);
    expect(typeMap.has("checkbox")).toBe(true);
    expect(typeMap.has("radio")).toBe(true);
    expect(typeMap.has("textarea")).toBe(true);
    expect(typeMap.has("select")).toBe(true);
    expect(typeMap.has("contenteditable")).toBe(true);
  });

  // ─── isVisible: hidden fields ─────────────────────────────────────────────

  it("detects hidden fields with isVisible=false", () => {
    document.body.innerHTML = `
      <form>
        <input type="hidden" name="source" value="web" />
        <input type="text" name="visible_field" />
      </form>
    `;

    const fields = detectFormFields(document);

    const hiddenField = fields.find((f) => f.inputType === "hidden");
    const visibleField = fields.find((f) => f.inputType === "text");

    expect(hiddenField).toBeDefined();
    expect(hiddenField!.isVisible).toBe(false);
    expect(visibleField).toBeDefined();
    expect(visibleField!.isVisible).toBe(true);
  });

  // ─── isDisabled ───────────────────────────────────────────────────────────

  it("detects disabled fields with isDisabled=true", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="disabled_field" disabled />
        <input type="text" name="enabled_field" />
      </form>
    `;

    const fields = detectFormFields(document);

    const disabledField = fields.find((f) => f.label === "disabled_field" || f.stableId === "jf-field-0");
    const enabledField = fields.find((f) => f.label === "enabled_field" || f.stableId === "jf-field-1");

    expect(disabledField!.isDisabled).toBe(true);
    expect(enabledField!.isDisabled).toBe(false);
  });

  // ─── isRequired ───────────────────────────────────────────────────────────

  it("detects required fields with isRequired=true", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="required_field" required />
        <input type="text" name="optional_field" />
      </form>
    `;

    const fields = detectFormFields(document);

    const requiredField = fields.find((f) => f.stableId === "jf-field-0");
    const optionalField = fields.find((f) => f.stableId === "jf-field-1");

    expect(requiredField!.isRequired).toBe(true);
    expect(optionalField!.isRequired).toBe(false);
  });

  // ─── 200-field limit ──────────────────────────────────────────────────────

  it("enforces 200-field limit, prioritizing visible and required fields", () => {
    // Build a form with 250 fields: 100 visible+required, 100 visible+optional, 50 hidden
    let formHtml = "<form>";
    for (let i = 0; i < 100; i++) {
      formHtml += `<input type="text" name="vr_${i}" required />`;
    }
    for (let i = 0; i < 100; i++) {
      formHtml += `<input type="text" name="vo_${i}" />`;
    }
    for (let i = 0; i < 50; i++) {
      formHtml += `<input type="hidden" name="h_${i}" />`;
    }
    formHtml += "</form>";

    document.body.innerHTML = formHtml;

    const fields = detectFormFields(document);

    expect(fields).toHaveLength(200);

    // Visible required fields should come first
    const visibleRequired = fields.filter((f) => f.isVisible && f.isRequired);
    expect(visibleRequired.length).toBe(100);

    // All visible required should appear before non-required
    const firstNonRequiredIndex = fields.findIndex((f) => !f.isRequired);
    const lastRequiredIndex = fields.reduce(
      (maxIdx, f, i) => (f.isRequired ? i : maxIdx),
      -1,
    );
    expect(lastRequiredIndex).toBeLessThan(firstNonRequiredIndex === -1 ? Infinity : firstNonRequiredIndex);
  });

  // ─── Empty form ───────────────────────────────────────────────────────────

  it("returns empty array for a form with no fields", () => {
    document.body.innerHTML = "<div><p>No form here</p></div>";

    const fields = detectFormFields(document);

    expect(fields).toEqual([]);
  });

  // ─── currentValue: captures existing values ───────────────────────────────

  it("captures existing values from form fields", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="prefilled" value="Hello World" />
        <select name="country">
          <option value="us" selected>United States</option>
          <option value="uk">United Kingdom</option>
        </select>
        <textarea name="notes">Some notes here</textarea>
      </form>
    `;

    const fields = detectFormFields(document);

    const textField = fields.find((f) => f.inputType === "text");
    expect(textField!.currentValue).toBe("Hello World");

    const selectField = fields.find((f) => f.inputType === "select");
    expect(selectField!.currentValue).toBe("us");

    const textareaField = fields.find((f) => f.inputType === "textarea");
    expect(textareaField!.currentValue).toBe("Some notes here");
  });

  // ─── Duplicate elements not returned ──────────────────────────────────────

  it("does not return duplicate elements", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="unique1" />
        <input type="email" name="unique2" />
      </form>
    `;

    const fields = detectFormFields(document);

    const stableIds = fields.map((f) => f.stableId);
    const uniqueIds = new Set(stableIds);
    expect(stableIds.length).toBe(uniqueIds.size);
  });

  // ─── Default values for detected fields ───────────────────────────────────

  it("sets default fieldType to unknown, confidence to 0, and empty signals", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="test" />
      </form>
    `;

    const fields = detectFormFields(document);

    expect(fields[0].fieldType).toBe("unknown");
    expect(fields[0].confidence).toBe(0);
    expect(fields[0].signals).toEqual([]);
    expect(fields[0].category).toBe("custom");
    expect(fields[0].registryEntryId).toBeNull();
    expect(fields[0].frameId).toBe(0);
  });

  // ─── Fixture: standard-form.html ──────────────────────────────────────────

  it("detects fields from the standard-form.html fixture", () => {
    const fixtureDir = resolve(__dirname, "../fixtures/forms");
    const html = readFileSync(resolve(fixtureDir, "standard-form.html"), "utf-8");
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    document.body.innerHTML = bodyMatch ? bodyMatch[1] : html;

    const fields = detectFormFields(document);

    // Standard form has: fname, lname, email, phone, cover_letter, country, resume, terms, hidden source
    expect(fields.length).toBeGreaterThanOrEqual(8);

    // All fields should have selectors that work
    for (const field of fields) {
      const el = document.querySelector(field.selector);
      expect(el).not.toBeNull();
    }
  });

  // ─── Board option passed through ─────────────────────────────────────────

  it("passes board option to detected fields", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="test" />
      </form>
    `;

    const fields = detectFormFields(document, { board: "greenhouse" });

    expect(fields[0].board).toBe("greenhouse");
  });
});

describe("findFieldByOpid", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Returns correct element ──────────────────────────────────────────────

  it("returns the correct element by opid", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="first" />
        <input type="email" name="second" />
      </form>
    `;

    // Detect to assign opids
    detectFormFields(document);

    const el = findFieldByOpid(document, "jf-field-1");
    expect(el).not.toBeNull();
    expect(el?.getAttribute("name")).toBe("second");
  });

  // ─── Returns null for non-existent opid ───────────────────────────────────

  it("returns null for a non-existent opid", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="test" />
      </form>
    `;

    detectFormFields(document);

    const el = findFieldByOpid(document, "jf-field-999");
    expect(el).toBeNull();
  });
});
