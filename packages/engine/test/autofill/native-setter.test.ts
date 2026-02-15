import { describe, it, expect, beforeEach } from "vitest";
import {
  setFieldValue,
  setSelectValue,
  setCheckboxValue,
  setRadioValue,
  setContentEditableValue,
} from "../../src/autofill/native-setter";

describe("setFieldValue", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Sets value via property descriptor ───────────────────────────────────

  it("sets value on an input element", () => {
    document.body.innerHTML = `<input type="text" id="test" />`;
    const el = document.getElementById("test") as HTMLInputElement;

    setFieldValue(el, "Hello World");

    expect(el.value).toBe("Hello World");
  });

  // ─── Dispatches input, change, blur events in order ───────────────────────

  it("dispatches input, change, and blur events in correct order", () => {
    document.body.innerHTML = `<input type="text" id="test" />`;
    const el = document.getElementById("test") as HTMLInputElement;
    const events: string[] = [];

    el.addEventListener("input", () => events.push("input"));
    el.addEventListener("change", () => events.push("change"));
    el.addEventListener("blur", () => events.push("blur"));

    setFieldValue(el, "test value");

    expect(events).toEqual(["input", "change", "blur"]);
  });

  // ─── Sets value on textarea ───────────────────────────────────────────────

  it("sets value on a textarea element", () => {
    document.body.innerHTML = `<textarea id="test"></textarea>`;
    const el = document.getElementById("test") as HTMLTextAreaElement;

    setFieldValue(el, "Multi-line\ncontent here");

    expect(el.value).toBe("Multi-line\ncontent here");
  });

  // ─── Sets empty string ────────────────────────────────────────────────────

  it("sets empty string value", () => {
    document.body.innerHTML = `<input type="text" id="test" value="previous" />`;
    const el = document.getElementById("test") as HTMLInputElement;

    setFieldValue(el, "");

    expect(el.value).toBe("");
  });

  // ─── Events bubble ────────────────────────────────────────────────────────

  it("dispatches events that bubble", () => {
    document.body.innerHTML = `<form id="form"><input type="text" id="test" /></form>`;
    const el = document.getElementById("test") as HTMLInputElement;
    const form = document.getElementById("form")!;
    let bubbled = false;

    form.addEventListener("input", () => { bubbled = true; });

    setFieldValue(el, "bubble test");

    expect(bubbled).toBe(true);
  });
});

