/**
 * Multi-Signal Accumulation Tests — Verifies that signals accumulated via
 * addSignal() across layers are correctly combined by resolveSignals() in
 * post-process, using combineSignals() with diminishing returns.
 *
 * Tests cover: corroborating signals boost confidence, disagreeing signals
 * pick highest, three-signal near-max, ctx.fields updates, trace updates,
 * and employmentType signal behavior.
 */

import { describe, it, expect } from "vitest";
import {
  createDetectionContext,
  addSignal,
  resolveSignals,
  updateCompleteness,
} from "../../src/pipeline/create-context";
import { compose } from "../../src/pipeline/compose";
import { jsonLd } from "../../src/pipeline/layers/json-ld";
import { cssSelector } from "../../src/pipeline/layers/css-selector";
import { ogMeta } from "../../src/pipeline/layers/og-meta";
import { postProcess } from "../../src/pipeline/layers/post-process";
import { boardDetector } from "../../src/pipeline/layers/board-detector";

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function makeDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/**
 * Build a DOM with JSON-LD structured data, CSS-queryable elements,
 * and OG meta tags — allowing each layer to independently extract fields.
 */
function buildJobPageDom(opts: {
  jsonLd?: {
    title?: string;
    company?: string;
    description?: string;
    location?: string;
    salary?: string;
    employmentType?: string | string[];
  };
  css?: {
    title?: string;
    company?: string;
    description?: string;
    location?: string;
  };
  og?: {
    title?: string;
    description?: string;
  };
}): Document {
  const parts: string[] = ["<html><head>"];

  // JSON-LD block
  if (opts.jsonLd) {
    const posting: Record<string, unknown> = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
    };
    if (opts.jsonLd.title) posting.title = opts.jsonLd.title;
    if (opts.jsonLd.company) {
      posting.hiringOrganization = {
        "@type": "Organization",
        name: opts.jsonLd.company,
      };
    }
    if (opts.jsonLd.description) posting.description = opts.jsonLd.description;
    if (opts.jsonLd.location) {
      posting.jobLocation = {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: opts.jsonLd.location,
        },
      };
    }
    if (opts.jsonLd.salary) {
      posting.baseSalary = {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: opts.jsonLd.salary,
      };
    }
    if (opts.jsonLd.employmentType) {
      posting.employmentType = opts.jsonLd.employmentType;
    }
    parts.push(
      `<script type="application/ld+json">${JSON.stringify(posting)}</script>`
    );
  }

  // OG meta tags
  if (opts.og?.title) {
    parts.push(
      `<meta property="og:title" content="${opts.og.title}" />`
    );
  }
  if (opts.og?.description) {
    parts.push(
      `<meta property="og:description" content="${opts.og.description}" />`
    );
  }

  parts.push("</head><body>");

  // CSS-queryable elements using generic selectors that match SELECTOR_REGISTRY
  // Use h1 for title (the heuristic layer uses h1 as fallback)
  if (opts.css?.title) {
    parts.push(`<h1 class="job-title">${opts.css.title}</h1>`);
  }
  if (opts.css?.company) {
    parts.push(`<div class="company-name">${opts.css.company}</div>`);
  }
  if (opts.css?.description) {
    parts.push(
      `<div class="job-description">${opts.css.description}</div>`
    );
  }
  if (opts.css?.location) {
    parts.push(`<div class="job-location">${opts.css.location}</div>`);
  }

  parts.push("</body></html>");
  return makeDom(parts.join("\n"));
}

/**
 * Run a subset of layers via compose, returning the mutated context.
 */
