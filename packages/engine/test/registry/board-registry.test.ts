import { describe, it, expect, vi } from "vitest";
import { BoardRegistry } from "../../src/registry/board-registry";
import type { SiteConfig } from "../../src/pipeline/types";
import { InMemorySelectorHealthStore } from "../../src/registry/selector-health";

function makeConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    board: "test",
    name: "Test Board",
    urlPatterns: ["test\\.com/jobs"],
    selectors: { title: { primary: ["h1"] } },
    version: 1,
    ...overrides,
  };
}

describe("BoardRegistry", () => {
  describe("construction", () => {
    it("creates registry with valid configs", () => {
      const registry = new BoardRegistry([makeConfig()]);
      expect(registry.has("test")).toBe(true);
    });

    it("creates empty registry from empty array", () => {
      const registry = new BoardRegistry([]);
      expect(registry.getAllConfigs()).toHaveLength(0);
    });

    it("skips invalid configs with warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const registry = new BoardRegistry([
        makeConfig(),
        { board: "", name: "", urlPatterns: [], selectors: {}, version: 0 } as unknown as SiteConfig,
      ]);
      expect(registry.getAllConfigs()).toHaveLength(1);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it("skips configs with invalid regex patterns", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config = makeConfig({ urlPatterns: ["[invalid("] });
      const registry = new BoardRegistry([config]);
      // Config is still loaded, just the pattern is skipped
      expect(registry.has("test")).toBe(true);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe("getConfig (URL matching)", () => {
    it("returns correct config for matching URL", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "linkedin", urlPatterns: ["linkedin\\.com/jobs"] }),
      ]);
      const config = registry.getConfig("https://www.linkedin.com/jobs/view/123");
      expect(config?.board).toBe("linkedin");
    });

    it("returns undefined for non-matching URL", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "linkedin", urlPatterns: ["linkedin\\.com/jobs"] }),
      ]);
      expect(registry.getConfig("https://www.example.com")).toBeUndefined();
    });

    it("returns the most specific match (longest pattern)", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "generic-greenhouse", urlPatterns: ["greenhouse"] }),
        makeConfig({ board: "greenhouse", urlPatterns: ["boards\\.greenhouse\\.io/.+/jobs/\\d+"] }),
      ]);
      const config = registry.getConfig("https://boards.greenhouse.io/acme/jobs/123");
      expect(config?.board).toBe("greenhouse");
    });

    it("handles multiple configs without errors", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "linkedin", urlPatterns: ["linkedin\\.com/jobs"] }),
        makeConfig({ board: "indeed", urlPatterns: ["indeed\\.com/viewjob"] }),
        makeConfig({ board: "greenhouse", urlPatterns: ["greenhouse\\.io"] }),
      ]);
      expect(registry.getConfig("https://indeed.com/viewjob?jk=abc")?.board).toBe("indeed");
      expect(registry.getConfig("https://greenhouse.io/jobs/1")?.board).toBe("greenhouse");
    });
  });

  describe("getGenericConfig", () => {
    it("returns the generic config when present", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "generic", name: "Generic ATS", urlPatterns: [] }),
      ]);
      expect(registry.getGenericConfig()?.board).toBe("generic");
    });

    it("returns undefined when no generic config exists", () => {
      const registry = new BoardRegistry([makeConfig({ board: "linkedin" })]);
      expect(registry.getGenericConfig()).toBeUndefined();
    });
  });

  describe("getConfigByBoard", () => {
    it("returns config by board name", () => {
      const registry = new BoardRegistry([makeConfig({ board: "linkedin" })]);
      expect(registry.getConfigByBoard("linkedin")?.board).toBe("linkedin");
    });

    it("returns undefined for unknown board", () => {
      const registry = new BoardRegistry([makeConfig()]);
      expect(registry.getConfigByBoard("unknown")).toBeUndefined();
    });
  });

  describe("getAllConfigs", () => {
    it("returns all loaded configs", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "a" }),
        makeConfig({ board: "b" }),
        makeConfig({ board: "c" }),
      ]);
      expect(registry.getAllConfigs()).toHaveLength(3);
    });
  });

  describe("getVersion", () => {
    it("returns max version across all configs", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "a", version: 1 }),
        makeConfig({ board: "b", version: 3 }),
        makeConfig({ board: "c", version: 2 }),
      ]);
      expect(registry.getVersion()).toBe(3);
    });

    it("returns 0 for empty registry", () => {
      const registry = new BoardRegistry([]);
      expect(registry.getVersion()).toBe(0);
    });
  });

  describe("getConfigsSince", () => {
    it("returns configs with version > input", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "a", version: 1 }),
        makeConfig({ board: "b", version: 2 }),
        makeConfig({ board: "c", version: 3 }),
      ]);
      const newer = registry.getConfigsSince(1);
      expect(newer).toHaveLength(2);
      expect(newer.map((c) => c.board).sort()).toEqual(["b", "c"]);
    });

    it("returns empty array when no configs are newer", () => {
      const registry = new BoardRegistry([makeConfig({ version: 1 })]);
      expect(registry.getConfigsSince(1)).toHaveLength(0);
    });

    it("returns all configs for version 0", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "a", version: 1 }),
        makeConfig({ board: "b", version: 2 }),
      ]);
      expect(registry.getConfigsSince(0)).toHaveLength(2);
    });
  });

  describe("getBoardNames", () => {
    it("returns all board names", () => {
      const registry = new BoardRegistry([
        makeConfig({ board: "linkedin" }),
        makeConfig({ board: "indeed" }),
      ]);
      expect(registry.getBoardNames().sort()).toEqual(["indeed", "linkedin"]);
    });
  });

  describe("has", () => {
    it("returns true for existing board", () => {
      const registry = new BoardRegistry([makeConfig({ board: "linkedin" })]);
      expect(registry.has("linkedin")).toBe(true);
    });

    it("returns false for non-existing board", () => {
      const registry = new BoardRegistry([makeConfig()]);
      expect(registry.has("unknown")).toBe(false);
    });
  });

  describe("getHealthForConfig", () => {
    it("returns undefined when no healthStore is provided", () => {
      const registry = new BoardRegistry([makeConfig()]);
      expect(registry.getHealthForConfig(makeConfig())).toBeUndefined();
    });

    it("delegates to healthStore.getHealthSummary when available", () => {
      const healthStore = new InMemorySelectorHealthStore();
      healthStore.record("sel-1", true, "test", "title");
      healthStore.record("sel-2", false, "test", "company");

      const registry = new BoardRegistry([makeConfig()], healthStore);
      const summary = registry.getHealthForConfig(makeConfig());

      expect(summary).toBeDefined();
      expect(summary!.board).toBe("test");
      expect(summary!.totalSelectors).toBe(2);
    });
  });
});
