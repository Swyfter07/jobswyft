import { describe, it, expect } from "vitest";
import { SELECTOR_REGISTRY, type SelectorEntry } from "./selector-registry";

describe("SELECTOR_REGISTRY — data integrity", () => {
  it("has entries", () => {
    expect(SELECTOR_REGISTRY.length).toBeGreaterThan(20);
  });

  it("every entry has a unique id", () => {
    const ids = SELECTOR_REGISTRY.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every entry has valid field values", () => {
    const validFields = ["title", "company", "description", "location", "salary", "employmentType"];
    for (const entry of SELECTOR_REGISTRY) {
      expect(validFields).toContain(entry.field);
    }
  });

  it("every entry has valid status values", () => {
    const validStatuses = ["active", "degraded", "deprecated"];
    for (const entry of SELECTOR_REGISTRY) {
      expect(validStatuses).toContain(entry.status);
    }
  });

  it("every entry has at least one selector", () => {
    for (const entry of SELECTOR_REGISTRY) {
      expect(entry.selectors.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a positive priority", () => {
    for (const entry of SELECTOR_REGISTRY) {
      expect(entry.priority).toBeGreaterThan(0);
    }
  });

  it("every entry has an added date in ISO format", () => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const entry of SELECTOR_REGISTRY) {
      expect(entry.added).toMatch(isoDateRegex);
    }
  });

  it("has entries for known boards", () => {
    const boards = new Set(SELECTOR_REGISTRY.map(e => e.board));
    expect(boards.has("linkedin")).toBe(true);
    expect(boards.has("indeed")).toBe(true);
    expect(boards.has("greenhouse")).toBe(true);
    expect(boards.has("lever")).toBe(true);
    expect(boards.has("workday")).toBe(true);
    expect(boards.has("generic")).toBe(true);
  });

  it("no duplicate selectors within same board+field", () => {
    const groups = new Map<string, string[]>();
    for (const entry of SELECTOR_REGISTRY) {
      const key = `${entry.board}:${entry.field}`;
      const existing = groups.get(key) || [];
      for (const sel of entry.selectors) {
        expect(existing).not.toContain(sel);
      }
      groups.set(key, [...existing, ...entry.selectors]);
    }
  });

  it("is JSON-serializable (no functions or circular refs)", () => {
    const serialized = JSON.stringify(SELECTOR_REGISTRY);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toHaveLength(SELECTOR_REGISTRY.length);
    expect(deserialized[0].id).toBe(SELECTOR_REGISTRY[0].id);
  });

  it("generic entries have higher priority than board-specific ones", () => {
    const boardEntries = SELECTOR_REGISTRY.filter(e => e.board !== "generic");
    const genericEntries = SELECTOR_REGISTRY.filter(e => e.board === "generic");

    const maxBoardPriority = Math.max(...boardEntries.map(e => e.priority));
    const minGenericPriority = Math.min(...genericEntries.map(e => e.priority));

    expect(minGenericPriority).toBeGreaterThan(maxBoardPriority);
  });
});
