import { describe, it, expect } from "vitest";
import { createConfidenceGate } from "../../src/pipeline/layers/confidence-gate";
import { createDetectionContext } from "../../src/pipeline/create-context";
import type { DetectionContext } from "../../src/pipeline/types";

function makeDom(): Document {
  return new DOMParser().parseFromString("<html></html>", "text/html");
}

function makeCtx(completeness = 0): DetectionContext {
  const ctx = createDetectionContext("https://example.com/job/1", makeDom());
  ctx.completeness = completeness;
  return ctx;
}

describe("createConfidenceGate", () => {
  it("continues when completeness is below threshold", async () => {
    const gate = createConfidenceGate(0.85);
    const ctx = makeCtx(0.50);
    let nextCalled = false;

    await gate(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(ctx.trace.gateDecisions).toHaveLength(1);
    expect(ctx.trace.gateDecisions[0]).toEqual({
      gate: 0.85,
      completeness: 0.50,
      action: "continue",
    });
  });

  it("short-circuits when completeness meets threshold", async () => {
    const gate = createConfidenceGate(0.85);
    const ctx = makeCtx(0.85);
    let nextCalled = false;

    await gate(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(ctx.trace.gateDecisions[0]).toEqual({
      gate: 0.85,
      completeness: 0.85,
      action: "short-circuit",
    });
  });

  it("short-circuits when completeness exceeds threshold", async () => {
    const gate = createConfidenceGate(0.75);
    const ctx = makeCtx(0.90);
    let nextCalled = false;

    await gate(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(ctx.trace.gateDecisions[0].action).toBe("short-circuit");
  });

  it("works with Gate(0.85) threshold", async () => {
    const gate = createConfidenceGate(0.85);
    const ctx = makeCtx(0.84);
    let nextCalled = false;

    await gate(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(ctx.trace.gateDecisions[0].action).toBe("continue");
  });

  it("works with Gate(0.75) threshold", async () => {
    const gate = createConfidenceGate(0.75);
    const ctx = makeCtx(0.75);
    let nextCalled = false;

    await gate(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
  });

  it("works with Gate(0.70) threshold", async () => {
    const gate = createConfidenceGate(0.70);
    const ctx = makeCtx(0.69);
    let nextCalled = false;

    await gate(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(ctx.trace.gateDecisions[0].action).toBe("continue");
  });

  it("records multiple gate decisions when called multiple times", async () => {
    const gate85 = createConfidenceGate(0.85);
    const gate75 = createConfidenceGate(0.75);
    const ctx = makeCtx(0.80);

    await gate85(ctx, async () => {});
    await gate75(ctx, async () => {});

    expect(ctx.trace.gateDecisions).toHaveLength(2);
    expect(ctx.trace.gateDecisions[0].action).toBe("continue");
    expect(ctx.trace.gateDecisions[1].action).toBe("short-circuit");
  });
});
