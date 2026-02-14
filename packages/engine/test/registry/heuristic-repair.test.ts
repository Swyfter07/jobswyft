import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import {
  attemptHeuristicRepair,
  type RepairResult,
} from "../../src/registry/heuristic-repair";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a Document from raw HTML. */
function dom(html: string): Document {
  return new JSDOM(html).window.document;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("attemptHeuristicRepair", () => {
  // ── Strategy A: Sibling/Parent Traversal ──────────────────────────────────

  describe("sibling/parent traversal", () => {
    it("finds heading matching 'Company' with sibling content", () => {
      const doc = dom(`
        <article>
          <h3>Company</h3>
          <span class="org-name">Acme Corp</span>
        </article>
      `);

      const result = attemptHeuristicRepair(doc, "company", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Acme Corp");
      expect(result!.repairedSelector).toBe("span.org-name");
      expect(result!.confidence).toBe(0.40);
      expect(result!.strategy).toBe("sibling-parent-traversal");
    });

    it("finds heading matching 'Location' inside a section container", () => {
      const doc = dom(`
        <section>
          <h2>Office Location</h2>
          <p class="addr">San Francisco, CA</p>
        </section>
      `);

      const result = attemptHeuristicRepair(doc, "location", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("San Francisco, CA");
      expect(result!.strategy).toBe("sibling-parent-traversal");
    });
  });

  // ── Strategy B: Attribute Discovery ───────────────────────────────────────

  describe("attribute discovery", () => {
    it("finds element with data-testid='job-title'", () => {
      const doc = dom(`
        <div>
          <span data-testid="job-title">Senior Engineer</span>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "title", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Senior Engineer");
      expect(result!.repairedSelector).toBe('[data-testid*="title"]');
      expect(result!.confidence).toBe(0.40);
      expect(result!.strategy).toBe("attribute-discovery");
    });

    it("finds element with itemprop='title'", () => {
      const doc = dom(`
        <div>
          <h1 itemprop="title">Product Manager</h1>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "title", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Product Manager");
      expect(result!.repairedSelector).toBe('[itemprop*="title"]');
      expect(result!.confidence).toBe(0.40);
      expect(result!.strategy).toBe("attribute-discovery");
    });

    it("finds element with aria-label containing keyword", () => {
      const doc = dom(`
        <div>
          <span aria-label="salary range">$120k - $180k</span>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "salary", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("$120k - $180k");
      expect(result!.strategy).toBe("attribute-discovery");
    });

    it("finds element with data-automation-id attribute", () => {
      const doc = dom(`
        <div>
          <div data-automation-id="company-name">Google LLC</div>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "company", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Google LLC");
      expect(result!.repairedSelector).toBe('[data-automation-id*="company"]');
      expect(result!.strategy).toBe("attribute-discovery");
    });
  });

  // ── Strategy C: Class Fuzzy Match ─────────────────────────────────────────

  describe("class fuzzy match", () => {
    it("finds .job-titl via Levenshtein distance < 3 from 'title'", () => {
      const doc = dom(`
        <div>
          <span class="job-titl">Staff Engineer</span>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "title", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Staff Engineer");
      expect(result!.repairedSelector).toBe(".job-titl");
      expect(result!.confidence).toBe(0.40);
      expect(result!.strategy).toBe("class-fuzzy-match");
    });

    it("finds .job-title via exact class containment", () => {
      const doc = dom(`
        <div>
          <h2 class="job-title">Backend Developer</h2>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "title", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Backend Developer");
      expect(result!.repairedSelector).toBe(".job-title");
      expect(result!.confidence).toBe(0.40);
      expect(result!.strategy).toBe("class-fuzzy-match");
    });

    it("finds element via fuzzy match on salary keyword", () => {
      const doc = dom(`
        <div>
          <span class="comp-salry">$90k - $110k</span>
        </div>
      `);

      // "salry" has Levenshtein distance 1 from "salary"
      const result = attemptHeuristicRepair(doc, "salary", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("$90k - $110k");
      expect(result!.strategy).toBe("class-fuzzy-match");
    });
  });

  // ── Null / No Match ───────────────────────────────────────────────────────

  describe("no match scenarios", () => {
    it("returns null when no strategies succeed", () => {
      const doc = dom(`
        <div>
          <p class="random-stuff">Nothing relevant here</p>
          <span id="unrelated">Just some text</span>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "salary", null);

      expect(result).toBeNull();
    });

    it("returns null for an unknown field name", () => {
      const doc = dom(`
        <article>
          <h3>Title</h3>
          <span>Engineer</span>
        </article>
      `);

      const result = attemptHeuristicRepair(doc, "nonexistent-field", null);

      expect(result).toBeNull();
    });

    it("returns null when matching elements have empty text content", () => {
      const doc = dom(`
        <section>
          <h2>Company</h2>
          <span class="org-name"></span>
        </section>
      `);

      const result = attemptHeuristicRepair(doc, "company", null);

      // The sibling has empty text, so it should not match
      expect(result).toBeNull();
    });
  });

  // ── Strategy Ordering / Priority ──────────────────────────────────────────

  describe("strategy ordering", () => {
    it("sibling traversal takes priority over attribute discovery", () => {
      const doc = dom(`
        <article>
          <h3>Company</h3>
          <span class="org">TechCo</span>
          <div data-testid="company-info">DataCo</div>
        </article>
      `);

      const result = attemptHeuristicRepair(doc, "company", null);

      expect(result).not.toBeNull();
      // Sibling traversal should win since it runs first
      expect(result!.value).toBe("TechCo");
      expect(result!.strategy).toBe("sibling-parent-traversal");
    });

    it("attribute discovery takes priority over class fuzzy match", () => {
      const doc = dom(`
        <div>
          <span data-testid="job-title">Attr Title</span>
          <h2 class="job-title">Class Title</h2>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "title", null);

      expect(result).not.toBeNull();
      // Attribute discovery runs before class fuzzy match
      expect(result!.value).toBe("Attr Title");
      expect(result!.strategy).toBe("attribute-discovery");
    });

    it("falls through to class fuzzy match when prior strategies fail", () => {
      const doc = dom(`
        <div>
          <p class="posting-description">Full job details here.</p>
        </div>
      `);

      const result = attemptHeuristicRepair(doc, "description", null);

      expect(result).not.toBeNull();
      expect(result!.value).toBe("Full job details here.");
      expect(result!.strategy).toBe("class-fuzzy-match");
    });
  });

  // ── Result Shape ──────────────────────────────────────────────────────────

  describe("result shape", () => {
    it("has correct shape: value, repairedSelector, confidence 0.40, strategy string", () => {
      const doc = dom(`
        <section>
          <h2>Description</h2>
          <div class="job-desc">We are looking for a talented developer.</div>
        </section>
      `);

      const result = attemptHeuristicRepair(doc, "description", null);

      expect(result).not.toBeNull();

      // Verify all four properties exist with correct types
      expect(result).toHaveProperty("value");
      expect(result).toHaveProperty("repairedSelector");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("strategy");

      expect(typeof result!.value).toBe("string");
      expect(typeof result!.repairedSelector).toBe("string");
      expect(typeof result!.confidence).toBe("number");
      expect(typeof result!.strategy).toBe("string");

      // Confidence is always 0.40
      expect(result!.confidence).toBe(0.40);

      // Value is non-empty
      expect(result!.value.length).toBeGreaterThan(0);

      // Strategy is one of the known strategies
      expect([
        "sibling-parent-traversal",
        "attribute-discovery",
        "class-fuzzy-match",
      ]).toContain(result!.strategy);
    });

    it("board parameter is accepted but does not affect the result", () => {
      const doc = dom(`
        <article>
          <h3>Title</h3>
          <span class="pos">Software Engineer</span>
        </article>
      `);

      const withBoard = attemptHeuristicRepair(doc, "title", "linkedin");
      const withoutBoard = attemptHeuristicRepair(doc, "title", null);

      expect(withBoard).toEqual(withoutBoard);
    });
  });
});
