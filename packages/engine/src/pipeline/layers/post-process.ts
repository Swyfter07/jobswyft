/**
 * PostProcess Layer — Normalizes, validates, and finalizes extraction data.
 *
 * Trims whitespace, decodes HTML entities, validates title+company required
 * using existing validateExtraction(), and computes final completeness.
 *
 * Architecture reference: ADR-REV-SE2 (Post-Processing)
 */

import {
  validateExtraction,
} from "../../scoring/extraction-validator";
import type { ExtractionSource } from "../../scoring/extraction-validator";
import { recordLayerExecution, updateCompleteness } from "../create-context";
import type { DetectionContext, ExtractionMiddleware } from "../types";

/**
 * Decode common HTML entities in a string.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

/**
 * Normalize whitespace: collapse multiple spaces/newlines into single space, trim.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export const postProcess: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "post-process");

  // Normalize all field values
  const fieldKeys = Object.keys(ctx.fields) as Array<
    keyof DetectionContext["fields"]
  >;
  for (const field of fieldKeys) {
    const extraction = ctx.fields[field];
    if (extraction) {
      let cleaned = extraction.value;
      cleaned = decodeHtmlEntities(cleaned);
      cleaned = normalizeWhitespace(cleaned);
      extraction.value = cleaned;
    }
  }

  // Build flat maps for validateExtraction()
  const data: Record<string, string | undefined> = {};
  const sources: Record<string, ExtractionSource> = {};
  for (const [field, extraction] of Object.entries(ctx.fields)) {
    if (extraction) {
      data[field] = extraction.value;
      sources[field] = extraction.source;
    }
  }

  const result = validateExtraction(data, sources);

  // Record validation in trace metadata
  ctx.metadata.validation = {
    isValid: result.isValid,
    issues: result.issues,
  };

  // Update final completeness
  updateCompleteness(ctx);
  ctx.trace.completeness = ctx.completeness;

  await next();
};
