/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { scrapeJobPage } from "./scanner";
import { SELECTOR_REGISTRY } from "@jobswyft/engine";

function setDocumentHTML(html: string) {
  document.documentElement.innerHTML = html;
}

describe("scrapeJobPage — registry-driven tests", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/job" },
      writable: true,
      configurable: true,
    });
  });

  describe("JSON-LD extraction (Layer 1)", () => {
    it("extracts title from JSON-LD JobPosting", () => {
      setDocumentHTML(`<html><head>
        <script type="application/ld+json">{"@type":"JobPosting","title":"Senior Engineer","hiringOrganization":{"name":"Acme"},"description":"Build stuff"}</script>
      </head><body></body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.title).toBe("Senior Engineer");
      expect(result.sources.title).toBe("json-ld");
    });

    it("finds JobPosting inside @graph array", () => {
      setDocumentHTML(`<html><head>
        <script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"JobPosting","title":"DevOps Engineer","hiringOrganization":"InfraCo"}]}</script>
      </head><body></body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.title).toBe("DevOps Engineer");
      expect(result.company).toBe("InfraCo");
    });

    it("extracts salary from baseSalary", () => {
      setDocumentHTML(`<html><head>
        <script type="application/ld+json">{"@type":"JobPosting","title":"Dev","baseSalary":{"currency":"USD","value":{"minValue":100000,"maxValue":150000}}}</script>
      </head><body></body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.salary).toContain("100000");
      expect(result.salary).toContain("150000");
    });
  });

  describe("Registry-driven CSS extraction (Layer 2)", () => {
    it("uses LinkedIn selectors when board is linkedin", () => {
      setDocumentHTML(`<html><body>
        <div class="job-details-jobs-unified-top-card__job-title"><h1>React Developer</h1></div>
        <div class="job-details-jobs-unified-top-card__company-name"><a>StartupCo</a></div>
        <div class="jobs-description__content">We are looking for a talented React developer to join our team and build amazing products.</div>
      </body></html>`);
      const result = scrapeJobPage("linkedin", SELECTOR_REGISTRY);
      expect(result.title).toBe("React Developer");
      expect(result.company).toBe("StartupCo");
      expect(result.sources.title).toBe("css-board");
      expect(result.sourceSelectorIds.title).toBe("li-title-unified");
    });

    it("uses Indeed selectors when board is indeed", () => {
      setDocumentHTML(`<html><body>
        <h1 data-testid="jobsearch-JobInfoHeader-title">Frontend Developer</h1>
        <div data-testid="inlineHeader-companyName"><a>TechCorp</a></div>
        <div id="jobDescriptionText">Looking for a frontend developer with 3+ years experience in React and TypeScript.</div>
      </body></html>`);
      const result = scrapeJobPage("indeed", SELECTOR_REGISTRY);
      expect(result.title).toBe("Frontend Developer");
      expect(result.company).toBe("TechCorp");
      expect(result.sourceSelectorIds.title).toBe("indeed-title");
    });

    it("falls back to generic selectors when board has no specific entries", () => {
      setDocumentHTML(`<html><body>
        <h1>Backend Engineer</h1>
        <div class="company-info">GenericCo</div>
      </body></html>`);
      const result = scrapeJobPage("simplyhired", SELECTOR_REGISTRY);
      expect(result.title).toBe("Backend Engineer");
      expect(result.sources.title).toBe("css-generic");
      expect(result.sourceSelectorIds.title).toBe("generic-title");
    });

    it("filters out deprecated entries", () => {
      const registryWithDeprecated = [
        ...SELECTOR_REGISTRY,
        {
          id: "test-deprecated",
          board: "linkedin",
          field: "title" as const,
          selectors: [".deprecated-selector"],
          priority: 0,
          status: "deprecated" as const,
          added: "2026-01-01",
        },
      ];
      setDocumentHTML(`<html><body>
        <div class="deprecated-selector">Should Not Match</div>
        <div class="job-details-jobs-unified-top-card__job-title"><h1>Real Title</h1></div>
      </body></html>`);
      const result = scrapeJobPage("linkedin", registryWithDeprecated);
      expect(result.title).toBe("Real Title");
    });

    it("validates salary contains currency/number format", () => {
      setDocumentHTML(`<html><body>
        <div class="salary">Not a salary</div>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.salary).toBe("");
    });

    it("validates title is not a bad pattern", () => {
      setDocumentHTML(`<html><body>
        <h1>Top Job Picks For You</h1>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.title).toBe("");
    });

    it("strips notification prefix from title", () => {
      setDocumentHTML(`<html><body>
        <h1>(3) Software Engineer</h1>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.title).toBe("Software Engineer");
    });
  });

  describe("hasShowMore detection", () => {
    it("returns true when LinkedIn show-more button exists", () => {
      setDocumentHTML(`<html><body>
        <button class="show-more-less-html__button--more">Show more</button>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.hasShowMore).toBe(true);
    });

    it("returns true when closed details element exists", () => {
      setDocumentHTML(`<html><body>
        <details><summary>More info</summary><p>Hidden</p></details>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.hasShowMore).toBe(true);
    });

    it("returns false when no show-more elements", () => {
      setDocumentHTML(`<html><body>
        <p>Simple page</p>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.hasShowMore).toBe(false);
    });
  });

  describe("sourceSelectorIds tracking", () => {
    it("records entry ID when a registry entry matches", () => {
      setDocumentHTML(`<html><body>
        <div class="job-details-jobs-unified-top-card__company-name"><a>TestCo</a></div>
      </body></html>`);
      const result = scrapeJobPage("linkedin", SELECTOR_REGISTRY);
      expect(result.sourceSelectorIds.company).toBe("li-company-unified");
    });
  });

  describe("Layer 5 — no DOM clicks", () => {
    it("does NOT expand details elements", () => {
      setDocumentHTML(`<html><body>
        <details><summary>Click me</summary><p>Hidden content</p></details>
      </body></html>`);
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      // The details element should still be closed (not opened by scanner)
      const details = document.querySelector("details");
      expect(details?.hasAttribute("open")).toBe(false);
    });

    it("does NOT click aria-expanded elements", () => {
      let clicked = false;
      setDocumentHTML(`<html><body>
        <button aria-expanded="false" id="test-btn">Expand</button>
      </body></html>`);
      document.getElementById("test-btn")!.addEventListener("click", () => { clicked = true; });
      scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(clicked).toBe(false);
    });
  });

  describe("Empty/minimal page", () => {
    it("returns empty strings for missing data", () => {
      setDocumentHTML("<html><head></head><body></body></html>");
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.title).toBe("");
      expect(result.company).toBe("");
      expect(result.description).toBe("");
    });

    it("still returns sourceUrl", () => {
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(result.sourceUrl).toBe("https://example.com/job");
    });

    it("returns empty sourceSelectorIds", () => {
      setDocumentHTML("<html><head></head><body></body></html>");
      const result = scrapeJobPage(null, SELECTOR_REGISTRY);
      expect(Object.keys(result.sourceSelectorIds)).toHaveLength(0);
    });
  });
});
