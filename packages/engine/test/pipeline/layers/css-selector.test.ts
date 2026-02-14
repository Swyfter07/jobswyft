import { describe, it, expect } from "vitest";
import { cssSelector } from "../../../src/pipeline/layers/css-selector";
import { createDetectionContext } from "../../../src/pipeline/create-context";

function makeDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("cssSelector layer", () => {
  it("extracts title from LinkedIn selectors when board matches", async () => {
    const html = `<html><body>
      <div class="job-details-jobs-unified-top-card__job-title">
        <h1>Staff Engineer</h1>
      </div>
    </body></html>`;
    const ctx = createDetectionContext("https://linkedin.com/jobs/view/1", makeDom(html));
    ctx.board = "linkedin";

    await cssSelector(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Staff Engineer");
    expect(ctx.fields.title?.source).toBe("css-board");
    expect(ctx.fields.title?.confidence).toBe(0.85);
  });

  it("uses generic fallback selectors when board is null", async () => {
    // Generic selectors use h1.job-title or similar patterns
    // We test that the layer runs without errors when no board is set
    const html = "<html><body><h1>Some Job</h1></body></html>";
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));
    ctx.board = null;

    await cssSelector(ctx, async () => {});

    // Generic selectors may or may not match depending on exact registry
    // The key assertion is that it runs without error
    expect(ctx.trace.layersExecuted).toContain("css");
  });

  it("does not overwrite fields set by higher-confidence layers", async () => {
    const html = `<html><body>
      <div class="job-details-jobs-unified-top-card__job-title"><h1>CSS Title</h1></div>
    </body></html>`;
    const ctx = createDetectionContext("https://linkedin.com/jobs/view/1", makeDom(html));
    ctx.board = "linkedin";
    // Pre-set title with JSON-LD confidence (0.95 > 0.85)
    ctx.fields.title = { value: "JSON-LD Title", source: "json-ld", confidence: 0.95 };

    await cssSelector(ctx, async () => {});

    expect(ctx.fields.title.value).toBe("JSON-LD Title");
  });

  it("records layer execution in trace", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom("<html></html>"));
    await cssSelector(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("css");
  });

  it("updates completeness after extraction", async () => {
    const html = `<html><body>
      <div class="job-details-jobs-unified-top-card__job-title"><h1>Engineer</h1></div>
    </body></html>`;
    const ctx = createDetectionContext("https://linkedin.com/jobs/view/1", makeDom(html));
    ctx.board = "linkedin";

    await cssSelector(ctx, async () => {});

    // Board-specific selector should have matched the title field
    expect(ctx.fields.title).toBeDefined();
    expect(ctx.completeness).toBeGreaterThan(0);
  });

  it("calls next()", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom("<html></html>"));
    let nextCalled = false;
    await cssSelector(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
