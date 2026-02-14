import { describe, it, expect } from "vitest";
import { postProcess } from "../../../src/pipeline/layers/post-process";
import { createDetectionContext } from "../../../src/pipeline/create-context";
import { updateCompleteness } from "../../../src/pipeline/create-context";

function makeDom(): Document {
  return new DOMParser().parseFromString("<html></html>", "text/html");
}

describe("postProcess layer", () => {
  it("trims whitespace from field values", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    ctx.fields.title = { value: "  Software Engineer  ", source: "json-ld", confidence: 0.95 };
    ctx.fields.company = { value: "  Acme Corp  ", source: "json-ld", confidence: 0.95 };

    await postProcess(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Software Engineer");
    expect(ctx.fields.company?.value).toBe("Acme Corp");
  });

  it("decodes HTML entities", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    ctx.fields.title = { value: "Software &amp; Engineering", source: "css-board", confidence: 0.85 };
    ctx.fields.company = { value: "O&#39;Reilly &amp; Associates", source: "css-board", confidence: 0.85 };

    await postProcess(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Software & Engineering");
    expect(ctx.fields.company?.value).toBe("O'Reilly & Associates");
  });

  it("collapses multiple whitespace into single space", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    ctx.fields.description = {
      value: "Line one\n\n  Line two\t\tLine three",
      source: "heuristic",
      confidence: 0.30,
    };

    await postProcess(ctx, async () => {});

    expect(ctx.fields.description?.value).toBe("Line one Line two Line three");
  });

  it("runs validateExtraction and stores result in metadata", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    ctx.fields.title = { value: "Engineer", source: "json-ld", confidence: 0.95 };
    ctx.fields.company = { value: "Corp", source: "json-ld", confidence: 0.95 };
    ctx.fields.description = { value: "A great opportunity for experienced engineers to join our growing team.", source: "json-ld", confidence: 0.95 };

    await postProcess(ctx, async () => {});

    const validation = ctx.metadata.validation as { isValid: boolean; issues: string[] };
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toEqual([]);
  });

  it("reports validation issues for missing required fields", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    // No title or company set

    await postProcess(ctx, async () => {});

    const validation = ctx.metadata.validation as { isValid: boolean; issues: string[] };
    expect(validation.isValid).toBe(false);
    expect(validation.issues).toContain("missing_title");
    expect(validation.issues).toContain("missing_company");
  });

  it("computes final completeness", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    ctx.fields.title = { value: "Engineer", source: "json-ld", confidence: 0.95 };
    ctx.fields.company = { value: "Corp", source: "json-ld", confidence: 0.95 };
    updateCompleteness(ctx);
    const before = ctx.completeness;

    await postProcess(ctx, async () => {});

    // Completeness should be computed (same or adjusted)
    expect(ctx.completeness).toBeGreaterThan(0);
    expect(ctx.trace.completeness).toBe(ctx.completeness);
  });

  it("records layer execution in trace", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    await postProcess(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("post-process");
  });

  it("calls next()", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    let nextCalled = false;
    await postProcess(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
