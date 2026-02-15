import { describe, it, expect, beforeEach } from "vitest";
import { classifyField, classifyFields } from "../../src/autofill/field-classifier";
import { evaluateAllSignals } from "../../src/autofill/signal-evaluators";
import { detectFormFields } from "../../src/autofill/field-detector";

describe("classifyField", () => {
  // ─── autocomplete="given-name" → firstName ────────────────────────────────

  it('classifies autocomplete="given-name" as firstName with high confidence >= 0.9', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" autocomplete="given-name" name="fn" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "text", label: "First Name", signals });

    expect(result.fieldType).toBe("firstName");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  // ─── autocomplete="email" → email ────────────────────────────────────────

  it('classifies autocomplete="email" as email with high confidence', () => {
    document.body.innerHTML = `
      <form>
        <input type="email" autocomplete="email" name="em" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "email", label: "Email", signals });

    expect(result.fieldType).toBe("email");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  // ─── name="email" → email via name-id-regex ──────────────────────────────

  it('classifies name="email" as email via name-id-regex with confidence >= 0.8', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="email" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "text", label: "email", signals });

    expect(result.fieldType).toBe("email");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  // ─── name="first_name" → firstName via name-id-regex ─────────────────────

  it('classifies name="first_name" as firstName via name-id-regex', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="first_name" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "text", label: "first_name", signals });

    expect(result.fieldType).toBe("firstName");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  // ─── Inferrable: label="Years of experience" → yearsExperience ────────────

  it('classifies label "Years of experience" as yearsExperience', () => {
    document.body.innerHTML = `
      <form>
        <label for="yoe">Years of experience</label>
        <input type="number" id="yoe" name="yoe" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "number", label: "Years of experience", signals });

    expect(result.fieldType).toBe("yearsExperience");
  });

  // ─── Inferrable: placeholder="Enter your phone number" → phone ────────────

  it('classifies placeholder "Enter your phone number" as phone', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" placeholder="Enter your phone number" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "text", label: "Enter your phone number", signals });

    expect(result.fieldType).toBe("phone");
  });

  // ─── Unknown: unrecognizable label → unknown or customQuestion ────────────

  it("classifies unrecognizable fields as unknown or customQuestion with low confidence", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="xyzzy42" placeholder="Enter something random here" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "text", label: "something random", signals });

    expect(["unknown", "customQuestion"]).toContain(result.fieldType);
    expect(result.confidence).toBeLessThan(0.5);
  });

  // ─── Signal combination: autocomplete + label agreeing → boosted confidence

  it("boosts confidence when autocomplete and label signals agree", () => {
    document.body.innerHTML = `
      <form>
        <label for="email-field">Email Address</label>
        <input type="email" id="email-field" name="email" autocomplete="email" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "email", label: "Email Address", signals });

    // With autocomplete (0.95) + name-id-regex (0.85) + input-type (0.80) + label-for
    // confidence should be very high
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.fieldType).toBe("email");
  });

  // ─── No signals → unknown ─────────────────────────────────────────────────

  it("returns unknown with 0 confidence when there are no signals", () => {
    const result = classifyField({ inputType: "text", label: "", signals: [] });

    expect(result.fieldType).toBe("unknown");
    expect(result.confidence).toBe(0);
    expect(result.category).toBe("custom");
  });

  // ─── Input type signal: type="email" → email ─────────────────────────────

  it('uses input type signal: type="email" suggests email', () => {
    document.body.innerHTML = `
      <form>
        <input type="email" name="contact_email_field" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "email", label: "", signals });

    expect(result.fieldType).toBe("email");
  });

  // ─── Input type signal: type="tel" → phone ───────────────────────────────

  it('uses input type signal: type="tel" suggests phone', () => {
    document.body.innerHTML = `
      <form>
        <input type="tel" name="contact_tel_field" />
      </form>
    `;

    const el = document.querySelector("input")!;
    const signals = evaluateAllSignals(el, document, null);
    const result = classifyField({ inputType: "tel", label: "", signals });

    expect(result.fieldType).toBe("phone");
  });
});

describe("classifyFields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Batch classification of multiple fields ──────────────────────────────

  it("classifies multiple fields in batch", () => {
    document.body.innerHTML = `
      <form>
        <label for="fn">First Name</label>
        <input type="text" id="fn" name="first_name" autocomplete="given-name" />
        <label for="em">Email</label>
        <input type="email" id="em" name="email" autocomplete="email" />
        <label for="ph">Phone</label>
        <input type="tel" id="ph" name="phone" />
      </form>
    `;

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);

    expect(classified).toHaveLength(3);

    const types = classified.map((f) => f.fieldType);
    expect(types).toContain("firstName");
    expect(types).toContain("email");
    expect(types).toContain("phone");

    // All should have signals populated
    for (const field of classified) {
      expect(field.signals.length).toBeGreaterThan(0);
    }
  });

  // ─── Field not found in DOM → unknown ─────────────────────────────────────

  it("returns unknown for fields whose elements are not found in DOM", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="test" />
      </form>
    `;

    const detected = detectFormFields(document);

    // Remove the element from the DOM after detection
    document.body.innerHTML = "";

    const classified = classifyFields(detected, document);

    expect(classified[0].fieldType).toBe("unknown");
    expect(classified[0].confidence).toBe(0);
  });

  // ─── Category assignment: personal ────────────────────────────────────────

  it('assigns "personal" category to personal fields', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="first_name" autocomplete="given-name" />
        <input type="email" name="email" autocomplete="email" />
      </form>
    `;

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);

    const firstName = classified.find((f) => f.fieldType === "firstName");
    const email = classified.find((f) => f.fieldType === "email");

    expect(firstName?.category).toBe("personal");
    expect(email?.category).toBe("personal");
  });

  // ─── Category assignment: eeo ─────────────────────────────────────────────

  it('assigns "eeo" category to EEO fields', () => {
    document.body.innerHTML = `
      <form>
        <label for="gender">Gender</label>
        <select id="gender" name="gender">
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </form>
    `;

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);

    expect(classified[0].fieldType).toBe("eeoGender");
    expect(classified[0].category).toBe("eeo");
  });

  // ─── Category assignment: resume ──────────────────────────────────────────

  it('assigns "resume" category to resume-related fields', () => {
    document.body.innerHTML = `
      <form>
        <label for="resume">Resume</label>
        <input type="file" id="resume" name="resume" />
      </form>
    `;

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);

    expect(classified[0].fieldType).toBe("resumeUpload");
    expect(classified[0].category).toBe("resume");
  });
});
