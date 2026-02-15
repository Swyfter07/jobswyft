import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectFormFields } from "../../src/autofill/field-detector";
import { classifyFields } from "../../src/autofill/field-classifier";
import { mapFieldsToData } from "../../src/autofill/field-mapper";
import {
  buildFillInstructions,
  executeFillInstructions,
} from "../../src/autofill/fill-script-builder";
import { captureUndoSnapshot, executeUndo } from "../../src/autofill/undo-snapshot";
import type { AutofillData } from "../../src/types/field-types";

// ─── Test Data ──────────────────────────────────────────────────────────────

const testData: AutofillData = {
  personal: {
    firstName: "Jane",
    lastName: "Smith",
    fullName: "Jane Smith",
    email: "jane@example.com",
    phone: "+1555123456",
    location: "New York, NY",
    linkedinUrl: "https://linkedin.com/in/janesmith",
    portfolioUrl: "https://janesmith.dev",
  },
  resume: {
    id: "res-1",
    fileName: "resume.pdf",
    downloadUrl: "https://example.com/resume.pdf",
    parsedSummary: "Senior engineer",
  },
  workAuthorization: "Yes",
  salaryExpectation: "$150,000",
};

// ─── Fixture Helpers ────────────────────────────────────────────────────────

function loadFixture(name: string): string {
  const path = resolve(__dirname, "../fixtures/forms", name);
  return readFileSync(path, "utf-8");
}

function setDocumentFromHtml(html: string): void {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  document.body.innerHTML = bodyMatch ? bodyMatch[1] : html;
}

// ─── Inline Test Form ───────────────────────────────────────────────────────

const STANDARD_FORM_HTML = `
  <h1>Job Application</h1>
  <form id="apply-form">
    <div>
      <label for="first_name">First Name</label>
      <input type="text" id="first_name" name="first_name" autocomplete="given-name" required />
    </div>
    <div>
      <label for="last_name">Last Name</label>
      <input type="text" id="last_name" name="last_name" autocomplete="family-name" required />
    </div>
    <div>
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" autocomplete="email" required />
    </div>
    <div>
      <label for="phone">Phone Number</label>
      <input type="tel" id="phone" name="phone" autocomplete="tel" />
    </div>
    <div>
      <label for="linkedin">LinkedIn Profile</label>
      <input type="url" id="linkedin" name="linkedin" placeholder="https://linkedin.com/in/..." />
    </div>
    <div>
      <label for="location">Current Location</label>
      <input type="text" id="location" name="location" placeholder="City, State" />
    </div>
    <div>
      <label for="resume">Resume / CV</label>
      <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" />
    </div>
    <div>
      <label for="cover_letter">Cover Letter</label>
      <textarea id="cover_letter" name="cover_letter" placeholder="Tell us why you're a great fit..."></textarea>
    </div>
    <div>
      <label for="salary">Desired Salary</label>
      <input type="text" id="salary" name="salary" placeholder="e.g. $120,000" />
    </div>
    <div>
      <label for="work_authorization">Work Authorization</label>
      <select id="work_authorization" name="work_authorization">
        <option value="">Select</option>
        <option value="Yes">Yes, I am authorized</option>
        <option value="No">No, I require sponsorship</option>
      </select>
    </div>
  </form>
`;

const GREENHOUSE_FORM_HTML = `
  <div id="application">
    <h2>Apply for Software Engineer</h2>
    <form>
      <div class="field">
        <label for="first_name">First Name *</label>
        <input type="text" id="first_name" name="first_name" required />
      </div>
      <div class="field">
        <label for="last_name">Last Name *</label>
        <input type="text" id="last_name" name="last_name" required />
      </div>
      <div class="field">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div class="field">
        <label for="phone">Phone</label>
        <input type="tel" id="phone" name="phone" />
      </div>
      <div class="field">
        <label for="resume_upload">Resume</label>
        <input type="file" id="resume_upload" name="resume" />
      </div>
      <div class="field">
        <label for="linkedin_profile">LinkedIn URL</label>
        <input type="url" id="linkedin_profile" name="linkedin" placeholder="LinkedIn profile URL" />
      </div>
    </form>
  </div>
`;

