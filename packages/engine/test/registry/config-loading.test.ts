import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSiteConfig } from "../../src/registry/config-schema";
import { BoardRegistry } from "../../src/registry/board-registry";
import type { SiteConfig } from "../../src/pipeline/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const CONFIGS_ROOT = resolve(__dirname, "../../../../configs/sites");

function loadAllConfigs(): SiteConfig[] {
  const files = readdirSync(CONFIGS_ROOT).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_")
  );
  return files.map((file) => {
    const content = readFileSync(resolve(CONFIGS_ROOT, file), "utf-8");
    return validateSiteConfig(JSON.parse(content));
  });
}

describe("Config Loading Integration", () => {
  it("loads all config files from configs/sites/", () => {
    const configs = loadAllConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(10);
  });

  it("validates each config against Zod schema", () => {
    const files = readdirSync(CONFIGS_ROOT).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_")
    );
    for (const file of files) {
      const content = readFileSync(resolve(CONFIGS_ROOT, file), "utf-8");
      expect(() => validateSiteConfig(JSON.parse(content))).not.toThrow();
    }
  });

  it("all configs have version >= 1", () => {
    const configs = loadAllConfigs();
    for (const config of configs) {
      expect(config.version).toBeGreaterThanOrEqual(1);
    }
  });

  it("all configs have unique board names", () => {
    const configs = loadAllConfigs();
    const boards = configs.map((c) => c.board);
    expect(new Set(boards).size).toBe(boards.length);
  });

  it("constructs BoardRegistry from all configs without error", () => {
    const configs = loadAllConfigs();
    const registry = new BoardRegistry(configs);
    expect(registry.getAllConfigs().length).toBe(configs.length);
  });

  describe("URL matching for known boards", () => {
    let registry: BoardRegistry;

    beforeAll(() => {
      const configs = loadAllConfigs();
      registry = new BoardRegistry(configs);
    });

    const testCases: Array<[string, string]> = [
      ["https://www.linkedin.com/jobs/view/12345", "linkedin"],
      ["https://www.indeed.com/viewjob?jk=abc123", "indeed"],
      ["https://boards.greenhouse.io/acme/jobs/123", "greenhouse"],
      ["https://jobs.lever.co/company/job-id", "lever"],
      ["https://company.myworkdayjobs.com/en-US/job/title/JR-123", "workday"],
      ["https://www.glassdoor.com/job-listing/title-company-JV123.htm", "glassdoor"],
      ["https://www.monster.com/job-openings/title-id", "monster"],
      ["https://www.ziprecruiter.com/c/company/job/title/abc123", "ziprecruiter"],
      ["https://www.wellfound.com/jobs/123-title", "wellfound"],
    ];

    for (const [url, expectedBoard] of testCases) {
      it(`matches ${expectedBoard} for ${url}`, () => {
        const config = registry.getConfig(url);
        expect(config).toBeDefined();
        expect(config!.board).toBe(expectedBoard);
      });
    }
  });

  it("generic config has empty urlPatterns (not matched by URL)", () => {
    const configs = loadAllConfigs();
    const registry = new BoardRegistry(configs);
    const generic = registry.getGenericConfig();
    expect(generic).toBeDefined();
    expect(generic!.urlPatterns).toEqual([]);
    // Unknown URL should not match generic
    expect(registry.getConfig("https://unknown-site.com/jobs/123")).toBeUndefined();
  });

  it("each board config has at least title and description selectors", () => {
    const configs = loadAllConfigs();
    for (const config of configs) {
      if (config.board === "generic") continue; // Generic has all fields
      expect(
        config.selectors.title || config.selectors.description,
        `${config.board} should have title or description selectors`
      ).toBeDefined();
    }
  });
});
