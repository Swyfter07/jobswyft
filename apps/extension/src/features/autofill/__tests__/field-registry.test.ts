import { describe, it, expect } from "vitest";
import { AUTOFILL_FIELD_REGISTRY } from "../field-registry";

describe("AUTOFILL_FIELD_REGISTRY", () => {
  it("has entries", () => {
    expect(AUTOFILL_FIELD_REGISTRY.length).toBeGreaterThan(0);
  });

  it("has unique IDs", () => {
    const ids = AUTOFILL_FIELD_REGISTRY.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("has valid board names", () => {
    const validBoards = [
      "greenhouse", "lever", "workday", "ashby",
      "smartrecruiters", "icims", "generic",
    ];
    for (const entry of AUTOFILL_FIELD_REGISTRY) {
      expect(validBoards).toContain(entry.board);
    }
  });

  it("has valid field types", () => {
    const validTypes = [
      "firstName", "lastName", "fullName", "email", "phone",
      "location", "address", "city", "state", "zipCode", "country",
      "linkedinUrl", "portfolioUrl", "websiteUrl",
      "resumeUpload", "coverLetterUpload", "coverLetterText",
      "yearsExperience", "education", "salary", "startDate",
      "currentCompany", "currentTitle",
      "workAuthorization", "sponsorshipRequired",
      "eeoGender", "eeoRaceEthnicity", "eeoVeteranStatus", "eeoDisabilityStatus",
      "customQuestion", "unknown",
    ];
    for (const entry of AUTOFILL_FIELD_REGISTRY) {
      expect(validTypes).toContain(entry.fieldType);
    }
  });

  it("has non-empty selectors for all entries", () => {
    for (const entry of AUTOFILL_FIELD_REGISTRY) {
      expect(entry.selectors.length).toBeGreaterThan(0);
    }
  });

  it("has valid status values", () => {
    const validStatuses = ["active", "degraded", "deprecated"];
    for (const entry of AUTOFILL_FIELD_REGISTRY) {
      expect(validStatuses).toContain(entry.status);
    }
  });

  it("has valid priority values (positive integers)", () => {
    for (const entry of AUTOFILL_FIELD_REGISTRY) {
      expect(entry.priority).toBeGreaterThan(0);
      expect(Number.isInteger(entry.priority)).toBe(true);
    }
  });

  it("is JSON-serializable", () => {
    const serialized = JSON.stringify(AUTOFILL_FIELD_REGISTRY);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toHaveLength(AUTOFILL_FIELD_REGISTRY.length);
  });

  // ─── Board-specific coverage ────────────────────────────────────────

  it("has Greenhouse entries for core fields", () => {
    const ghEntries = AUTOFILL_FIELD_REGISTRY.filter((e) => e.board === "greenhouse");
    const ghFields = ghEntries.map((e) => e.fieldType);
    expect(ghFields).toContain("firstName");
    expect(ghFields).toContain("lastName");
    expect(ghFields).toContain("email");
    expect(ghFields).toContain("phone");
    expect(ghFields).toContain("resumeUpload");
  });

  it("has Lever entries for core fields", () => {
    const entries = AUTOFILL_FIELD_REGISTRY.filter((e) => e.board === "lever");
    const fields = entries.map((e) => e.fieldType);
    expect(fields).toContain("fullName");
    expect(fields).toContain("email");
    expect(fields).toContain("phone");
    expect(fields).toContain("resumeUpload");
  });

  it("has Workday entries for core fields", () => {
    const entries = AUTOFILL_FIELD_REGISTRY.filter((e) => e.board === "workday");
    const fields = entries.map((e) => e.fieldType);
    expect(fields).toContain("firstName");
    expect(fields).toContain("lastName");
    expect(fields).toContain("email");
    expect(fields).toContain("resumeUpload");
  });

  it("has generic fallback entries", () => {
    const entries = AUTOFILL_FIELD_REGISTRY.filter((e) => e.board === "generic");
    expect(entries.length).toBeGreaterThan(5);
    const fields = entries.map((e) => e.fieldType);
    expect(fields).toContain("email");
    expect(fields).toContain("phone");
    expect(fields).toContain("firstName");
  });

  it("generic entries have higher priority numbers than board-specific", () => {
    const genericEntries = AUTOFILL_FIELD_REGISTRY.filter((e) => e.board === "generic");
    const boardEntries = AUTOFILL_FIELD_REGISTRY.filter((e) => e.board !== "generic");

    const minGenericPriority = Math.min(...genericEntries.map((e) => e.priority));
    const maxBoardPriority = Math.max(...boardEntries.map((e) => e.priority));

    expect(minGenericPriority).toBeGreaterThanOrEqual(maxBoardPriority);
  });

  it("no duplicate selectors within same board+fieldType", () => {
    const seen = new Map<string, Set<string>>();
    for (const entry of AUTOFILL_FIELD_REGISTRY) {
      const key = `${entry.board}:${entry.fieldType}`;
      if (!seen.has(key)) seen.set(key, new Set());
      for (const sel of entry.selectors) {
        expect(seen.get(key)!.has(sel)).toBe(false);
        seen.get(key)!.add(sel);
      }
    }
  });
});
