import { describe, it, expect } from "vitest";
import { jsonLd } from "../../../src/pipeline/layers/json-ld";
import { createDetectionContext } from "../../../src/pipeline/create-context";

function makeDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

const LINKEDIN_JSON_LD = JSON.stringify({
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  title: "Senior Software Engineer",
  hiringOrganization: { "@type": "Organization", name: "Acme Corp" },
  description: "We are looking for a senior software engineer to join our team.",
  jobLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressLocality: "San Francisco", addressRegion: "CA" },
  },
  baseSalary: { "@type": "MonetaryAmount", currency: "USD", value: 150000 },
  employmentType: "FULL_TIME",
});

describe("jsonLd layer", () => {
  it("extracts all fields from a standard JobPosting", async () => {
    const dom = makeDom(`<html><head><script type="application/ld+json">${LINKEDIN_JSON_LD}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://linkedin.com/jobs/view/1", dom);

    await jsonLd(ctx, async () => {});

    expect(ctx.fields.title?.value).toBe("Senior Software Engineer");
    expect(ctx.fields.title?.confidence).toBe(0.95);
    expect(ctx.fields.title?.source).toBe("json-ld");
    expect(ctx.fields.company?.value).toBe("Acme Corp");
    expect(ctx.fields.description?.value).toContain("senior software engineer");
    expect(ctx.fields.location?.value).toBe("San Francisco, CA");
    expect(ctx.fields.salary?.value).toBe("USD 150000");
    expect(ctx.fields.employmentType?.value).toBe("FULL_TIME");
  });

  it("updates completeness after extraction", async () => {
    const dom = makeDom(`<html><head><script type="application/ld+json">${LINKEDIN_JSON_LD}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://linkedin.com/jobs/view/1", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.completeness).toBeGreaterThan(0.85);
  });

  it("handles @graph arrays", async () => {
    const graphData = JSON.stringify({
      "@context": "https://schema.org/",
      "@graph": [
        { "@type": "WebSite", name: "Test Site" },
        { "@type": "JobPosting", title: "DevOps Engineer", hiringOrganization: { name: "Graph Corp" } },
      ],
    });
    const dom = makeDom(`<html><head><script type="application/ld+json">${graphData}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com/job", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.title?.value).toBe("DevOps Engineer");
    expect(ctx.fields.company?.value).toBe("Graph Corp");
  });

  it("handles nested hiringOrganization.name", async () => {
    const data = JSON.stringify({
      "@type": "JobPosting",
      title: "PM",
      hiringOrganization: { "@type": "Organization", name: "Nested Org" },
    });
    const dom = makeDom(`<html><head><script type="application/ld+json">${data}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com/job", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.company?.value).toBe("Nested Org");
  });

  it("handles missing fields gracefully", async () => {
    const data = JSON.stringify({ "@type": "JobPosting", title: "Only Title" });
    const dom = makeDom(`<html><head><script type="application/ld+json">${data}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com/job", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.title?.value).toBe("Only Title");
    expect(ctx.fields.company).toBeUndefined();
    expect(ctx.fields.description).toBeUndefined();
  });

  it("handles malformed JSON gracefully", async () => {
    const dom = makeDom(`<html><head><script type="application/ld+json">{ not valid json }</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com/job", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.title).toBeUndefined();
    // Should not throw
  });

  it("handles multiple ld+json blocks — first JobPosting wins", async () => {
    const data1 = JSON.stringify({ "@type": "WebSite", name: "Site" });
    const data2 = JSON.stringify({ "@type": "JobPosting", title: "Engineer", hiringOrganization: { name: "Co" } });
    const dom = makeDom(`<html><head>
      <script type="application/ld+json">${data1}</script>
      <script type="application/ld+json">${data2}</script>
    </head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.title?.value).toBe("Engineer");
  });

  it("handles salary range (min/max)", async () => {
    const data = JSON.stringify({
      "@type": "JobPosting",
      title: "Dev",
      baseSalary: { currency: "USD", minValue: 100000, maxValue: 150000 },
    });
    const dom = makeDom(`<html><head><script type="application/ld+json">${data}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com/job", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.salary?.value).toBe("USD 100000 - 150000");
  });

  it("handles employmentType as array", async () => {
    const data = JSON.stringify({
      "@type": "JobPosting",
      title: "Flex Dev",
      employmentType: ["FULL_TIME", "PART_TIME"],
    });
    const dom = makeDom(`<html><head><script type="application/ld+json">${data}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com/job", dom);

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.employmentType?.value).toBe("FULL_TIME, PART_TIME");
  });

  it("records layer execution in trace", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com", dom);
    await jsonLd(ctx, async () => {});
    expect(ctx.trace.layersExecuted).toContain("json-ld");
  });

  it("calls next()", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com", dom);
    let nextCalled = false;
    await jsonLd(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it("does not overwrite higher-confidence fields", async () => {
    const dom = makeDom(`<html><head><script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting", title: "Lower Title"
    })}</script></head><body></body></html>`);
    const ctx = createDetectionContext("https://example.com", dom);
    // Pre-set a field with confidence 1.0 (user-edit)
    ctx.fields.title = { value: "User Title", source: "user-edit", confidence: 1.0 };

    await jsonLd(ctx, async () => {});
    expect(ctx.fields.title.value).toBe("User Title");
  });
});
