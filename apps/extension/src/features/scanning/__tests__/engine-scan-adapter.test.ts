/**
 * Engine Scan Adapter Tests — Verifies the bridge between collectPageData
 * output and the engine extraction pipeline.
 *
 * Tests cover:
 * - InjectionResult[] to ScanCollectionResult[] mapping
 * - Frame selection logic (main frame preference, largest HTML fallback)
 * - hasShowMore aggregation across frames
 * - Pipeline creation, execution, and field extraction (mocked engine)
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ScanCollectionResult } from "@/lib/message-types";

// ─── Engine Mock ──────────────────────────────────────────────────────────────

vi.mock("@jobswyft/engine", () => ({
  createDefaultPipeline: vi.fn(() => vi.fn(async (ctx: any) => ctx)),
  createDetectionContext: vi.fn((url: string, dom: any) => ({
    url,
    dom,
    board: null,
    fields: {},
    completeness: 0,
    trace: {
      fields: [],
      board: null,
      url,
      timestamp: Date.now(),
      totalTimeMs: 0,
      layersExecuted: [],
      gateDecisions: [],
    },
    signals: {},
    metadata: {},
  })),
  validateExtraction: vi.fn(() => ({
    isValid: false,
    issues: [],
    completeness: 0,
    confidence: {
      title: 0,
      company: 0,
      description: 0,
      location: 0,
      salary: 0,
    },
  })),
}));

import {
  toScanCollectionResults,
  runEngineScan,
} from "../engine-scan-adapter";
import {
  createDefaultPipeline,
  createDetectionContext,
  validateExtraction,
} from "@jobswyft/engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal chrome.scripting.InjectionResult-like object. */
function makeInjectionResult(
  frameId: number,
  result: Omit<ScanCollectionResult, "frameId"> | null,
): { frameId: number; result: unknown } {
  return { frameId, result };
}

/** Build a ScanCollectionResult for use in runEngineScan tests. */
function makeCollectionResult(
  overrides: Partial<ScanCollectionResult> = {},
): ScanCollectionResult {
  return {
    html: "<html><body><h1>Software Engineer</h1></body></html>",
    url: "https://boards.greenhouse.io/acme/jobs/123",
    jsonLd: [],
    ogMeta: {},
    hasShowMore: false,
    frameId: 0,
    ...overrides,
  };
}

// ─── toScanCollectionResults ─────────────────────────────────────────────────

describe("toScanCollectionResults", () => {
  it("filters null results and maps frameId correctly", () => {
    const injectionResults = [
      makeInjectionResult(0, {
        html: "<html><body>Main</body></html>",
        url: "https://example.com/job/1",
        jsonLd: [],
        ogMeta: {},
        hasShowMore: false,
      }),
      makeInjectionResult(1, null), // null result, should be filtered out
      makeInjectionResult(2, {
        html: "<html><body>Iframe</body></html>",
        url: "https://example.com/iframe",
        jsonLd: [],
        ogMeta: {},
        hasShowMore: true,
      }),
    ] as chrome.scripting.InjectionResult[];

    const results = toScanCollectionResults(injectionResults);

    expect(results).toHaveLength(2);
    expect(results[0].frameId).toBe(0);
    expect(results[0].html).toBe("<html><body>Main</body></html>");
    expect(results[0].url).toBe("https://example.com/job/1");
    expect(results[1].frameId).toBe(2);
    expect(results[1].hasShowMore).toBe(true);
  });

  it("handles empty input", () => {
    const results = toScanCollectionResults(
      [] as unknown as chrome.scripting.InjectionResult[],
    );
    expect(results).toEqual([]);
  });

  it("filters out results where result is undefined", () => {
    const injectionResults = [
      { frameId: 0, result: undefined },
      makeInjectionResult(1, {
        html: "<html><body>OK</body></html>",
        url: "https://example.com",
        jsonLd: [],
        ogMeta: {},
        hasShowMore: false,
      }),
    ] as chrome.scripting.InjectionResult[];

    const results = toScanCollectionResults(injectionResults);
    expect(results).toHaveLength(1);
    expect(results[0].frameId).toBe(1);
  });
});

// ─── runEngineScan ───────────────────────────────────────────────────────────

