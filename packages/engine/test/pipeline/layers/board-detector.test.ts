import { describe, it, expect } from "vitest";
import { boardDetector } from "../../../src/pipeline/layers/board-detector";
import { createDetectionContext } from "../../../src/pipeline/create-context";

function makeDom(): Document {
  return new DOMParser().parseFromString("<html></html>", "text/html");
}

describe("boardDetector layer", () => {
  it("detects LinkedIn from URL and sets ctx.board", async () => {
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom()
    );
    let nextCalled = false;
    await boardDetector(ctx, async () => { nextCalled = true; });

    expect(ctx.board).toBe("linkedin");
    expect(ctx.trace.board).toBe("linkedin");
    expect(nextCalled).toBe(true);
  });

  it("detects Indeed from URL", async () => {
    const ctx = createDetectionContext(
      "https://www.indeed.com/viewjob?jk=abc123",
      makeDom()
    );
    await boardDetector(ctx, async () => {});
    expect(ctx.board).toBe("indeed");
  });

  it("detects Greenhouse from URL", async () => {
    const ctx = createDetectionContext(
      "https://boards.greenhouse.io/acme/jobs/123",
      makeDom()
    );
    await boardDetector(ctx, async () => {});
    expect(ctx.board).toBe("greenhouse");
  });

  it("returns null for unknown URLs", async () => {
    const ctx = createDetectionContext(
      "https://www.example.com/some-page",
      makeDom()
    );
    await boardDetector(ctx, async () => {});
    expect(ctx.board).toBeNull();
    expect(ctx.trace.board).toBeNull();
  });

  it("sets siteConfig to undefined (placeholder for Story 2.4)", async () => {
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom()
    );
    await boardDetector(ctx, async () => {});
    expect(ctx.siteConfig).toBeUndefined();
  });

  it("records layer execution in trace", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom());
    await boardDetector(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("board-detector");
  });

  it("calls next()", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom());
    let nextCalled = false;
    await boardDetector(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
