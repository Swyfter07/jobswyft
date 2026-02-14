import { describe, it, expect } from "vitest";
import { aggregateFrameResults } from "../../src/extraction/frame-aggregator";
import type { FrameResult } from "../../src/types/frame-result";

describe("aggregateFrameResults", () => {
  it("returns empty data for null input", () => {
    const result = aggregateFrameResults(null);
    expect(result.data.title).toBe("");
    expect(result.data.company).toBe("");
    expect(result.hasShowMore).toBe(false);
  });

  it("returns empty data for undefined input", () => {
    const result = aggregateFrameResults(undefined);
    expect(result.data.title).toBe("");
    expect(result.data.company).toBe("");
  });

  it("returns empty data for empty array", () => {
    const result = aggregateFrameResults([]);
    expect(result.data.title).toBe("");
    expect(result.data.company).toBe("");
  });

  it("extracts data from a single frame result", () => {
    const results: FrameResult[] = [
      {
        frameId: 0,
        result: {
          title: "Software Engineer",
          company: "Acme Corp",
          description: "A great role with lots of interesting challenges and opportunities.",
          location: "San Francisco",
          salary: "$150k",
          sources: { title: "css-board", company: "css-board" },
        },
      },
    ];
    const { data } = aggregateFrameResults(results);
    expect(data.title).toBe("Software Engineer");
    expect(data.company).toBe("Acme Corp");
    expect(data.location).toBe("San Francisco");
    expect(data.salary).toBe("$150k");
  });

  it("prefers frame with both title and company (higher score)", () => {
    const results: FrameResult[] = [
      {
        frameId: 0,
        result: { title: "Nav Title", description: "Short" },
      },
      {
        frameId: 1,
        result: {
          title: "Real Title",
          company: "Real Company",
          description: "A detailed job description that is quite long and comprehensive.",
          location: "NYC",
        },
      },
    ];
    const { data } = aggregateFrameResults(results);
    expect(data.title).toBe("Real Title");
    expect(data.company).toBe("Real Company");
    expect(data.location).toBe("NYC");
  });

  it("fills gaps from secondary frames", () => {
    const results: FrameResult[] = [
      {
        frameId: 0,
        result: {
          title: "Engineer",
          company: "Acme",
        },
      },
      {
        frameId: 1,
        result: {
          location: "Remote",
          salary: "$100k",
        },
      },
    ];
    const { data } = aggregateFrameResults(results);
    expect(data.title).toBe("Engineer");
    expect(data.company).toBe("Acme");
    expect(data.location).toBe("Remote");
    expect(data.salary).toBe("$100k");
  });

  it("uses longest-wins heuristic for description", () => {
    const results: FrameResult[] = [
      {
        frameId: 0,
        result: {
          title: "Engineer",
          company: "Acme",
          description: "Short desc",
        },
      },
      {
        frameId: 1,
        result: {
          description: "A much longer and more detailed job description with comprehensive requirements and benefits information.",
        },
      },
    ];
    const { data } = aggregateFrameResults(results);
    expect(data.description).toContain("much longer");
  });

  it("reports hasShowMore if any frame detected show-more", () => {
    const results: FrameResult[] = [
      {
        frameId: 0,
        result: { title: "Engineer", company: "Acme", hasShowMore: false },
      },
      {
        frameId: 1,
        result: { description: "Desc", hasShowMore: true },
      },
    ];
    const { hasShowMore } = aggregateFrameResults(results);
    expect(hasShowMore).toBe(true);
  });

  it("tracks sources for each field", () => {
    const results: FrameResult[] = [
      {
        frameId: 0,
        result: {
          title: "Engineer",
          company: "Acme",
          sources: { title: "json-ld", company: "css-board" },
          sourceSelectorIds: { title: "li-title-1", company: "li-company-1" },
        },
      },
    ];
    const { sources, sourceSelectorIds } = aggregateFrameResults(results);
    expect(sources.title).toBe("json-ld");
    expect(sources.company).toBe("css-board");
    expect(sourceSelectorIds.title).toBe("li-title-1");
    expect(sourceSelectorIds.company).toBe("li-company-1");
  });

  it("handles frames with null results", () => {
    const results: FrameResult[] = [
      { frameId: 0, result: null },
      {
        frameId: 1,
        result: { title: "Engineer", company: "Acme" },
      },
    ];
    const { data } = aggregateFrameResults(results);
    expect(data.title).toBe("Engineer");
    expect(data.company).toBe("Acme");
  });
});
