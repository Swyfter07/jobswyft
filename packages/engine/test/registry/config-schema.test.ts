import { describe, it, expect } from "vitest";
import {
  SiteConfigSchema,
  validateSiteConfig,
  validateSiteConfigs,
  assertSiteConfig,
  ConfigValidationError,
} from "../../src/registry/config-schema";

function makeValidConfig(overrides: Record<string, unknown> = {}) {
  return {
    board: "test-board",
    name: "Test Board",
    urlPatterns: ["test\\.com/jobs"],
    selectors: {
      title: { primary: ["h1"] },
      company: { primary: [".company"], secondary: [".org"] },
    },
    version: 1,
    ...overrides,
  };
}

describe("SiteConfigSchema (Zod)", () => {
  it("accepts a valid config with required fields only", () => {
    const result = SiteConfigSchema.safeParse(makeValidConfig());
    expect(result.success).toBe(true);
  });

  it("accepts a config with all optional fields", () => {
    const result = SiteConfigSchema.safeParse(
      makeValidConfig({
        pipelineHints: {
          skipLayers: ["json-ld"],
          layerOrder: ["css", "heuristic"],
          gateOverrides: { "gate-0.85": 0.9 },
        },
        customExtractor: "custom-handler",
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts selectors with tertiary array", () => {
    const result = SiteConfigSchema.safeParse(
      makeValidConfig({
        selectors: {
          title: { primary: ["h1"], secondary: [".title"], tertiary: [".heading"] },
        },
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejects missing board", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).board;
    const result = SiteConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).name;
    const result = SiteConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects missing urlPatterns", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).urlPatterns;
    const result = SiteConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects missing selectors", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).selectors;
    const result = SiteConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects missing version", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).version;
    const result = SiteConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects version = 0", () => {
    const result = SiteConfigSchema.safeParse(makeValidConfig({ version: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects negative version", () => {
    const result = SiteConfigSchema.safeParse(makeValidConfig({ version: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects non-integer version", () => {
    const result = SiteConfigSchema.safeParse(makeValidConfig({ version: 1.5 }));
    expect(result.success).toBe(false);
  });

  it("rejects selectors without primary array", () => {
    const result = SiteConfigSchema.safeParse(
      makeValidConfig({ selectors: { title: { secondary: [".title"] } } })
    );
    expect(result.success).toBe(false);
  });

  it("accepts empty urlPatterns array", () => {
    const result = SiteConfigSchema.safeParse(makeValidConfig({ urlPatterns: [] }));
    expect(result.success).toBe(true);
  });

  it("accepts empty selectors object", () => {
    const result = SiteConfigSchema.safeParse(makeValidConfig({ selectors: {} }));
    expect(result.success).toBe(true);
  });
});

describe("validateSiteConfig", () => {
  it("returns validated config on valid input", () => {
    const config = validateSiteConfig(makeValidConfig());
    expect(config.board).toBe("test-board");
    expect(config.version).toBe(1);
  });

  it("throws ConfigValidationError on invalid input", () => {
    expect(() => validateSiteConfig({})).toThrow(ConfigValidationError);
  });

  it("includes field-level errors in ConfigValidationError", () => {
    try {
      validateSiteConfig({ board: 123, name: null });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      const err = error as ConfigValidationError;
      expect(Object.keys(err.fieldErrors).length).toBeGreaterThan(0);
    }
  });
});

describe("validateSiteConfigs", () => {
  it("validates an array of configs", () => {
    const configs = validateSiteConfigs([makeValidConfig(), makeValidConfig({ board: "other", name: "Other" })]);
    expect(configs).toHaveLength(2);
  });

  it("throws with index info on invalid config in array", () => {
    expect(() => validateSiteConfigs([makeValidConfig(), {}])).toThrow(/index 1/);
  });
});

describe("assertSiteConfig (runtime type guard)", () => {
  it("passes for valid config", () => {
    expect(() => assertSiteConfig(makeValidConfig())).not.toThrow();
  });

  it("throws for null", () => {
    expect(() => assertSiteConfig(null)).toThrow(TypeError);
  });

  it("throws for non-object", () => {
    expect(() => assertSiteConfig("string")).toThrow(TypeError);
  });

  it("throws for missing board", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).board;
    expect(() => assertSiteConfig(config)).toThrow(/board/);
  });

  it("throws for empty board", () => {
    expect(() => assertSiteConfig(makeValidConfig({ board: "" }))).toThrow(/board/);
  });

  it("throws for missing name", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).name;
    expect(() => assertSiteConfig(config)).toThrow(/name/);
  });

  it("throws for missing urlPatterns", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).urlPatterns;
    expect(() => assertSiteConfig(config)).toThrow(/urlPatterns/);
  });

  it("throws for missing selectors", () => {
    const config = makeValidConfig();
    delete (config as Record<string, unknown>).selectors;
    expect(() => assertSiteConfig(config)).toThrow(/selectors/);
  });

  it("throws for invalid selector (missing primary)", () => {
    expect(() =>
      assertSiteConfig(
        makeValidConfig({ selectors: { title: { secondary: [".title"] } } })
      )
    ).toThrow(/primary/);
  });

  it("throws for non-integer version", () => {
    expect(() => assertSiteConfig(makeValidConfig({ version: 1.5 }))).toThrow(/version/);
  });

  it("throws for version = 0", () => {
    expect(() => assertSiteConfig(makeValidConfig({ version: 0 }))).toThrow(/version/);
  });
});
