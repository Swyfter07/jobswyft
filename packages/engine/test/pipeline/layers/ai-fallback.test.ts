import { describe, it, expect } from "vitest";
import { aiFallback } from "../../../src/pipeline/layers/ai-fallback";
import { createDetectionContext } from "../../../src/pipeline/create-context";

function makeDom(): Document {
  return new DOMParser().parseFromString("<html></html>", "text/html");
}

describe("aiFallback layer (stub)", () => {
  it("sets aiTriggered to true", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    await aiFallback(ctx, async () => {});
    expect(ctx.trace.aiTriggered).toBe(true);
  });

  it("records trace attempt with stub-not-implemented", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    await aiFallback(ctx, async () => {});

    const aiTrace = ctx.trace.fields.find((f) => f.field === "ai-fallback");
    expect(aiTrace).toBeDefined();
    expect(aiTrace?.attempts[0].rejectionReason).toBe("stub-not-implemented");
    expect(aiTrace?.attempts[0].matched).toBe(false);
    expect(aiTrace?.attempts[0].accepted).toBe(false);
  });

  it("calls next() — does not short-circuit", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    let nextCalled = false;
    await aiFallback(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it("does not modify any extraction fields", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    await aiFallback(ctx, async () => {});

    expect(ctx.fields.title).toBeUndefined();
    expect(ctx.fields.company).toBeUndefined();
    expect(ctx.fields.description).toBeUndefined();
  });

  it("records layer execution in trace", async () => {
    const ctx = createDetectionContext("https://example.com/job", makeDom());
    await aiFallback(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("ai-fallback");
  });
});
