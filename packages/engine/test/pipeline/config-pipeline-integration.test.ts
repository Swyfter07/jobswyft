import { describe, it, expect } from "vitest";
import { createDetectionContext } from "../../src/pipeline/create-context";
import { createDefaultPipeline, createPipelineForUrl } from "../../src/pipeline/default-pipeline";
import { BoardRegistry } from "../../src/registry/board-registry";
import type { SiteConfig } from "../../src/pipeline/types";

function makeDom(html: string = "<html><body></body></html>"): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function makeConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    board: "test",
    name: "Test Board",
    urlPatterns: ["test\\.com/jobs"],
    selectors: { title: { primary: ["h1.job-title"] } },
    version: 1,
    ...overrides,
  };
}

describe("Config-Pipeline Integration", () => {
  describe("createDefaultPipeline with siteConfig", () => {
    it("creates pipeline without siteConfig (no skip layers)", () => {
      const pipeline = createDefaultPipeline();
      expect(typeof pipeline).toBe("function");
    });

    it("creates pipeline with siteConfig skipLayers", () => {
      const config = makeConfig({
        pipelineHints: { skipLayers: ["json-ld"] },
      });
      const pipeline = createDefaultPipeline(config);
      expect(typeof pipeline).toBe("function");
    });

    it("runs pipeline with board registry on context", async () => {
      const config = makeConfig({
        board: "greenhouse",
        urlPatterns: ["greenhouse\\.io"],
      });
      const registry = new BoardRegistry([config]);
      const ctx = createDetectionContext(
        "https://boards.greenhouse.io/acme/jobs/123",
        makeDom(),
        { boardRegistry: registry }
      );

      const pipeline = createDefaultPipeline();
      await pipeline(ctx);

      // Board-detector should populate siteConfig from registry
      expect(ctx.siteConfig?.board).toBe("greenhouse");
    });
  });

  describe("createPipelineForUrl", () => {
    it("creates pipeline for a known URL using registry", () => {
      const config = makeConfig({
        board: "lever",
        urlPatterns: ["jobs\\.lever\\.co"],
        pipelineHints: { skipLayers: ["json-ld"] },
      });
      const registry = new BoardRegistry([config]);
      const pipeline = createPipelineForUrl("https://jobs.lever.co/company/123", registry);
      expect(typeof pipeline).toBe("function");
    });

    it("creates default pipeline for unknown URL (no config match)", () => {
      const registry = new BoardRegistry([makeConfig()]);
      const pipeline = createPipelineForUrl("https://unknown.com/jobs/123", registry);
      expect(typeof pipeline).toBe("function");
    });

    it("applies skipLayers from matched config", async () => {
      const config = makeConfig({
        board: "lever",
        urlPatterns: ["jobs\\.lever\\.co"],
        pipelineHints: { skipLayers: ["json-ld"] },
      });
      const registry = new BoardRegistry([config]);
      const ctx = createDetectionContext(
        "https://jobs.lever.co/company/123",
        makeDom(),
        { boardRegistry: registry }
      );

      const pipeline = createPipelineForUrl("https://jobs.lever.co/company/123", registry);
      await pipeline(ctx);

      // json-ld should NOT appear in executed layers
      expect(ctx.trace.layersExecuted).not.toContain("json-ld");
      // board-detector should still run
      expect(ctx.trace.layersExecuted).toContain("board-detector");
    });
  });

  describe("board-detector with registry in pipeline", () => {
    it("populates ctx.siteConfig during pipeline execution", async () => {
      const config = makeConfig({
        board: "linkedin",
        urlPatterns: ["linkedin\\.com/jobs"],
      });
      const registry = new BoardRegistry([config]);
      const ctx = createDetectionContext(
        "https://www.linkedin.com/jobs/view/12345",
        makeDom(),
        { boardRegistry: registry }
      );

      const pipeline = createDefaultPipeline();
      await pipeline(ctx);

      expect(ctx.board).toBe("linkedin");
      expect(ctx.siteConfig).toBeDefined();
      expect(ctx.siteConfig!.board).toBe("linkedin");
    });

    it("leaves siteConfig undefined for unknown URL in pipeline", async () => {
      const registry = new BoardRegistry([makeConfig()]);
      const ctx = createDetectionContext(
        "https://unknown.com/page",
        makeDom(),
        { boardRegistry: registry }
      );

      const pipeline = createDefaultPipeline();
      await pipeline(ctx);

      expect(ctx.board).toBeNull();
      expect(ctx.siteConfig).toBeUndefined();
    });
  });
});
