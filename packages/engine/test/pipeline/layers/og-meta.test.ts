import { describe, it, expect } from "vitest";
import { ogMeta } from "../../../src/pipeline/layers/og-meta";
import { createDetectionContext } from "../../../src/pipeline/create-context";

function makeDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("ogMeta layer", () => {
  it("extracts og:title and og:description", async () => {
    const html = `<html><head>
      <meta property="og:title" content="Frontend Developer at TechCo" />
      <meta property="og:description" content="Join our team building the next generation of web apps." />
    </head><body></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await ogMeta(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Frontend Developer at TechCo");
    expect(ctx.fields.title?.confidence).toBe(0.40);
    expect(ctx.fields.title?.source).toBe("og-meta");
    expect(ctx.fields.description?.value).toContain("next generation");
    expect(ctx.fields.description?.confidence).toBe(0.40);
  });

  it("handles missing og:title", async () => {
    const html = `<html><head>
      <meta property="og:description" content="Some description" />
    </head><body></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await ogMeta(ctx, async () => {});

    expect(ctx.fields.title).toBeUndefined();
    expect(ctx.fields.description?.value).toBe("Some description");
  });

  it("handles missing og:description", async () => {
    const html = `<html><head>
      <meta property="og:title" content="Job Title" />
    </head><body></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await ogMeta(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Job Title");
    expect(ctx.fields.description).toBeUndefined();
  });

  it("handles no OG meta tags at all", async () => {
    const html = "<html><head></head><body></body></html>";
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await ogMeta(ctx, async () => {});

    expect(ctx.fields.title).toBeUndefined();
    expect(ctx.fields.description).toBeUndefined();
  });

  it("does not overwrite higher-confidence fields", async () => {
    const html = `<html><head>
      <meta property="og:title" content="OG Title" />
    </head><body></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));
    ctx.fields.title = { value: "JSON-LD Title", source: "json-ld", confidence: 0.95 };

    await ogMeta(ctx, async () => {});

    expect(ctx.fields.title.value).toBe("JSON-LD Title");
  });

  it("records layer execution in trace", async () => {
    const ctx = createDetectionContext("https://example.com", makeDom("<html></html>"));
    await ogMeta(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("og-meta");
  });

  it("updates completeness", async () => {
    const html = `<html><head>
      <meta property="og:title" content="Engineer" />
      <meta property="og:description" content="A great opportunity for engineers." />
    </head><body></body></html>`;
    const ctx = createDetectionContext("https://example.com/job", makeDom(html));

    await ogMeta(ctx, async () => {});

    expect(ctx.completeness).toBeGreaterThan(0);
  });
});
