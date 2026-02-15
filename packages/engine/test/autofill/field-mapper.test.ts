import { describe, it, expect } from "vitest";
import { mapFieldsToData, getDataValue } from "../../src/autofill/field-mapper";
import type {
  DetectedField,
  AutofillData,
  FieldCategory,
  AutofillFieldType,
  SignalEvaluation,
} from "../../src/types/field-types";

// ─── Mock Helpers ───────────────────────────────────────────────────────────

function mockField(overrides: Partial<DetectedField>): DetectedField {
  return {
    stableId: "jf-field-0",
    selector: '[data-jf-opid="jf-field-0"]',
    label: "",
    fieldType: "unknown" as AutofillFieldType,
    confidence: 0.9,
    category: "custom" as FieldCategory,
    isRequired: false,
    isVisible: true,
    isDisabled: false,
    currentValue: "",
    inputType: "text",
    signals: [] as SignalEvaluation[],
    registryEntryId: null,
    board: null,
    frameId: 0,
    ...overrides,
  };
}

const mockData: AutofillData = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    location: "San Francisco, CA",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    portfolioUrl: "https://johndoe.dev",
  },
  resume: {
    id: "res-1",
    fileName: "resume.pdf",
    downloadUrl: "https://example.com/resume.pdf",
    parsedSummary: "Software engineer with 5 years experience",
  },
  workAuthorization: "Yes",
  salaryExpectation: "$120,000",
};

