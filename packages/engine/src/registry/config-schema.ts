/**
 * Config Schema — Zod-based validation for site configuration files.
 *
 * Zod is a devDependency only (not bundled at runtime). For runtime safety,
 * use assertSiteConfig() which is a lightweight TypeScript type guard.
 *
 * Architecture reference: ADR-REV-D3 (Config Validation), PATTERN-SE1 (Site Config)
 */

import { z } from "zod";
import type { SiteConfig } from "../pipeline/types";

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const SelectorFieldSchema = z.object({
  primary: z.array(z.string()),
  secondary: z.array(z.string()).optional(),
  tertiary: z.array(z.string()).optional(),
});

const LayerNameSchema = z.enum([
  "board-detector",
  "json-ld",
  "css",
  "og-meta",
  "heuristic",
  "ai-fallback",
  "post-process",
]);

const PipelineHintsSchema = z.object({
  skipLayers: z.array(LayerNameSchema).optional(),
  layerOrder: z.array(LayerNameSchema).optional(),
  gateOverrides: z.record(z.number()).optional(),
});

export const SiteConfigSchema = z.object({
  board: z.string(),
  name: z.string(),
  urlPatterns: z.array(z.string()),
  selectors: z.record(SelectorFieldSchema),
  pipelineHints: PipelineHintsSchema.optional(),
  customExtractor: z.string().optional(),
  version: z.number().int().min(1),
});

// ─── Validation Error ────────────────────────────────────────────────────────

export class ConfigValidationError extends Error {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message);
    this.name = "ConfigValidationError";
    this.fieldErrors = fieldErrors;
  }
}

// ─── Zod-Based Validators (devDependency — build-time / test use) ────────────

export function validateSiteConfig(json: unknown): SiteConfig {
  const result = SiteConfigSchema.safeParse(json);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }
    throw new ConfigValidationError(
      `Invalid site config: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      fieldErrors
    );
  }
  return result.data as SiteConfig;
}

export function validateSiteConfigs(jsonArray: unknown[]): SiteConfig[] {
  return jsonArray.map((json, index) => {
    try {
      return validateSiteConfig(json);
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw new ConfigValidationError(
          `Config at index ${index}: ${error.message}`,
          error.fieldErrors
        );
      }
      throw error;
    }
  });
}

// ─── Lightweight Runtime Type Guard (no Zod dependency) ──────────────────────

export function assertSiteConfig(
  config: unknown
): asserts config is SiteConfig {
  if (typeof config !== "object" || config === null) {
    throw new TypeError("SiteConfig must be a non-null object");
  }

  const c = config as Record<string, unknown>;

  if (typeof c.board !== "string" || c.board.length === 0) {
    throw new TypeError("SiteConfig.board must be a non-empty string");
  }
  if (typeof c.name !== "string" || c.name.length === 0) {
    throw new TypeError("SiteConfig.name must be a non-empty string");
  }
  if (!Array.isArray(c.urlPatterns)) {
    throw new TypeError("SiteConfig.urlPatterns must be an array");
  }
  for (let i = 0; i < c.urlPatterns.length; i++) {
    if (typeof (c.urlPatterns as unknown[])[i] !== "string") {
      throw new TypeError(`SiteConfig.urlPatterns[${i}] must be a string`);
    }
  }
  if (typeof c.selectors !== "object" || c.selectors === null) {
    throw new TypeError("SiteConfig.selectors must be a non-null object");
  }

  // Validate selector structure
  const selectors = c.selectors as Record<string, unknown>;
  for (const [field, value] of Object.entries(selectors)) {
    if (typeof value !== "object" || value === null) {
      throw new TypeError(
        `SiteConfig.selectors.${field} must be a non-null object`
      );
    }
    const sel = value as Record<string, unknown>;
    if (!Array.isArray(sel.primary)) {
      throw new TypeError(
        `SiteConfig.selectors.${field}.primary must be an array`
      );
    }
  }

  if (typeof c.version !== "number" || !Number.isInteger(c.version) || c.version < 1) {
    throw new TypeError("SiteConfig.version must be a positive integer");
  }

  // Validate pipelineHints structure if present
  if (c.pipelineHints !== undefined) {
    if (typeof c.pipelineHints !== "object" || c.pipelineHints === null) {
      throw new TypeError("SiteConfig.pipelineHints must be an object");
    }
    const hints = c.pipelineHints as Record<string, unknown>;
    if (hints.skipLayers !== undefined && !Array.isArray(hints.skipLayers)) {
      throw new TypeError("SiteConfig.pipelineHints.skipLayers must be an array");
    }
    if (hints.layerOrder !== undefined && !Array.isArray(hints.layerOrder)) {
      throw new TypeError("SiteConfig.pipelineHints.layerOrder must be an array");
    }
    if (hints.gateOverrides !== undefined && (typeof hints.gateOverrides !== "object" || hints.gateOverrides === null)) {
      throw new TypeError("SiteConfig.pipelineHints.gateOverrides must be an object");
    }
  }

  // Validate customExtractor if present
  if (c.customExtractor !== undefined && typeof c.customExtractor !== "string") {
    throw new TypeError("SiteConfig.customExtractor must be a string");
  }
}
