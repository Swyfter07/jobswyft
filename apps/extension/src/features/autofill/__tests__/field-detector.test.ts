/**
 * Field Detector Tests — Tests the pure injectable detectFormFields function.
 *
 * Uses JSDOM fixtures to simulate ATS-specific HTML forms.
 * Verifies detection accuracy, audit trail completeness, and board filtering.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { detectFormFields } from "../field-detector";
import { AUTOFILL_FIELD_REGISTRY } from "../field-registry";

// Serialize registry same way the autofill-tab does
const REGISTRY = AUTOFILL_FIELD_REGISTRY.map((e) => ({
  id: e.id,
  board: e.board,
  fieldType: e.fieldType,
  selectors: e.selectors,
  priority: e.priority,
  status: e.status,
}));

// Polyfill CSS.escape for JSDOM (not available in JSDOM by default)
beforeAll(() => {
  if (typeof globalThis.CSS === "undefined") {
    (globalThis as Record<string, unknown>).CSS = {};
  }
  if (typeof CSS.escape !== "function") {
    CSS.escape = (str: string) =>
      str.replace(/([^\w-])/g, "\\$1");
  }
});

function setupDOM(html: string) {
  document.body.innerHTML = html;
}

describe("detectFormFields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Greenhouse Form ──────────────────────────────────────────────

  describe("Greenhouse form", () => {
    beforeEach(() => {
      setupDOM(`
        <form>
          <div>
            <label for="first_name">First Name *</label>
            <input id="first_name" name="job_application[first_name]" type="text" required />
          </div>
          <div>
            <label for="last_name">Last Name *</label>
            <input id="last_name" name="job_application[last_name]" type="text" required />
          </div>
          <div>
            <label for="email">Email *</label>
            <input id="email" name="job_application[email]" type="email" required />
          </div>
          <div>
            <label for="phone">Phone</label>
            <input id="phone" name="job_application[phone]" type="tel" />
          </div>
          <div>
            <label for="resume_file">Resume/CV *</label>
            <input id="resume_file" name="resume" type="file" accept=".pdf,.doc,.docx" required />
          </div>
          <div>
            <label for="linkedin">LinkedIn Profile</label>
            <input id="linkedin" name="job_application[linkedin_url]" type="url" />
          </div>
        </form>
      `);
    });

    it("detects all core Greenhouse fields", () => {
      const result = detectFormFields("greenhouse", REGISTRY);
      expect(result.fields.length).toBeGreaterThanOrEqual(5);

      const types = result.fields.map((f) => f.fieldType);
      expect(types).toContain("firstName");
      expect(types).toContain("lastName");
      expect(types).toContain("email");
      expect(types).toContain("phone");
      expect(types).toContain("resumeUpload");
    });

    it("has audit trail for each field", () => {
      const result = detectFormFields("greenhouse", REGISTRY);
      for (const field of result.fields) {
        expect(field.signals).toBeDefined();
        expect(field.signals.length).toBeGreaterThan(0);
        // Each signal has required properties
        for (const signal of field.signals) {
          expect(signal).toHaveProperty("signal");
          expect(signal).toHaveProperty("rawValue");
          expect(signal).toHaveProperty("suggestedType");
          expect(signal).toHaveProperty("weight");
          expect(signal).toHaveProperty("matched");
          expect(signal).toHaveProperty("reason");
        }
      }
    });

    it("assigns high confidence to board-matched fields", () => {
      const result = detectFormFields("greenhouse", REGISTRY);
      const firstName = result.fields.find((f) => f.fieldType === "firstName");
      expect(firstName).toBeDefined();
      expect(firstName!.confidence).toBeGreaterThan(0.7);
    });

    it("detects required fields", () => {
      const result = detectFormFields("greenhouse", REGISTRY);
      const firstName = result.fields.find((f) => f.fieldType === "firstName");
      expect(firstName?.isRequired).toBe(true);
    });

    it("records board in result", () => {
      const result = detectFormFields("greenhouse", REGISTRY);
      expect(result.board).toBe("greenhouse");
    });
  });

  // ─── Generic Form (autocomplete + name attributes) ────────────────

  describe("Generic form with autocomplete", () => {
    beforeEach(() => {
      setupDOM(`
        <form>
          <input autocomplete="given-name" name="first_name" />
          <input autocomplete="family-name" name="last_name" />
          <input autocomplete="email" type="email" name="email_address" />
          <input autocomplete="tel" type="tel" name="phone_number" />
          <input type="url" name="website" placeholder="Your website" />
        </form>
      `);
    });

    it("detects fields via autocomplete attributes", () => {
      const result = detectFormFields(null, REGISTRY);
      const types = result.fields.map((f) => f.fieldType);
      expect(types).toContain("firstName");
      expect(types).toContain("lastName");
      expect(types).toContain("email");
      expect(types).toContain("phone");
    });

    it("autocomplete signals have high confidence", () => {
      const result = detectFormFields(null, REGISTRY);
      const email = result.fields.find((f) => f.fieldType === "email");
      expect(email).toBeDefined();
      // autocomplete (0.95) + input-type (0.80) + name-id-regex (0.85) → very high
      expect(email!.confidence).toBeGreaterThan(0.8);
    });
  });

  // ─── Workday Form (data-automation-id) ────────────────────────────

  describe("Workday form with data-automation-id", () => {
    beforeEach(() => {
      setupDOM(`
        <form>
          <div data-automation-id="legalNameSection_firstName">
            <label>Legal First Name</label>
            <input type="text" name="firstName" />
          </div>
          <div data-automation-id="legalNameSection_lastName">
            <label>Legal Last Name</label>
            <input type="text" name="lastName" />
          </div>
          <div>
            <input data-automation-id="email" type="email" name="email" />
          </div>
        </form>
      `);
    });

    it("detects Workday fields via data-automation-id and label context", () => {
      const result = detectFormFields("workday", REGISTRY);
      const types = result.fields.map((f) => f.fieldType);
      expect(types).toContain("firstName");
      expect(types).toContain("lastName");
      expect(types).toContain("email");
    });
  });

  // ─── Field visibility filtering ───────────────────────────────────

  describe("Visibility filtering", () => {
    // Note: JSDOM doesn't compute CSS styles, so getComputedStyle always returns defaults.
    // Visibility-based tests are best verified in integration (real browser).
    // Here we test the structural aspects.
    it("detects both visible and hidden fields", () => {
      setupDOM(`
        <form>
          <input name="email" type="email" style="display:none" />
          <input name="phone" type="tel" />
        </form>
      `);
      const result = detectFormFields(null, REGISTRY);
      const email = result.fields.find((f) => f.fieldType === "email");
      const phone = result.fields.find((f) => f.fieldType === "phone");
      // Both fields should be detected
      expect(email).toBeDefined();
      expect(phone).toBeDefined();
    });

    it("skips disabled fields", () => {
      setupDOM(`
        <form>
          <input name="email" type="email" disabled />
          <input name="phone" type="tel" />
        </form>
      `);
      const result = detectFormFields(null, REGISTRY);
      // Only phone should be detected (email is disabled)
      const types = result.fields.map((f) => f.fieldType);
      expect(types).not.toContain("email");
      expect(types).toContain("phone");
    });
  });

  // ─── Board filtering ──────────────────────────────────────────────

  describe("Board filtering", () => {
    it("only uses board + generic registry entries", () => {
      setupDOM(`
        <form>
          <input id="first_name" name="job_application[first_name]" type="text" />
        </form>
      `);

      // When board is "lever", greenhouse-specific selectors should NOT match
      const leverResult = detectFormFields("lever", REGISTRY);
      const ghResult = detectFormFields("greenhouse", REGISTRY);

      // Greenhouse board should match the gh-specific selector
      const ghField = ghResult.fields.find((f) => f.registryEntryId?.startsWith("gh-"));
      expect(ghField).toBeDefined();

      // Lever board should NOT match greenhouse selectors
      const leverGhField = leverResult.fields.find((f) => f.registryEntryId?.startsWith("gh-"));
      expect(leverGhField).toBeUndefined();
    });

    it("skips deprecated registry entries", () => {
      const registryWithDeprecated = [
        ...REGISTRY,
        {
          id: "test-deprecated",
          board: "generic",
          fieldType: "email",
          selectors: ['input[name="test_email"]'],
          priority: 1,
          status: "deprecated",
        },
      ];
      setupDOM(`<form><input name="test_email" type="text" /></form>`);

      const result = detectFormFields(null, registryWithDeprecated);
      const depMatch = result.fields.find((f) => f.registryEntryId === "test-deprecated");
      expect(depMatch).toBeUndefined();
    });
  });

  // ─── De-duplication ───────────────────────────────────────────────

  describe("De-duplication", () => {
    it("does not duplicate fields with same selector", () => {
      setupDOM(`
        <form>
          <input id="email" name="email" type="email" autocomplete="email" />
        </form>
      `);
      const result = detectFormFields(null, REGISTRY);
      const emailFields = result.fields.filter((f) => f.fieldType === "email");
      expect(emailFields.length).toBe(1);
    });
  });

  // ─── Result metadata ─────────────────────────────────────────────

  describe("Result metadata", () => {
    it("includes URL, timestamp, duration", () => {
      setupDOM(`<form><input name="email" type="email" /></form>`);
      const result = detectFormFields(null, REGISTRY);
      expect(result.url).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.totalElementsScanned).toBeGreaterThan(0);
    });

    it("assigns stable IDs to fields", () => {
      setupDOM(`
        <form>
          <input name="first_name" type="text" />
          <input name="email" type="email" />
        </form>
      `);
      const result = detectFormFields(null, REGISTRY);
      for (const field of result.fields) {
        expect(field.stableId).toMatch(/^af-\d+-/);
      }

      // Stable IDs should be unique
      const ids = result.fields.map((f) => f.stableId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ─── EEO Fields ───────────────────────────────────────────────────

  describe("EEO fields", () => {
    it("detects gender/race/veteran/disability fields", () => {
      setupDOM(`
        <form>
          <label for="gender">Gender</label>
          <select id="gender" name="gender">
            <option>Male</option>
            <option>Female</option>
          </select>
          <label for="race">Race / Ethnicity</label>
          <select id="race" name="race_ethnicity">
            <option>Choose</option>
          </select>
          <label for="veteran">Veteran Status</label>
          <select id="veteran" name="veteran_status">
            <option>Choose</option>
          </select>
          <label for="disability">Disability Status</label>
          <select id="disability" name="disability_status">
            <option>Choose</option>
          </select>
        </form>
      `);

      const result = detectFormFields(null, REGISTRY);
      const types = result.fields.map((f) => f.fieldType);
      expect(types).toContain("eeoGender");
      expect(types).toContain("eeoRaceEthnicity");
      expect(types).toContain("eeoVeteranStatus");
      expect(types).toContain("eeoDisabilityStatus");

      // EEO fields should be categorized as "eeo"
      const eeoFields = result.fields.filter((f) => f.category === "eeo");
      expect(eeoFields.length).toBe(4);
    });
  });
});
