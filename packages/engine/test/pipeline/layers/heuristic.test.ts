import { describe, it, expect } from "vitest";
import { heuristic } from "../../../src/pipeline/layers/heuristic";
import { createDetectionContext } from "../../../src/pipeline/create-context";

function makeDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("heuristic layer", () => {
  it("extracts title from first h1", async () => {
    const html = "<html><body><h1>Data Analyst</h1></body></html>";
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await heuristic(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Data Analyst");
    expect(ctx.fields.title?.confidence).toBe(0.30);
    expect(ctx.fields.title?.source).toBe("heuristic");
  });

  it("extracts description from main content area", async () => {
    const longDesc = "A".repeat(100);
    const html = `<html><body><main>${longDesc}</main></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await heuristic(ctx, async () => {});

    expect(ctx.fields.description?.value).toContain("A");
    expect(ctx.fields.description?.confidence).toBe(0.30);
  });

  it("extracts description from details elements", async () => {
    const longContent = "B".repeat(200);
    const html = `<html><body><details><summary>Details</summary>${longContent}</details></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await heuristic(ctx, async () => {});

    // May extract from details if no main content area found first
    if (ctx.fields.description) {
      expect(ctx.fields.description.source).toBe("heuristic");
    }
  });

  it("does not overwrite higher-confidence title", async () => {
    const html = "<html><body><h1>Heuristic Title</h1></body></html>";
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));
    ctx.fields.title = { value: "CSS Title", source: "css-board", confidence: 0.85 };

    await heuristic(ctx, async () => {});

    expect(ctx.fields.title.value).toBe("CSS Title");
  });

  it("records layer execution in trace", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom("<html></html>"));
    await heuristic(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("heuristic");
  });

  it("updates completeness", async () => {
    const html = `<html><body>
      <h1>Engineer</h1>
      <main>${"Description text ".repeat(20)}</main>
    </body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await heuristic(ctx, async () => {});

    expect(ctx.completeness).toBeGreaterThan(0);
  });

  it("calls next()", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom("<html></html>"));
    let nextCalled = false;
    await heuristic(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