describe("setSelectValue", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="test">
        <option value="">-- Select --</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="CA">Canada</option>
      </select>
    `;
  });

  // ─── Exact value match → returns true ─────────────────────────────────────

  it("selects option by exact value match", () => {
    const el = document.getElementById("test") as HTMLSelectElement;

    const result = setSelectValue(el, "us");

    expect(result).toBe(true);
    expect(el.value).toBe("us");
  });

  // ─── Case-insensitive value match → returns true ──────────────────────────

  it("selects option by case-insensitive value match", () => {
    const el = document.getElementById("test") as HTMLSelectElement;

    const result = setSelectValue(el, "ca");

    expect(result).toBe(true);
    expect(el.value).toBe("CA");
  });

  // ─── Text content match → returns true ────────────────────────────────────

  it("selects option by case-insensitive text content match", () => {
    const el = document.getElementById("test") as HTMLSelectElement;

    const result = setSelectValue(el, "united states");

    expect(result).toBe(true);
    expect(el.value).toBe("us");
  });

  // ─── Substring match → returns true ───────────────────────────────────────

  it("selects option by substring match", () => {
    const el = document.getElementById("test") as HTMLSelectElement;

    const result = setSelectValue(el, "united");

    expect(result).toBe(true);
    // Should match "United States" first (us)
    expect(el.value).toBe("us");
  });

  // ─── No match → returns false ─────────────────────────────────────────────

  it("returns false when no matching option exists", () => {
    const el = document.getElementById("test") as HTMLSelectElement;

    const result = setSelectValue(el, "nonexistent");

    expect(result).toBe(false);
  });

  // ─── Dispatches change event ──────────────────────────────────────────────

  it("dispatches change event after selection", () => {
    const el = document.getElementById("test") as HTMLSelectElement;
    let changeDispatched = false;
    el.addEventListener("change", () => { changeDispatched = true; });

    setSelectValue(el, "uk");

    expect(changeDispatched).toBe(true);
  });
});

describe("setCheckboxValue", () => {
  beforeEach(() => {
    document.body.innerHTML = `<input type="checkbox" id="test" />`;
  });

  // ─── Checks when value is "true" ──────────────────────────────────────────

  it('checks checkbox when value is "true"', () => {
    const el = document.getElementById("test") as HTMLInputElement;

    setCheckboxValue(el, "true");

    expect(el.checked).toBe(true);
  });

  // ─── Unchecks when value is "false" ───────────────────────────────────────

  it('unchecks checkbox when value is "false"', () => {
    const el = document.getElementById("test") as HTMLInputElement;
    el.checked = true;

    setCheckboxValue(el, "false");

    expect(el.checked).toBe(false);
  });

  // ─── Handles "1", "yes", "on" as truthy ──────────────────────────────────

  it('handles "1", "yes", "on", "checked" as truthy values', () => {
    const el = document.getElementById("test") as HTMLInputElement;

    setCheckboxValue(el, "1");
    expect(el.checked).toBe(true);

    el.checked = false;
    setCheckboxValue(el, "yes");
    expect(el.checked).toBe(true);

    el.checked = false;
    setCheckboxValue(el, "on");
    expect(el.checked).toBe(true);

    el.checked = false;
    setCheckboxValue(el, "checked");
    expect(el.checked).toBe(true);
  });

  // ─── Does not toggle when already in desired state ────────────────────────

  it("does not toggle when already in desired state", () => {
    const el = document.getElementById("test") as HTMLInputElement;
    el.checked = true;
    let clickCount = 0;
    el.addEventListener("click", () => clickCount++);

    setCheckboxValue(el, "true");

    // Should not click because it's already checked
    expect(clickCount).toBe(0);
    expect(el.checked).toBe(true);
  });
});

describe("setRadioValue", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input type="radio" name="color" id="red" value="red" />
        <label for="red">Red</label>
        <input type="radio" name="color" id="blue" value="blue" />
        <label for="blue">Blue</label>
        <input type="radio" name="color" id="green" value="green" />
        <label for="green">Green</label>
      </form>
    `;
  });

  // ─── Selects correct radio in group ───────────────────────────────────────

  it("selects the correct radio button by value", () => {
    const el = document.getElementById("red") as HTMLInputElement;

    setRadioValue(el, "blue");

    const blue = document.getElementById("blue") as HTMLInputElement;
    expect(blue.checked).toBe(true);
  });

  // ─── Case-insensitive matching ────────────────────────────────────────────

  it("matches radio value case-insensitively", () => {
    const el = document.getElementById("red") as HTMLInputElement;

    setRadioValue(el, "GREEN");

    const green = document.getElementById("green") as HTMLInputElement;
    expect(green.checked).toBe(true);
  });

  // ─── Matches by ID ────────────────────────────────────────────────────────

  it("matches radio by id attribute", () => {
    const el = document.getElementById("red") as HTMLInputElement;

    setRadioValue(el, "blue");

    const blue = document.getElementById("blue") as HTMLInputElement;
    expect(blue.checked).toBe(true);
  });

  // ─── No name: toggles single radio ────────────────────────────────────────

  it("toggles single radio when no group name exists", () => {
    document.body.innerHTML = `<input type="radio" id="solo" />`;
    const el = document.getElementById("solo") as HTMLInputElement;

    setRadioValue(el, "any");

    expect(el.checked).toBe(true);
  });
});

describe("setContentEditableValue", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div contenteditable="true" id="test"></div>`;
  });

  // ─── Sets textContent + dispatches input event ────────────────────────────

  it("sets textContent and dispatches input event", () => {
    const el = document.getElementById("test") as HTMLElement;
    let inputFired = false;
    el.addEventListener("input", () => { inputFired = true; });

    setContentEditableValue(el, "Rich text content");

    expect(el.textContent).toBe("Rich text content");
    expect(inputFired).toBe(true);
  });

  // ─── Dispatches InputEvent with insertText type ───────────────────────────

  it('dispatches InputEvent with inputType "insertText"', () => {
    const el = document.getElementById("test") as HTMLElement;
    let receivedInputType: string | undefined;
    el.addEventListener("input", (e) => {
      receivedInputType = (e as InputEvent).inputType;
    });

    setContentEditableValue(el, "test");

    expect(receivedInputType).toBe("insertText");
  });

  // ─── Overwrites existing content ──────────────────────────────────────────

  it("overwrites existing contenteditable content", () => {
    const el = document.getElementById("test") as HTMLElement;
    el.textContent = "old content";

    setContentEditableValue(el, "new content");

    expect(el.textContent).toBe("new content");
  });
});
