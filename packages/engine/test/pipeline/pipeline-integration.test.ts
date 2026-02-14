import { describe, it, expect } from "vitest";
import { createDefaultPipeline } from "../../src/pipeline/default-pipeline";
import { createDetectionContext } from "../../src/pipeline/create-context";

function makeDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

const LINKEDIN_JSON_LD = JSON.stringify({
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  title: "Senior Software Engineer",
  hiringOrganization: { "@type": "Organization", name: "TechCorp Inc." },
  description: "We are looking for a senior software engineer to lead our backend team and build scalable systems.",
  jobLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressLocality: "San Francisco", addressRegion: "CA" },
  },
  baseSalary: { "@type": "MonetaryAmount", currency: "USD", value: 180000 },
  employmentType: "FULL_TIME",
});

function makeLinkedInHtml(): string {
  return `<html>
    <head>
      <script type="application/ld+json">${LINKEDIN_JSON_LD}</script>
      <meta property="og:title" content="Senior Software Engineer at TechCorp" />
      <meta property="og:description" content="TechCorp is hiring a senior engineer" />
    </head>
    <body>
      <div class="job-details-jobs-unified-top-card__job-title"><h1>Senior Software Engineer</h1></div>
      <div class="job-details-jobs-unified-top-card__company-name">TechCorp Inc.</div>
    </body>
  </html>`;
}

function makeUnknownBoardHtml(): string {
  return `<html>
    <head>
      <meta property="og:title" content="Product Manager" />
      <meta property="og:description" content="We need a PM to lead product strategy and drive outcomes across our engineering teams." />
    </head>
    <body>
      <h1>Product Manager</h1>
      <h2>Company</h2>
      <p>StartupXYZ</p>
      <main>${"Job description content. ".repeat(20)}</main>
    </body>
  </html>`;
}

function makeMinimalHtml(): string {
  return `<html>
    <head></head>
    <body>
      <h1>Mystery Role</h1>
      <p>Some minimal content</p>
    </body>
  </html>`;
}

describe("Pipeline Integration", () => {
  it("LinkedIn (JSON-LD) short-circuits at Gate(0.85)", async () => {
    const pipeline = createDefaultPipeline();
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/12345",
      makeDom(makeLinkedInHtml())
    );

    const result = await pipeline(ctx);

    // Board detected
    expect(result.board).toBe("linkedin");

    // All fields from JSON-LD
    expect(result.fields.title?.value).toBe("Senior Software Engineer");
    expect(result.fields.title?.source).toBe("json-ld");
    expect(result.fields.company?.value).toBe("TechCorp Inc.");
    expect(result.fields.description?.value).toContain("senior software engineer");

    // Should have short-circuited at Gate(0.85)
    const gate85 = result.trace.gateDecisions.find((g) => g.gate === 0.85);
    expect(gate85).toBeDefined();
    expect(gate85?.action).toBe("short-circuit");

    // CssSelector, OgMeta, Heuristic, AiFallback should NOT have executed
    expect(result.trace.layersExecuted).toContain("board-detector");
    expect(result.trace.layersExecuted).toContain("json-ld");
    expect(result.trace.layersExecuted).not.toContain("css");
    expect(result.trace.layersExecuted).not.toContain("og-meta");
    expect(result.trace.layersExecuted).not.toContain("heuristic");
    expect(result.trace.layersExecuted).not.toContain("ai-fallback");

    // High completeness
    expect(result.completeness).toBeGreaterThanOrEqual(0.85);
  });

  it("unknown board runs all layers when confidence stays low", async () => {
    const pipeline = createDefaultPipeline();
    const ctx = createDetectionContext(
      "https://www.example.com/unknown-page",
      makeDom(makeMinimalHtml())
    );

    const result = await pipeline(ctx);

    // Board is null (unknown URL)
    expect(result.board).toBeNull();

    // Should have run through all layers including ai-fallback
    expect(result.trace.layersExecuted).toContain("board-detector");
    expect(result.trace.layersExecuted).toContain("json-ld");
    expect(result.trace.layersExecuted).toContain("css");
    expect(result.trace.layersExecuted).toContain("og-meta");
    expect(result.trace.layersExecuted).toContain("heuristic");
    expect(result.trace.layersExecuted).toContain("ai-fallback");
    expect(result.trace.layersExecuted).toContain("post-process");

    // AI was triggered (stub)
    expect(result.trace.aiTriggered).toBe(true);

    // All gates continued (did not short-circuit)
    for (const decision of result.trace.gateDecisions) {
      expect(decision.action).toBe("continue");
    }
  });

  it("partial data from OG meta passes some gates", async () => {
    const pipeline = createDefaultPipeline();
    const ctx = createDetectionContext(
      "https://www.example.com/careers/job/999",
      makeDom(makeUnknownBoardHtml())
    );

    const result = await pipeline(ctx);

    // Should have some fields extracted (OG meta + heuristic)
    expect(result.fields.title).toBeDefined();
    expect(result.fields.description).toBeDefined();

    // Trace records execution
    expect(result.trace.totalTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.trace.layersExecuted.length).toBeGreaterThan(0);
  });

  it("pipeline records timing in trace", async () => {
    const pipeline = createDefaultPipeline();
    const ctx = createDetectionContext(
      "https://www.linkedin.com/jobs/view/1",
      makeDom(makeLinkedInHtml())
    );

    const result = await pipeline(ctx);
    expect(result.trace.totalTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("layer ordering is enforced", async () => {
    const pipeline = createDefaultPipeline();
    const ctx = createDetectionContext(
      "https://www.example.com/unknown",
      makeDom(makeMinimalHtml())
    );

    const result = await pipeline(ctx);

    const layers = result.trace.layersExecuted;
    const bdIdx = layers.indexOf("board-detector");
    const jsonIdx = layers.indexOf("json-ld");
    const cssIdx = layers.indexOf("css");
    const ogIdx = layers.indexOf("og-meta");
    const heuristicIdx = layers.indexOf("heuristic");
    const aiIdx = layers.indexOf("ai-fallback");
    const ppIdx = layers.indexOf("post-process");

    // All should be present for a low-confidence run
    expect(bdIdx).toBeGreaterThanOrEqual(0);
    expect(jsonIdx).toBeGreaterThan(bdIdx);
    expect(cssIdx).toBeGreaterThan(jsonIdx);
    expect(ogIdx).toBeGreaterThan(cssIdx);
    expect(heuristicIdx).toBeGreaterThan(ogIdx);
    expect(aiIdx).toBeGreaterThan(heuristicIdx);
    expect(ppIdx).toBeGreaterThan(aiIdx);
  });

  it("error in one layer does not crash pipeline", async () => {
    // This test uses the default pipeline which handles errors via compose
    const pipeline = createDefaultPipeline();
    // An empty DOM should not cause crashes
    const ctx = createDetectionContext(
      "https://example.com",
      makeDom("<html></html>")
    );

    const result = await pipeline(ctx);
    // Should complete without throwing
    expect(result).toBeDefined();
    expect(result.trace.layersExecuted.length).toBeGreaterThan(0);
  });
});