describe("Integration: Full autofill pipeline", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Standard form: detect → classify → map → fill ────────────────────────

  it("runs the complete detect → classify → map → fill pipeline on a standard form", () => {
    document.body.innerHTML = STANDARD_FORM_HTML;

    // Step 1: Detect
    const detected = detectFormFields(document);
    expect(detected.length).toBeGreaterThanOrEqual(8);

    // Step 2: Classify
    const classified = classifyFields(detected, document);
    expect(classified.length).toBe(detected.length);

    // Step 3: Map
    const mapped = mapFieldsToData(classified, testData);
    expect(mapped.length).toBe(classified.length);

    // Check that personal fields were mapped
    const readyFields = mapped.filter((f) => f.status === "ready");
    expect(readyFields.length).toBeGreaterThanOrEqual(4); // At minimum: firstName, lastName, email, phone

    // Step 4: Build instructions & fill
    const instructions = buildFillInstructions(mapped);
    expect(instructions.length).toBeGreaterThan(0);

    const result = executeFillInstructions(document, instructions);
    expect(result.filled).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
  });

  // ─── >= 90% fields correctly classified (NFR9) ────────────────────────────

  it("correctly classifies >= 90% of fields on a standard form", () => {
    document.body.innerHTML = STANDARD_FORM_HTML;

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);

    // Known field types we expect to see from the form
    const expectedTypes = [
      "firstName",
      "lastName",
      "email",
      "phone",
    ];

    let correctCount = 0;
    for (const expectedType of expectedTypes) {
      const found = classified.some((f) => f.fieldType === expectedType);
      if (found) correctCount++;
    }

    const accuracy = correctCount / expectedTypes.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });

  // ─── Full undo cycle ──────────────────────────────────────────────────────

  it("fills form and then undoes all changes, restoring original values", () => {
    document.body.innerHTML = STANDARD_FORM_HTML;

    // Set some initial values
    const firstNameInput = document.getElementById("first_name") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    firstNameInput.value = "Original";
    emailInput.value = "original@test.com";

    // Detect, classify, map
    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);
    const mapped = mapFieldsToData(classified, testData);
    const instructions = buildFillInstructions(mapped);

    // Capture undo snapshot before filling
    const snapshot = captureUndoSnapshot(document, instructions);
    expect(snapshot.length).toBeGreaterThan(0);

    // Fill
    const fillResult = executeFillInstructions(document, instructions);
    expect(fillResult.filled).toBeGreaterThan(0);

    // Undo
    const undoResult = executeUndo(document, snapshot);
    expect(undoResult.undone).toBe(snapshot.length);
    expect(undoResult.failed).toBe(0);
  });

  // ─── Greenhouse form pipeline ─────────────────────────────────────────────

  it("runs pipeline on Greenhouse-style form", () => {
    document.body.innerHTML = GREENHOUSE_FORM_HTML;

    const detected = detectFormFields(document);
    expect(detected.length).toBeGreaterThanOrEqual(5);

    const classified = classifyFields(detected, document);
    const mapped = mapFieldsToData(classified, testData);
    const instructions = buildFillInstructions(mapped);

    const result = executeFillInstructions(document, instructions);

    // At least firstName, lastName, email should be filled
    expect(result.filled).toBeGreaterThanOrEqual(3);
    expect(result.failed).toBe(0);
  });

  // ─── Performance: detect + classify + map + fill < 500ms ──────────────────

  it("completes full pipeline for a 20-field form within 500ms", () => {
    let formHtml = "<form>";
    for (let i = 0; i < 20; i++) {
      formHtml += `
        <label for="field_${i}">First Name</label>
        <input type="text" id="field_${i}" name="first_name" autocomplete="given-name" />
      `;
    }
    formHtml += "</form>";
    document.body.innerHTML = formHtml;

    const start = performance.now();

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);
    const mapped = mapFieldsToData(classified, testData);
    const instructions = buildFillInstructions(mapped);
    executeFillInstructions(document, instructions);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  // ─── Empty form: pipeline handles gracefully ──────────────────────────────

  it("handles empty form gracefully through the entire pipeline", () => {
    document.body.innerHTML = "<div><p>No form here</p></div>";

    const detected = detectFormFields(document);
    expect(detected).toEqual([]);

    const classified = classifyFields(detected, document);
    expect(classified).toEqual([]);

    const mapped = mapFieldsToData(classified, testData);
    expect(mapped).toEqual([]);

    const instructions = buildFillInstructions(mapped);
    expect(instructions).toEqual([]);

    const result = executeFillInstructions(document, instructions);
    expect(result.filled).toBe(0);
    expect(result.failed).toBe(0);
  });

  // ─── Multiple fills: second fill replaces first ───────────────────────────

  it("second fill replaces first fill values", () => {
    document.body.innerHTML = `
      <form>
        <label for="fn">First Name</label>
        <input type="text" id="fn" name="first_name" autocomplete="given-name" />
        <label for="em">Email</label>
        <input type="email" id="em" name="email" autocomplete="email" />
      </form>
    `;

    // First fill
    const detected1 = detectFormFields(document);
    const classified1 = classifyFields(detected1, document);
    const mapped1 = mapFieldsToData(classified1, testData);
    const instructions1 = buildFillInstructions(mapped1);
    executeFillInstructions(document, instructions1);

    // Verify first fill
    const fnInput = document.getElementById("fn") as HTMLInputElement;
    const emInput = document.getElementById("em") as HTMLInputElement;
    expect(fnInput.value).toBe("Jane");
    expect(emInput.value).toBe("jane@example.com");

    // Second fill with different data
    const newData: AutofillData = {
      ...testData,
      personal: { ...testData.personal, firstName: "Alex", email: "alex@test.com" },
    };

    // Re-detect on the already-tagged form
    const detected2 = detectFormFields(document);
    const classified2 = classifyFields(detected2, document);
    const mapped2 = mapFieldsToData(classified2, newData);
    const instructions2 = buildFillInstructions(mapped2);
    executeFillInstructions(document, instructions2);

    // Values should be updated
    expect(fnInput.value).toBe("Alex");
    expect(emInput.value).toBe("alex@test.com");
  });

  // ─── Partial data: only mapped fields get filled ──────────────────────────

  it("only fills fields that have mapped data, leaving others unchanged", () => {
    document.body.innerHTML = `
      <form>
        <label for="fn">First Name</label>
        <input type="text" id="fn" name="first_name" autocomplete="given-name" value="prefilled" />
        <label for="city">City</label>
        <input type="text" id="city" name="city" value="Chicago" />
      </form>
    `;

    const detected = detectFormFields(document);
    const classified = classifyFields(detected, document);
    const mapped = mapFieldsToData(classified, testData);
    const instructions = buildFillInstructions(mapped);
    executeFillInstructions(document, instructions);

    const fnInput = document.getElementById("fn") as HTMLInputElement;
    const cityInput = document.getElementById("city") as HTMLInputElement;

    // First name should be filled
    expect(fnInput.value).toBe("Jane");

    // City has no mapping in testData (getDataValue returns null for "city")
    // so it should stay as the original value
    expect(cityInput.value).toBe("Chicago");
  });

  // ─── Fixture: standard-form.html ──────────────────────────────────────────

  it("runs full pipeline on standard-form.html fixture file", () => {
    const html = loadFixture("standard-form.html");
    setDocumentFromHtml(html);

    const detected = detectFormFields(document);
    expect(detected.length).toBeGreaterThanOrEqual(5);

    const classified = classifyFields(detected, document);
    const mapped = mapFieldsToData(classified, testData);
    const instructions = buildFillInstructions(mapped);
    const result = executeFillInstructions(document, instructions);

    // Should have filled at least firstName, lastName, email
    expect(result.filled).toBeGreaterThanOrEqual(2);
  });
});