describe("runEngineScan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty result for empty input", async () => {
    const result = await runEngineScan([]);

    expect(result).toEqual({
      jobData: {},
      sources: {},
      confidence: null,
      board: null,
      completeness: 0,
      hasShowMore: false,
      trace: null,
    });

    // Engine functions should not have been called
    expect(createDetectionContext).not.toHaveBeenCalled();
    expect(createDefaultPipeline).not.toHaveBeenCalled();
    expect(validateExtraction).not.toHaveBeenCalled();
  });

  it("picks main frame (frameId 0) when available with sufficient content", async () => {
    const mainFrame = makeCollectionResult({
      frameId: 0,
      html: "<html><body>" + "x".repeat(600) + "</body></html>",
      url: "https://example.com/main",
    });
    const iframeFrame = makeCollectionResult({
      frameId: 1,
      html: "<html><body>" + "y".repeat(2000) + "</body></html>",
      url: "https://example.com/iframe",
    });

    await runEngineScan([mainFrame, iframeFrame]);

    // createDetectionContext should have been called with the main frame's URL
    expect(createDetectionContext).toHaveBeenCalledWith(
      "https://example.com/main",
      expect.anything(),
    );
  });

  it("picks largest HTML frame when main frame has minimal content", async () => {
    const mainFrame = makeCollectionResult({
      frameId: 0,
      html: "<html><body>tiny</body></html>", // < 500 chars
      url: "https://example.com/main",
    });
    const largeIframe = makeCollectionResult({
      frameId: 2,
      html: "<html><body>" + "z".repeat(3000) + "</body></html>",
      url: "https://example.com/large-iframe",
    });
    const smallIframe = makeCollectionResult({
      frameId: 3,
      html: "<html><body>small iframe</body></html>",
      url: "https://example.com/small-iframe",
    });

    await runEngineScan([mainFrame, largeIframe, smallIframe]);

    // Should pick the largest iframe since mainFrame.html.length < 500
    expect(createDetectionContext).toHaveBeenCalledWith(
      "https://example.com/large-iframe",
      expect.anything(),
    );
  });

  it("aggregates hasShowMore across frames", async () => {
    const frame1 = makeCollectionResult({
      frameId: 0,
      html: "<html><body>" + "a".repeat(600) + "</body></html>",
      hasShowMore: false,
    });
    const frame2 = makeCollectionResult({
      frameId: 1,
      hasShowMore: true, // one frame has showMore
    });

    const result = await runEngineScan([frame1, frame2]);

    expect(result.hasShowMore).toBe(true);
  });

  it("hasShowMore is false when no frames have it", async () => {
    const frame = makeCollectionResult({
      frameId: 0,
      hasShowMore: false,
    });

    const result = await runEngineScan([frame]);

    expect(result.hasShowMore).toBe(false);
  });

  it("creates context, runs pipeline, and extracts fields (mock engine)", async () => {
    // Reconfigure mocks for this test to return fields
    const mockPipelineFn = vi.fn(async (ctx: any) => ({
      ...ctx,
      board: "greenhouse",
      fields: {
        title: { value: "Software Engineer", source: "css-board" },
        company: { value: "Acme Corp", source: "json-ld" },
        description: {
          value: "Build amazing things",
          source: "css-board",
        },
        location: { value: "San Francisco, CA", source: "og-meta" },
        salary: { value: "$150k-$200k", source: "css-board" },
        employmentType: { value: "Full-time", source: "json-ld" },
      },
    }));
    vi.mocked(createDefaultPipeline).mockReturnValue(mockPipelineFn as any);
    vi.mocked(validateExtraction).mockReturnValue({
      isValid: true,
      issues: [],
      completeness: 0.85,
      confidence: {
        title: 0.95,
        company: 0.9,
        description: 0.8,
        location: 0.7,
        salary: 0.6,
      },
    } as any);

    const frame = makeCollectionResult({
      frameId: 0,
      html: "<html><body><h1>Software Engineer</h1><p>Acme Corp</p></body></html>",
      url: "https://boards.greenhouse.io/acme/jobs/456",
    });

    const result = await runEngineScan([frame]);

    // Verify pipeline was created and executed
    expect(createDefaultPipeline).toHaveBeenCalled();
    expect(mockPipelineFn).toHaveBeenCalledTimes(1);

    // Verify context was created with correct URL
    expect(createDetectionContext).toHaveBeenCalledWith(
      "https://boards.greenhouse.io/acme/jobs/456",
      expect.anything(),
    );

    // Verify extracted job fields
    expect(result.jobData.title).toBe("Software Engineer");
    expect(result.jobData.company).toBe("Acme Corp");
    expect(result.jobData.description).toBe("Build amazing things");
    expect(result.jobData.location).toBe("San Francisco, CA");
    expect(result.jobData.salary).toBe("$150k-$200k");
    expect(result.jobData.employmentType).toBe("Full-time");
    expect(result.jobData.sourceUrl).toBe(
      "https://boards.greenhouse.io/acme/jobs/456",
    );

    // Verify sources
    expect(result.sources.title).toBe("css-board");
    expect(result.sources.company).toBe("json-ld");

    // Verify validation results are propagated
    expect(result.board).toBe("greenhouse");
    expect(result.completeness).toBe(0.85);
    expect(result.confidence).toEqual({
      title: 0.95,
      company: 0.9,
      description: 0.8,
      location: 0.7,
      salary: 0.6,
    });

    // Verify validateExtraction was called with correct args
    expect(validateExtraction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Software Engineer",
        company: "Acme Corp",
        sourceUrl: "https://boards.greenhouse.io/acme/jobs/456",
      }),
      expect.objectContaining({
        title: "css-board",
        company: "json-ld",
      }),
    );
  });

  it("omits fields with no value from jobData and sources", async () => {
    // Pipeline returns some fields with empty/null values
    const mockPipelineFn = vi.fn(async (ctx: any) => ({
      ...ctx,
      board: null,
      fields: {
        title: { value: "Engineer", source: "css-board" },
        company: { value: "", source: "css-board" }, // empty value
        description: { value: undefined, source: "css-board" }, // undefined value
        location: { value: null, source: "og-meta" }, // null value
      },
    }));
    vi.mocked(createDefaultPipeline).mockReturnValue(mockPipelineFn as any);

    const frame = makeCollectionResult({ frameId: 0 });
    const result = await runEngineScan([frame]);

    // Only title should be present (non-empty value)
    expect(result.jobData.title).toBe("Engineer");
    expect(result.sources.title).toBe("css-board");

    // Empty/null/undefined fields should be omitted
    expect(result.jobData).not.toHaveProperty("company");
    expect(result.jobData).not.toHaveProperty("description");
    expect(result.jobData).not.toHaveProperty("location");

    // sourceUrl is always included
    expect(result.jobData.sourceUrl).toBeDefined();
  });

  it("always includes sourceUrl in jobData", async () => {
    const frame = makeCollectionResult({
      frameId: 0,
      url: "https://example.com/jobs/789",
    });

    const result = await runEngineScan([frame]);

    expect(result.jobData.sourceUrl).toBe("https://example.com/jobs/789");
  });
});
