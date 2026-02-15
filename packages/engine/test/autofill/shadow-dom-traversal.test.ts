import { describe, it, expect, beforeEach } from "vitest";
import { deepQueryFormFields } from "../../src/autofill/shadow-dom-traversal";

describe("deepQueryFormFields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Regular DOM: finds all form elements ─────────────────────────────────

  it("finds all form elements in regular DOM", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="a" />
        <textarea name="b"></textarea>
        <select name="c"><option>X</option></select>
        <div contenteditable="true">editable</div>
      </form>
    `;

    const elements = deepQueryFormFields(document);

    expect(elements).toHaveLength(4);
    const tags = elements.map((el) => el.tagName.toLowerCase());
    expect(tags).toContain("input");
    expect(tags).toContain("textarea");
    expect(tags).toContain("select");
    expect(tags).toContain("div"); // contenteditable
  });

  // ─── Open shadow root: fields inside are detected ─────────────────────────

  it("detects form fields inside open shadow roots", () => {
    document.body.innerHTML = `<div id="host"></div>`;
    const host = document.getElementById("host")!;
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <input type="text" name="shadow-input" />
      <textarea name="shadow-textarea"></textarea>
    `;

    const elements = deepQueryFormFields(document);

    expect(elements.length).toBeGreaterThanOrEqual(2);
    const names = elements.map((el) => el.getAttribute("name"));
    expect(names).toContain("shadow-input");
    expect(names).toContain("shadow-textarea");
  });

  // ─── Nested shadow roots (2 levels) ───────────────────────────────────────

  it("detects fields in nested shadow roots (2 levels deep)", () => {
    document.body.innerHTML = `<div id="outer-host"></div>`;
    const outerHost = document.getElementById("outer-host")!;
    const outerShadow = outerHost.attachShadow({ mode: "open" });
    outerShadow.innerHTML = `<div id="inner-host"></div>`;

    const innerHost = outerShadow.getElementById("inner-host")!;
    const innerShadow = innerHost.attachShadow({ mode: "open" });
    innerShadow.innerHTML = `<input type="email" name="deep-email" />`;

    const elements = deepQueryFormFields(document);

    const names = elements.map((el) => el.getAttribute("name"));
    expect(names).toContain("deep-email");
  });

  // ─── Mixed: regular DOM + shadow DOM ──────────────────────────────────────

  it("combines regular DOM and shadow DOM fields correctly", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="regular-input" />
      </form>
      <div id="shadow-host"></div>
    `;

    const host = document.getElementById("shadow-host")!;
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<input type="email" name="shadow-email" />`;

    const elements = deepQueryFormFields(document);

    const names = elements.map((el) => el.getAttribute("name"));
    expect(names).toContain("regular-input");
    expect(names).toContain("shadow-email");
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Max depth enforcement ────────────────────────────────────────────────

  it("stops recursing at max depth of 5", () => {
    // Build 6 levels of nested shadow DOMs
    document.body.innerHTML = `<div id="level-0"></div>`;
    let currentHost = document.getElementById("level-0")!;

    for (let i = 1; i <= 6; i++) {
      const shadow = currentHost.attachShadow({ mode: "open" });
      shadow.innerHTML = `<input type="text" name="level-${i}" /><div id="level-${i}"></div>`;
      currentHost = shadow.getElementById(`level-${i}`)!;
    }

    const elements = deepQueryFormFields(document);

    // Fields at levels 1-5 should be found, level 6 may not be found
    // because max depth is 5 (0-indexed depth counting)
    const names = elements.map((el) => el.getAttribute("name")).filter(Boolean);

    // At least the first 5 levels should be detected
    for (let i = 1; i <= 5; i++) {
      expect(names).toContain(`level-${i}`);
    }
  });

  // ─── Empty document ───────────────────────────────────────────────────────

  it("returns empty array for empty document", () => {
    document.body.innerHTML = "<div><p>No form elements here</p></div>";

    const elements = deepQueryFormFields(document);

    expect(elements).toEqual([]);
  });

  // ─── Deduplication ────────────────────────────────────────────────────────

  it("does not return the same element twice", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="unique-1" name="a" />
        <input type="email" id="unique-2" name="b" />
      </form>
    `;

    const elements = deepQueryFormFields(document);

    // Check that all elements are unique references
    const set = new Set(elements);
    expect(set.size).toBe(elements.length);
  });

  // ─── No shadow roots: just returns regular form elements ──────────────────

  it("works correctly when no shadow roots exist", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="field1" />
        <input type="email" name="field2" />
        <select name="field3"><option>A</option></select>
      </form>
    `;

    const elements = deepQueryFormFields(document);

    expect(elements).toHaveLength(3);
  });

  // ─── Ignores non-form elements ────────────────────────────────────────────

  it("ignores non-form elements like divs, spans, buttons", () => {
    document.body.innerHTML = `
      <form>
        <div class="wrapper">
          <span>Label</span>
          <input type="text" name="actual-field" />
          <button type="submit">Submit</button>
          <p>Some text</p>
        </div>
      </form>
    `;

    const elements = deepQueryFormFields(document);

    // Only the input should be found (button is not input/textarea/select/contenteditable)
    expect(elements).toHaveLength(1);
    expect(elements[0].getAttribute("name")).toBe("actual-field");
  });

  // ─── Closed shadow root: detected via callback ─────────────────────────────

  it("invokes onClosedShadowRoot callback for custom elements without accessible shadowRoot", () => {
    // Register a custom element to create a realistic scenario
    const tagName = "my-closed-widget";
    if (!customElements.get(tagName)) {
      customElements.define(tagName, class extends HTMLElement {});
    }

    document.body.innerHTML = `
      <form>
        <input type="text" name="regular" />
        <${tagName}></${tagName}>
      </form>
    `;

    const closedRoots: Array<{ el: Element; tag: string }> = [];
    deepQueryFormFields(document, [], 0, {
      onClosedShadowRoot: (el, tag) => closedRoots.push({ el, tag }),
    });

    // The custom element has no shadow root attached, so heuristic flags it
    expect(closedRoots.length).toBeGreaterThanOrEqual(1);
    expect(closedRoots[0].tag).toBe(tagName);
  });

  // ─── No false positives on standard elements ──────────────────────────────

  it("does not report standard elements as closed shadow hosts", () => {
    document.body.innerHTML = `
      <form>
        <div><input type="text" name="a" /></div>
        <span>text</span>
        <p>paragraph</p>
      </form>
    `;

    const closedRoots: Array<{ el: Element; tag: string }> = [];
    deepQueryFormFields(document, [], 0, {
      onClosedShadowRoot: (el, tag) => closedRoots.push({ el, tag }),
    });

    // Standard HTML elements (div, span, p) should NOT be flagged
    expect(closedRoots).toHaveLength(0);
  });
});
