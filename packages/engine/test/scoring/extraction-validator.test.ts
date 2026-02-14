import { describe, it, expect } from "vitest";
import {
  computeFieldConfidence,
  computeCompleteness,
  validateExtraction,
  type ExtractionSource,
} from "../../src/scoring/extraction-validator";

describe("computeFieldConfidence", () => {
  it("returns 0.95 for json-ld source", () => {
    expect(computeFieldConfidence("title", "Software Engineer", "json-ld")).toBe(0.95);
  });

  it("returns 0.85 for css-board source", () => {
    expect(computeFieldConfidence("company", "Acme Corp", "css-board")).toBe(0.85);
  });

  it("returns 0.60 for css-generic source", () => {
    expect(computeFieldConfidence("location", "San Francisco", "css-generic")).toBe(0.60);
  });

  it("returns 0.40 for og-meta source", () => {
    expect(computeFieldConfidence("title", "Engineer at Acme", "og-meta")).toBe(0.40);
  });

  it("returns 0.90 for ai-llm source", () => {
    expect(computeFieldConfidence("description", "Job description...", "ai-llm")).toBe(0.90);
  });

  it("returns 1.0 for user-edit source", () => {
    expect(computeFieldConfidence("title", "Custom Title", "user-edit")).toBe(1.0);
  });

  it("returns 0.30 for heuristic source", () => {
    expect(computeFieldConfidence("description", "Some text", "heuristic")).toBe(0.30);
  });

  it("returns 0 for empty value regardless of source", () => {
    expect(computeFieldConfidence("title", "", "json-ld")).toBe(0);
  });

  it("returns 0 for null/undefined value", () => {
    expect(computeFieldConfidence("title", null as unknown as string, "json-ld")).toBe(0);
    expect(computeFieldConfidence("title", undefined as unknown as string, "json-ld")).toBe(0);
  });

  // Cross-field checks: suspicious values
  it("returns reduced confidence for placeholder values", () => {
    expect(computeFieldConfidence("title", "N/A", "css-generic")).toBeLessThan(0.60);
    expect(computeFieldConfidence("company", "UNAVAILABLE", "css-board")).toBeLessThan(0.85);
    expect(computeFieldConfidence("title", "TBD", "json-ld")).toBeLessThan(0.95);
  });

  it("returns reduced confidence for very short titles (< 3 chars)", () => {
    expect(computeFieldConfidence("title", "AB", "json-ld")).toBeLessThan(0.95);
  });

  it("returns reduced confidence for very long titles (> 200 chars)", () => {
    const longTitle = "A".repeat(201);
    expect(computeFieldConfidence("title", longTitle, "json-ld")).toBeLessThan(0.95);
  });
});

describe("computeCompleteness", () => {
  const fullConfidence: Record<string, number> = {
    title: 0.95,
    company: 0.95,
    description: 0.95,
    location: 0.85,
    salary: 0.60,
  };

  it("returns high score for fully populated data with high confidence", () => {
    const result = computeCompleteness(
      { title: "Eng", company: "Acme", description: "Desc", location: "SF", salary: "$100k" },
      fullConfidence
    );
    // 0.25*0.95 + 0.25*0.95 + 0.35*0.95 + 0.10*0.85 + 0.05*0.60 = 0.92
    expect(result).toBeCloseTo(0.92, 2);
  });

  it("weights title at 0.25, company at 0.25, description at 0.35", () => {
    // Only title present
    const titleOnly = computeCompleteness(
      { title: "Eng", company: "", description: "", location: "", salary: "" },
      { title: 0.95 }
    );
    expect(titleOnly).toBeCloseTo(0.25 * 0.95, 2);
  });

  it("returns 0 for empty data", () => {
    const result = computeCompleteness(
      { title: "", company: "", description: "", location: "", salary: "" },
      {}
    );
    expect(result).toBe(0);
  });

  it("gives partial score for partially filled data", () => {
    // title + company filled, description + location + salary empty
    const result = computeCompleteness(
      { title: "Eng", company: "Acme", description: "", location: "", salary: "" },
      { title: 0.95, company: 0.85 }
    );
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it("handles missing confidence entries as 0", () => {
    const result = computeCompleteness(
      { title: "Eng", company: "Acme", description: "Desc", location: "SF", salary: "$100k" },
      {} // no confidence data
    );
    expect(result).toBe(0);
  });
});

describe("validateExtraction", () => {
  it("returns isValid=true when title and company are present", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "Acme Corp",
      description: "A great job opportunity.",
      location: "San Francisco",
    });
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("returns isValid=false when title is missing", () => {
    const result = validateExtraction({
      title: "",
      company: "Acme Corp",
      description: "A great job.",
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("missing_title");
  });

  it("returns isValid=false when company is missing", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "",
      description: "A great job.",
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("missing_company");
  });

  it("returns isValid=false when both title and company missing", () => {
    const result = validateExtraction({
      title: "",
      company: "",
      description: "A great job.",
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("missing_title");
    expect(result.issues).toContain("missing_company");
  });

  it("returns warning for missing description but still valid", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "Acme Corp",
      description: "",
    });
    expect(result.isValid).toBe(true);
    expect(result.issues).toContain("missing_description");
  });

  it("returns completeness score", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "Acme Corp",
      description: "A great job opportunity that is quite detailed.",
      location: "San Francisco",
      salary: "$150k",
    });
    expect(result.completeness).toBeGreaterThan(0.5);
    expect(result.completeness).toBeLessThanOrEqual(1);
  });

  it("handles title-contains-company suspicious pattern", () => {
    const result = validateExtraction({
      title: "Acme Corp",
      company: "Acme Corp",
      description: "Job desc.",
    });
    expect(result.issues).toContain("title_matches_company");
  });

  it("detects placeholder values in fields", () => {
    const result = validateExtraction({
      title: "N/A",
      company: "Acme Corp",
      description: "Job desc.",
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("placeholder_title");
  });

  it("detects very short description", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "Acme Corp",
      description: "Short",
    });
    expect(result.issues).toContain("short_description");
  });

  it("handles undefined/null fields gracefully", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "Acme Corp",
    });
    expect(result.isValid).toBe(true);
  });

  it("includes confidence map in result", () => {
    const result = validateExtraction(
      {
        title: "Software Engineer",
        company: "Acme Corp",
        description: "Desc",
      },
      {
        title: "json-ld",
        company: "css-board",
        description: "css-generic",
      }
    );
    expect(result.confidence).toBeDefined();
    expect(result.confidence.title).toBe(0.95);
    expect(result.confidence.company).toBe(0.85);
    expect(result.confidence.description).toBe(0.60);
  });

  it("defaults source to css-generic when no sources provided", () => {
    const result = validateExtraction({
      title: "Software Engineer",
      company: "Acme Corp",
      description: "Desc",
    });
    expect(result.confidence).toBeDefined();
    expect(result.confidence.title).toBe(0.60); // css-generic default
  });
});
