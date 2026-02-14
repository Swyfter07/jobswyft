import { describe, it, expect } from "vitest";
import { compose } from "../../src/pipeline/compose";
import { createDetectionContext } from "../../src/pipeline/create-context";
import type {
  DetectionContext,
  ExtractionMiddleware,
} from "../../src/pipeline/types";

function makeDom(html = "<html><body></body></html>"): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

function makeCtx(url = "https://example.com/job/1"): DetectionContext {
  return createDetectionContext(url, makeDom());
}

describe("compose", () => {
  it("returns context unchanged when no middleware provided", async () => {
    const pipeline = compose([]);
    const ctx = makeCtx();
    const result = await pipeline(ctx);
    expect(result).toBe(ctx);
    expect(result.completeness).toBe(0);
  });

  it("executes middleware in order", async () => {
    const order: number[] = [];

    const m1: ExtractionMiddleware = async (_ctx, next) => {
      order.push(1);
      await next();
    };
    const m2: ExtractionMiddleware = async (_ctx, next) => {
      order.push(2);
      await next();
    };
    const m3: ExtractionMiddleware = async (_ctx, next) => {
      order.push(3);
      await next();
    };

    const pipeline = compose([m1, m2, m3]);
    await pipeline(makeCtx());
    expect(order).toEqual([1, 2, 3]);
  });

  it("supports onion model — code runs before and after next()", async () => {
    const order: string[] = [];

    const m1: ExtractionMiddleware = async (_ctx, next) => {
      order.push("m1-before");
      await next();
      order.push("m1-after");
    };
    const m2: ExtractionMiddleware = async (_ctx, next) => {
      order.push("m2-before");
      await next();
      order.push("m2-after");
    };

    const pipeline = compose([m1, m2]);
    await pipeline(makeCtx());
    expect(order).toEqual(["m1-before", "m2-before", "m2-after", "m1-after"]);
  });

  it("short-circuits when next() is not called", async () => {
    const order: number[] = [];

    const m1: ExtractionMiddleware = async (_ctx, next) => {
      order.push(1);
      await next();
    };
    const m2: ExtractionMiddleware = async () => {
      order.push(2);
      // Not calling next() — short-circuits
    };
    const m3: ExtractionMiddleware = async (_ctx, next) => {
      order.push(3);
      await next();
    };

    const pipeline = compose([m1, m2, m3]);
    await pipeline(makeCtx());
    expect(order).toEqual([1, 2]);
  });

  it("handles middleware errors — catches, marks degraded, continues", async () => {
    const order: number[] = [];

    const m1: ExtractionMiddleware = async (_ctx, next) => {
      order.push(1);
      await next();
    };
    const m2: ExtractionMiddleware = async () => {
      order.push(2);
      throw new Error("layer failed");
    };
    const m3: ExtractionMiddleware = async (_ctx, next) => {
      order.push(3);
      await next();
    };

    const pipeline = compose([m1, m2, m3]);
    const ctx = makeCtx();
    const result = await pipeline(ctx);

    // m2 threw but m3 still executed
    expect(order).toEqual([1, 2, 3]);
    expect(result.metadata.degraded).toBe(true);
    expect(result.metadata.lastError).toBe("layer failed");
  });

  it("records totalTimeMs in trace", async () => {
    const m1: ExtractionMiddleware = async (_ctx, next) => {
      await next();
    };

    const pipeline = compose([m1]);
    const ctx = makeCtx();
    const result = await pipeline(ctx);
    expect(result.trace.totalTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("syncs trace.completeness with ctx.completeness", async () => {
    const m1: ExtractionMiddleware = async (ctx, next) => {
      ctx.completeness = 0.75;
      await next();
    };

    const pipeline = compose([m1]);
    const ctx = makeCtx();
    const result = await pipeline(ctx);
    expect(result.trace.completeness).toBe(0.75);
  });

  it("allows middleware to mutate context", async () => {
    const m1: ExtractionMiddleware = async (ctx, next) => {
      ctx.board = "linkedin";
      ctx.fields.title = {
        value: "Software Engineer",
        source: "json-ld",
        confidence: 0.95,
      };
      await next();
    };

    const pipeline = compose([m1]);
    const ctx = makeCtx();
    const result = await pipeline(ctx);
    expect(result.board).toBe("linkedin");
    expect(result.fields.title?.value).toBe("Software Engineer");
  });
});