describe("mapFieldsToData", () => {
  // ─── Full mapping: firstName → "John" ─────────────────────────────────────

  it("maps firstName field to personal.firstName value", () => {
    const fields = [mockField({ fieldType: "firstName", category: "personal" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].mappedValue).toBe("John");
    expect(mapped[0].valueSource).toBe("personal");
  });

  // ─── Full mapping: email → "john@example.com" ────────────────────────────

  it("maps email field to personal.email value", () => {
    const fields = [mockField({ fieldType: "email", category: "personal" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].mappedValue).toBe("john@example.com");
    expect(mapped[0].valueSource).toBe("personal");
  });

  // ─── Full mapping: phone → "+1234567890" ──────────────────────────────────

  it("maps phone field to personal.phone value", () => {
    const fields = [mockField({ fieldType: "phone", category: "personal" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].mappedValue).toBe("+1234567890");
    expect(mapped[0].valueSource).toBe("personal");
  });

  // ─── Partial mapping: field has data → status "ready" ────────────────────

  it('sets status to "ready" when data is available for the field type', () => {
    const fields = [
      mockField({ stableId: "jf-field-0", fieldType: "firstName", category: "personal" }),
      mockField({ stableId: "jf-field-1", fieldType: "email", category: "personal" }),
      mockField({ stableId: "jf-field-2", fieldType: "linkedinUrl", category: "personal" }),
    ];

    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("ready");
    expect(mapped[1].status).toBe("ready");
    expect(mapped[2].status).toBe("ready");
  });

  // ─── Missing data → status "missing" ─────────────────────────────────────

  it('sets status to "missing" when no data is available for the field type', () => {
    const fields = [
      mockField({ fieldType: "city", category: "personal" }),
      mockField({ stableId: "jf-field-1", fieldType: "eeoGender", category: "eeo" }),
    ];

    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("missing");
    expect(mapped[0].mappedValue).toBeNull();
    expect(mapped[1].status).toBe("missing");
  });

  // ─── Unknown field → status "skipped" ─────────────────────────────────────

  it('sets status to "skipped" for unknown fieldType', () => {
    const fields = [mockField({ fieldType: "unknown" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("skipped");
    expect(mapped[0].mappedValue).toBeNull();
    expect(mapped[0].valueSource).toBeNull();
  });

  // ─── Custom question → status "skipped" ───────────────────────────────────

  it('sets status to "skipped" for customQuestion fieldType', () => {
    const fields = [mockField({ fieldType: "customQuestion" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("skipped");
    expect(mapped[0].mappedValue).toBeNull();
  });

  // ─── File upload: resumeUpload with resume → "ready" ─────────────────────

  it('sets resumeUpload to "ready" when resume data is available', () => {
    const fields = [mockField({ fieldType: "resumeUpload", inputType: "file", category: "resume" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("ready");
    expect(mapped[0].mappedValue).toBe("resume.pdf");
    expect(mapped[0].valueSource).toBe("resume");
  });

  // ─── File upload: resumeUpload without resume → "missing" ────────────────

  it('sets resumeUpload to "missing" when resume data is null', () => {
    const noResumeData: AutofillData = { ...mockData, resume: null };
    const fields = [mockField({ fieldType: "resumeUpload", inputType: "file", category: "resume" })];
    const mapped = mapFieldsToData(fields, noResumeData);

    expect(mapped[0].status).toBe("missing");
  });

  // ─── coverLetterUpload → "skipped" ───────────────────────────────────────

  it('sets coverLetterUpload to "skipped" (extension adapter scope)', () => {
    const fields = [mockField({ fieldType: "coverLetterUpload", inputType: "file", category: "resume" })];
    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("skipped");
  });

  // ─── Maps workAuthorization and salary ────────────────────────────────────

  it("maps workAuthorization and salary fields correctly", () => {
    const fields = [
      mockField({ stableId: "jf-field-0", fieldType: "workAuthorization", category: "authorization" }),
      mockField({ stableId: "jf-field-1", fieldType: "salary", category: "professional" }),
    ];

    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped[0].status).toBe("ready");
    expect(mapped[0].mappedValue).toBe("Yes");

    expect(mapped[1].status).toBe("ready");
    expect(mapped[1].mappedValue).toBe("$120,000");
  });

  // ─── Multiple fields mapped in batch ──────────────────────────────────────

  it("maps multiple fields in a single call preserving order", () => {
    const fields = [
      mockField({ stableId: "jf-field-0", fieldType: "firstName", category: "personal" }),
      mockField({ stableId: "jf-field-1", fieldType: "lastName", category: "personal" }),
      mockField({ stableId: "jf-field-2", fieldType: "email", category: "personal" }),
      mockField({ stableId: "jf-field-3", fieldType: "phone", category: "personal" }),
    ];

    const mapped = mapFieldsToData(fields, mockData);

    expect(mapped).toHaveLength(4);
    expect(mapped[0].mappedValue).toBe("John");
    expect(mapped[1].mappedValue).toBe("Doe");
    expect(mapped[2].mappedValue).toBe("john@example.com");
    expect(mapped[3].mappedValue).toBe("+1234567890");
  });
});

describe("getDataValue", () => {
  // ─── firstName → personal.firstName ───────────────────────────────────────

  it("returns personal.firstName for firstName field type", () => {
    const result = getDataValue("firstName", mockData);
    expect(result.value).toBe("John");
    expect(result.source).toBe("personal");
  });

  // ─── fullName fallback from firstName + lastName ──────────────────────────

  it("constructs fullName from firstName + lastName when fullName is null", () => {
    const dataNoFullName: AutofillData = {
      ...mockData,
      personal: { ...mockData.personal, fullName: null },
    };

    const result = getDataValue("fullName", dataNoFullName);
    expect(result.value).toBe("John Doe");
    expect(result.source).toBe("personal");
  });

  // ─── fullName returns stored value when available ─────────────────────────

  it("returns stored fullName when available", () => {
    const result = getDataValue("fullName", mockData);
    expect(result.value).toBe("John Doe");
    expect(result.source).toBe("personal");
  });

  // ─── linkedinUrl → personal.linkedinUrl ───────────────────────────────────

  it("returns personal.linkedinUrl for linkedinUrl field type", () => {
    const result = getDataValue("linkedinUrl", mockData);
    expect(result.value).toBe("https://linkedin.com/in/johndoe");
    expect(result.source).toBe("personal");
  });

  // ─── websiteUrl maps to portfolioUrl ──────────────────────────────────────

  it("returns portfolioUrl for websiteUrl field type", () => {
    const result = getDataValue("websiteUrl", mockData);
    expect(result.value).toBe("https://johndoe.dev");
    expect(result.source).toBe("personal");
  });

  // ─── Unknown field types → null ───────────────────────────────────────────

  it("returns null value for unmapped field types", () => {
    const result = getDataValue("eeoGender", mockData);
    expect(result.value).toBeNull();
    expect(result.source).toBeNull();
  });

  // ─── Null personal data → null value ──────────────────────────────────────

  it("returns null when personal data field is null", () => {
    const noEmailData: AutofillData = {
      ...mockData,
      personal: { ...mockData.personal, email: null },
    };

    const result = getDataValue("email", noEmailData);
    expect(result.value).toBeNull();
    expect(result.source).toBe("personal");
  });
});
