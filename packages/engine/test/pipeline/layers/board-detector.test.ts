import { describe, it, expect } from "vitest";
import { boardDetector } from "../../../src/pipeline/layers/board-detector";
import { createDetectionContext } from "../../../src/pipeline/create-context";
import { BoardRegistry } from "../../../src/registry/board-registry";
import type { SiteConfig } from "../../../src/pipeline/types";

function makeDom(): Document {
  return new DOMParser().parseFromString("<html></html>", "text/html");
}

function makeConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    board: "linkedin",
    name: "LinkedIn",
    urlPatterns: ["linkedin\\.com/jobs"],
    selectors: { title: { primary: [".job-title"] } },
    version: 1,
    ...overrides,
  };
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

  it("siteConfig is undefined when no boardRegistry is provided", async () => {
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

  // ─── Story 2.4: Board Registry Integration ─────────────────────────────────

  it("populates ctx.siteConfig from boardRegistry when URL matches", async () => {
    const config = makeConfig();
    const registry = new BoardRegistry([config]);
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom(),
      { boardRegistry: registry }
    );

    await boardDetector(ctx, async () => {});

    expect(ctx.board).toBe("linkedin");
    expect(ctx.siteConfig).toBeDefined();
    expect(ctx.siteConfig!.board).toBe("linkedin");
  });

  it("leaves ctx.siteConfig undefined when registry has no match", async () => {
    const config = makeConfig({ board: "indeed", urlPatterns: ["indeed\\.com/viewjob"] });
    const registry = new BoardRegistry([config]);
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom(),
      { boardRegistry: registry }
    );

    await boardDetector(ctx, async () => {});

    expect(ctx.board).toBe("linkedin");
    expect(ctx.siteConfig).toBeUndefined();
  });

  it("leaves ctx.siteConfig undefined when no registry is present", async () => {
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom()
    );

    await boardDetector(ctx, async () => {});

    expect(ctx.siteConfig).toBeUndefined();
  });

  it("preserves pre-set ctx.siteConfig when boardRegistry is also present (explicit override)", async () => {
    const explicitConfig: SiteConfig = {
      board: "custom-override",
      name: "Custom Override",
      urlPatterns: [],
      selectors: { title: { primary: [".custom-title"] } },
      version: 99,
    };
    const registryConfig = makeConfig({ board: "linkedin", urlPatterns: ["linkedin\\.com/jobs"] });
    const registry = new BoardRegistry([registryConfig]);

    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom(),
      { boardRegistry: registry }
    );
    // Pre-set siteConfig before pipeline runs
    ctx.siteConfig = explicitConfig;

    await boardDetector(ctx, async () => {});

    // board detection still works
    expect(ctx.board).toBe("linkedin");
    // But siteConfig is NOT overwritten — explicit override takes precedence
    expect(ctx.siteConfig.board).toBe("custom-override");
    expect(ctx.siteConfig.version).toBe(99);
  });
});
