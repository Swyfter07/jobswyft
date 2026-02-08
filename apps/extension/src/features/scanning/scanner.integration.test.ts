/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scrapeJobPage } from "./scanner";

const FIXTURES_DIR = join(__dirname, "__fixtures__");

function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), "utf-8");
}

function setDocumentHTML(html: string) {
  document.documentElement.innerHTML = html;
}

describe("scrapeJobPage — fixture integration tests", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  describe("LinkedIn fixture", () => {
    beforeEach(() => {
      setDocumentHTML(loadFixture("linkedin-job.html"));
      // jsdom doesn't set location from HTML, set it manually
      Object.defineProperty(window, "location", {
        value: { href: "https://www.linkedin.com/jobs/view/12345" },
        writable: true,
      });
    });

    it("extracts title from JSON-LD", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.title).toBe("Senior Software Engineer");
    });

    it("extracts company from JSON-LD", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.company).toBe("Acme Corp");
    });

    it("extracts location from JSON-LD", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.location).toContain("San Francisco");
    });

    it("extracts employment type from JSON-LD", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.employmentType).toBe("FULL_TIME");
    });

    it("extracts description", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.description).toContain("scalable systems");
    });

    it("tracks sources as json-ld", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.sources.title).toBe("json-ld");
      expect(result.sources.company).toBe("json-ld");
    });

    it("returns sourceUrl from window.location", () => {
      const result = scrapeJobPage("linkedin");
      expect(result.sourceUrl).toBe("https://www.linkedin.com/jobs/view/12345");
    });
  });

  describe("Indeed fixture", () => {
    beforeEach(() => {
      setDocumentHTML(loadFixture("indeed-job.html"));
      Object.defineProperty(window, "location", {
        value: { href: "https://www.indeed.com/viewjob?jk=abc123" },
        writable: true,
      });
    });

    it("extracts title from CSS selectors", () => {
      const result = scrapeJobPage("indeed");
      expect(result.title).toBe("Frontend Developer");
    });

    it("extracts company from CSS selectors", () => {
      const result = scrapeJobPage("indeed");
      expect(result.company).toBe("TechStartup Inc");
    });

    it("extracts description from #jobDescriptionText", () => {
      const result = scrapeJobPage("indeed");
      expect(result.description).toContain("Frontend Developer");
    });

    it("extracts location", () => {
      const result = scrapeJobPage("indeed");
      expect(result.location).toContain("Austin");
    });
  });

  describe("Greenhouse fixture", () => {
    beforeEach(() => {
      setDocumentHTML(loadFixture("greenhouse-job.html"));
      Object.defineProperty(window, "location", {
        value: { href: "https://boards.greenhouse.io/cloudco/jobs/456" },
        writable: true,
      });
    });

    it("extracts title", () => {
      const result = scrapeJobPage("greenhouse");
      expect(result.title).toBe("Product Manager");
    });

    it("extracts company", () => {
      const result = scrapeJobPage("greenhouse");
      expect(result.company).toBe("CloudCo");
    });

    it("extracts description from .job-post-description", () => {
      const result = scrapeJobPage("greenhouse");
      expect(result.description).toContain("SaaS platform roadmap");
    });
  });

  describe("Lever fixture", () => {
    beforeEach(() => {
      setDocumentHTML(loadFixture("lever-job.html"));
      Object.defineProperty(window, "location", {
        value: { href: "https://jobs.lever.co/dataflow/789" },
        writable: true,
      });
    });

    it("extracts title from posting-headline", () => {
      const result = scrapeJobPage("lever");
      expect(result.title).toBe("Data Engineer");
    });

    it("extracts description from jobDescription-container", () => {
      const result = scrapeJobPage("lever");
      expect(result.description).toContain("data pipelines");
    });
  });

  describe("JSON-LD @graph array fixture", () => {
    beforeEach(() => {
      setDocumentHTML(loadFixture("jsonld-graph-job.html"));
      Object.defineProperty(window, "location", {
        value: { href: "https://careers.infraco.com/devops-engineer" },
        writable: true,
      });
    });

    it("finds JobPosting inside @graph array", () => {
      const result = scrapeJobPage();
      expect(result.title).toBe("DevOps Engineer");
    });

    it("extracts company from @graph JobPosting", () => {
      const result = scrapeJobPage();
      expect(result.company).toBe("InfraCo");
    });

    it("extracts location from @graph", () => {
      const result = scrapeJobPage();
      expect(result.location).toContain("Seattle");
    });

    it("extracts salary from baseSalary in @graph", () => {
      const result = scrapeJobPage();
      expect(result.salary).toBeTruthy();
    });

    it("extracts employment type from @graph", () => {
      const result = scrapeJobPage();
      expect(result.employmentType).toBe("FULL_TIME");
    });

    it("sources are json-ld for @graph extraction", () => {
      const result = scrapeJobPage();
      expect(result.sources.title).toBe("json-ld");
    });
  });

  describe("Workday fixture", () => {
    beforeEach(() => {
      setDocumentHTML(loadFixture("workday-job.html"));
      Object.defineProperty(window, "location", {
        value: { href: "https://cloudtech.myworkdayjobs.com/en-US/careers/job/Software-Engineer_R12345" },
        writable: true,
      });
    });

    it("extracts title from data-automation-id header", () => {
      const result = scrapeJobPage("workday");
      expect(result.title).toBe("Software Engineer");
    });

    it("extracts description from data-automation-id description", () => {
      const result = scrapeJobPage("workday");
      expect(result.description).toContain("cloud infrastructure");
    });

    it("extracts location", () => {
      const result = scrapeJobPage("workday");
      expect(result.location).toContain("Seattle");
    });

    it("extracts salary", () => {
      const result = scrapeJobPage("workday");
      expect(result.salary).toContain("130,000");
    });
  });

  describe("Empty/minimal page", () => {
    beforeEach(() => {
      document.documentElement.innerHTML = "<html><head></head><body></body></html>";
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/unknown-job" },
        writable: true,
      });
    });

    it("returns empty strings for missing data", () => {
      const result = scrapeJobPage();
      expect(result.title).toBe("");
      expect(result.company).toBe("");
      expect(result.description).toBe("");
    });

    it("still returns sourceUrl", () => {
      const result = scrapeJobPage();
      expect(result.sourceUrl).toBe("https://example.com/unknown-job");
    });
  });
});