async function runLayers(
  dom: Document,
  url: string,
  layers: Array<typeof jsonLd>
) {
  const pipeline = compose(layers);
  const ctx = createDetectionContext(url, dom);
  return pipeline(ctx);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Multi-Signal Accumulation", () => {
  // ── Test 1: JSON-LD + CSS agree → boosted confidence ────────────────────
  it("boosts confidence when JSON-LD and CSS agree on the same title", async () => {
    // Manually add signals simulating JSON-LD (0.95) and CSS (0.85) agreeing
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // Simulate JSON-LD extracted a title
    ctx.fields.title = {
      value: "Senior Software Engineer",
      source: "json-ld",
      confidence: 0.95,
    };
    addSignal(ctx, "title", {
      value: "Senior Software Engineer",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });

    // Simulate CSS extracted the same title
    addSignal(ctx, "title", {
      value: "Senior Software Engineer",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    // Add a trace entry so resolveSignals can update it
    ctx.trace.fields.push({
      field: "title",
      finalValue: "Senior Software Engineer",
      finalSource: "json-ld",
      attempts: [],
    });

    // Resolve signals
    resolveSignals(ctx);

    // Combined: base = 0.95, bonus = 0.85 * 0.1 * 0.5^0 = 0.085 → 1.035 → capped at 0.99
    expect(ctx.fields.title?.confidence).toBeGreaterThan(0.95);
    expect(ctx.fields.title?.value).toBe("Senior Software Engineer");
  });

  // ── Test 2: JSON-LD + CSS disagree → highest wins ──────────────────────
  it("keeps the highest-confidence value when JSON-LD and CSS disagree", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // JSON-LD says one thing at 0.95
    ctx.fields.title = {
      value: "Senior Software Engineer",
      source: "json-ld",
      confidence: 0.95,
    };
    addSignal(ctx, "title", {
      value: "Senior Software Engineer",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });

    // CSS says something different at 0.85
    addSignal(ctx, "title", {
      value: "Lead Backend Developer",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    ctx.trace.fields.push({
      field: "title",
      finalValue: "Senior Software Engineer",
      finalSource: "json-ld",
      attempts: [],
    });

    resolveSignals(ctx);

    // JSON-LD group: single signal → 0.95
    // CSS group: single signal → 0.85
    // JSON-LD wins
    expect(ctx.fields.title?.value).toBe("Senior Software Engineer");
    expect(ctx.fields.title?.confidence).toBe(0.95);
    expect(ctx.fields.title?.source).toBe("json-ld");
  });

  // ── Test 3: Three signals corroborate → near-max confidence ────────────
  it("reaches near-max confidence when JSON-LD, CSS, and OG all agree", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    const title = "Full Stack Developer";

    ctx.fields.title = {
      value: title,
      source: "json-ld",
      confidence: 0.95,
    };

    addSignal(ctx, "title", {
      value: title,
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "title", {
      value: title,
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });
    addSignal(ctx, "title", {
      value: title,
      source: "og-meta",
      confidence: 0.40,
      layer: "og-meta",
    });

    ctx.trace.fields.push({
      field: "title",
      finalValue: title,
      finalSource: "json-ld",
      attempts: [],
    });

    resolveSignals(ctx);

    // base = 0.95
    // bonus1 = 0.85 * 0.1 * 0.5^0 = 0.085
    // bonus2 = 0.40 * 0.1 * 0.5^1 = 0.020
    // total  = 0.95 + 0.085 + 0.020 = 1.055 → capped at 0.99
    expect(ctx.fields.title?.confidence).toBeCloseTo(0.99, 2);
    expect(ctx.fields.title?.value).toBe(title);
  });

  // ── Test 4: Signal resolution updates ctx.fields ───────────────────────
  it("updates ctx.fields with resolved confidence after resolveSignals()", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // Pre-set the field at JSON-LD confidence (best-so-far during pipeline)
    ctx.fields.company = {
      value: "Acme Corp",
      source: "json-ld",
      confidence: 0.95,
    };

    // Accumulate corroborating signals
    addSignal(ctx, "company", {
      value: "Acme Corp",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "company", {
      value: "Acme Corp",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    ctx.trace.fields.push({
      field: "company",
      finalValue: "Acme Corp",
      finalSource: "json-ld",
      attempts: [],
    });

    const confidenceBefore = ctx.fields.company.confidence;
    resolveSignals(ctx);
    updateCompleteness(ctx);

    // After resolution the combined confidence should exceed the pre-set value
    expect(ctx.fields.company?.confidence).toBeGreaterThan(confidenceBefore);
    // Completeness should be computed (non-zero since company has weight 0.25)
    expect(ctx.completeness).toBeGreaterThan(0);
  });

  // ── Test 5: Signal resolution updates trace ────────────────────────────
  it("updates trace entries to reflect resolved output", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    ctx.fields.title = {
      value: "Software Engineer",
      source: "json-ld",
      confidence: 0.95,
    };

    addSignal(ctx, "title", {
      value: "Software Engineer",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "title", {
      value: "Software Engineer",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    // Create a trace entry that would have been set during mid-pipeline extraction
    ctx.trace.fields.push({
      field: "title",
      finalValue: "Software Engineer",
      finalSource: "json-ld",
      attempts: [
        {
          layer: "json-ld",
          attempted: true,
          matched: true,
          field: "title",
          rawValue: "Software Engineer",
          cleanedValue: "Software Engineer",
          accepted: true,
        },
      ],
    });

    resolveSignals(ctx);

    const traceEntry = ctx.trace.fields.find((f) => f.field === "title");
    expect(traceEntry).toBeDefined();
    // After resolution, trace should reflect the resolved source
    // resolveSignals updates finalValue and finalSource when combined > existing
    expect(traceEntry!.finalValue).toBe("Software Engineer");
    // The source from combineSignals is the base signal's source (json-ld)
    expect(traceEntry!.finalSource).toBe("json-ld");
  });

  // ── Test 6: employmentType participates in signals ─────────────────────
  it("resolves employmentType via signals but does not affect completeness", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // Add employmentType signals from two layers
    addSignal(ctx, "employmentType", {
      value: "FULL_TIME",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "employmentType", {
      value: "FULL_TIME",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    resolveSignals(ctx);

    // employmentType should be resolved
    expect(ctx.fields.employmentType).toBeDefined();
    expect(ctx.fields.employmentType?.value).toBe("FULL_TIME");
    // Combined confidence should exceed the base
    expect(ctx.fields.employmentType?.confidence).toBeGreaterThan(0.95);

    // But completeness should be 0 because employmentType has no weight
    // in FIELD_WEIGHTS (only title, company, description, location, salary)
    updateCompleteness(ctx);
    expect(ctx.completeness).toBe(0);
  });

  // ── Test 7: Full pipeline integration — JSON-LD + OG produce signals ───
  it("accumulates signals across real layers in a composed pipeline", async () => {
    const dom = buildJobPageDom({
      jsonLd: {
        title: "Data Engineer",
        company: "DataCo",
        description:
          "Join DataCo as a Data Engineer and build world-class data pipelines for our analytics platform.",
      },
      og: {
        title: "Data Engineer",
        description:
          "Join DataCo as a Data Engineer and build world-class data pipelines for our analytics platform.",
      },
    });

    // Run json-ld → og-meta → post-process (post-process calls resolveSignals)
    const ctx = await runLayers(
      dom,
      "https://example.com/jobs/data-engineer",
      [jsonLd, ogMeta, postProcess]
    );

    // Title: JSON-LD(0.95) + OG(0.40) both say "Data Engineer"
    // base = 0.95, bonus = 0.40 * 0.1 * 0.5^0 = 0.04 → 0.99 (capped)
    expect(ctx.fields.title?.value).toBe("Data Engineer");
    expect(ctx.fields.title?.confidence).toBeGreaterThan(0.95);

    // Description: also extracted by both layers
    expect(ctx.fields.description).toBeDefined();
    expect(ctx.fields.description?.confidence).toBeGreaterThan(0.40);

    // Company: only from JSON-LD (OG does not extract company)
    expect(ctx.fields.company?.value).toBe("DataCo");
    expect(ctx.fields.company?.confidence).toBe(0.95);
  });

  // ── Test 8: resolveSignals does not downgrade existing higher confidence ─
  it("does not downgrade a field if combined confidence is lower than existing", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // Pre-set title with user-edit confidence (1.0)
    ctx.fields.title = {
      value: "User Provided Title",
      source: "user-edit",
      confidence: 1.0,
    };

    // Add a signal with lower confidence
    addSignal(ctx, "title", {
      value: "Extracted Title",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });

    resolveSignals(ctx);

    // User-edit at 1.0 should remain — resolveSignals only writes if combined > existing
    expect(ctx.fields.title?.value).toBe("User Provided Title");
    expect(ctx.fields.title?.confidence).toBe(1.0);
    expect(ctx.fields.title?.source).toBe("user-edit");
  });

  // ── Test 9: Multiple fields resolved independently ─────────────────────
  it("resolves multiple fields independently", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // Title signals — corroborating
    addSignal(ctx, "title", {
      value: "Frontend Developer",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "title", {
      value: "Frontend Developer",
      source: "og-meta",
      confidence: 0.40,
      layer: "og-meta",
    });

    // Company signals — single source
    addSignal(ctx, "company", {
      value: "TechStartup Inc",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });

    // Location signals — corroborating
    addSignal(ctx, "location", {
      value: "Remote",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "location", {
      value: "Remote",
      source: "heuristic",
      confidence: 0.30,
      layer: "heuristic",
    });

    resolveSignals(ctx);

    // Title: boosted from corroboration
    expect(ctx.fields.title?.confidence).toBeGreaterThan(0.95);

    // Company: single signal, no boost
    expect(ctx.fields.company?.confidence).toBe(0.95);

    // Location: boosted from corroboration
    expect(ctx.fields.location?.confidence).toBeGreaterThan(0.95);

    // All fields should have correct values
    expect(ctx.fields.title?.value).toBe("Frontend Developer");
    expect(ctx.fields.company?.value).toBe("TechStartup Inc");
    expect(ctx.fields.location?.value).toBe("Remote");
  });

  // ── Test 10: Empty signals array is a no-op ────────────────────────────
  it("does not modify fields when no signals have been accumulated", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // Pre-set a field
    ctx.fields.title = {
      value: "Original Title",
      source: "json-ld",
      confidence: 0.95,
    };

    // Do NOT add any signals — ctx.signals is empty
    resolveSignals(ctx);

    // Field should remain unchanged
    expect(ctx.fields.title?.value).toBe("Original Title");
    expect(ctx.fields.title?.confidence).toBe(0.95);
  });

  // ── Test 11: Trace entry created for field that had no prior trace ─────
  it("creates a trace entry for signal-only fields with no prior trace", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    // No trace entries exist, but we add signals
    addSignal(ctx, "salary", {
      value: "USD 150000",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "salary", {
      value: "USD 150000",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    resolveSignals(ctx);

    // Field should be resolved
    expect(ctx.fields.salary?.value).toBe("USD 150000");
    expect(ctx.fields.salary?.confidence).toBeGreaterThan(0.95);

    // Trace entry should now be created for signal-only resolutions
    const salaryTrace = ctx.trace.fields.find((f) => f.field === "salary");
    expect(salaryTrace).toBeDefined();
    expect(salaryTrace!.finalValue).toBe("USD 150000");
    expect(salaryTrace!.finalSource).toBe("json-ld");
  });

  // ── Test 12: Diminishing returns math verification with exact values ───
  it("produces exact diminishing-returns confidence for two agreeing signals", async () => {
    const dom = makeDom("<html></html>");
    const ctx = createDetectionContext("https://example.com/job", dom);

    addSignal(ctx, "title", {
      value: "QA Engineer",
      source: "json-ld",
      confidence: 0.95,
      layer: "json-ld",
    });
    addSignal(ctx, "title", {
      value: "QA Engineer",
      source: "css-board",
      confidence: 0.85,
      layer: "css",
    });

    resolveSignals(ctx);

    // base = 0.95, bonus = 0.85 * 0.1 * 0.5^0 = 0.085 → total = 1.035 → capped at 0.99
    expect(ctx.fields.title?.confidence).toBeCloseTo(0.99, 5);
  });
});
