/**
 * JSON-LD Layer — Extracts job data from structured data (schema.org/JobPosting).
 *
 * Parses all <script type="application/ld+json"> blocks, searches for
 * JobPosting @type (including @graph arrays), and extracts fields at 0.95 confidence.
 *
 * Architecture reference: ADR-REV-SE2 (Confidence Scores Per Layer)
 */

import { recordLayerExecution, updateCompleteness } from "../create-context";
import type {
  DetectionContext,
  ExtractionMiddleware,
  FieldExtraction,
  TraceAttempt,
} from "../types";

const JSON_LD_CONFIDENCE = 0.95;

interface JsonLdObject {
  "@type"?: string | string[];
  "@graph"?: JsonLdObject[];
  title?: string;
  name?: string;
  hiringOrganization?: { name?: string; "@type"?: string } | string;
  description?: string;
  jobLocation?:
    | { address?: { addressLocality?: string; addressRegion?: string } | string }
    | { address?: { addressLocality?: string; addressRegion?: string } | string }[];
  baseSalary?: { value?: unknown; minValue?: unknown; maxValue?: unknown; currency?: string } | unknown;
  estimatedSalary?: { value?: unknown; minValue?: unknown; maxValue?: unknown; currency?: string } | unknown;
  employmentType?: string | string[];
  [key: string]: unknown;
}

function findJobPostings(data: unknown): JsonLdObject[] {
  const results: JsonLdObject[] = [];

  if (!data || typeof data !== "object") return results;

  if (Array.isArray(data)) {
    for (const item of data) {
      results.push(...findJobPostings(item));
    }
    return results;
  }

  const obj = data as JsonLdObject;

  // Check @type
  const type = obj["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
    results.push(obj);
  }

  // Search @graph arrays
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      results.push(...findJobPostings(item));
    }
  }

  return results;
}

function extractSalary(posting: JsonLdObject): string | undefined {
  const salary = posting.baseSalary ?? posting.estimatedSalary;
  if (!salary || typeof salary !== "object") return undefined;

  const s = salary as Record<string, unknown>;
  const value = s.value ?? s.minValue;
  const maxValue = s.maxValue;
  const currency = (s.currency as string) ?? "";

  if (value && maxValue && value !== maxValue) {
    return `${currency} ${value} - ${maxValue}`.trim();
  }
  if (value) {
    return `${currency} ${value}`.trim();
  }
  return undefined;
}

function extractLocation(posting: JsonLdObject): string | undefined {
  const loc = posting.jobLocation;
  if (!loc) return undefined;

  const locations = Array.isArray(loc) ? loc : [loc];
  const parts: string[] = [];

  for (const l of locations) {
    if (typeof l === "string") {
      parts.push(l);
      continue;
    }
    const addr = l.address;
    if (typeof addr === "string") {
      parts.push(addr);
    } else if (addr && typeof addr === "object") {
      const locality = addr.addressLocality;
      const region = addr.addressRegion;
      if (locality && region) {
        parts.push(`${locality}, ${region}`);
      } else if (locality) {
        parts.push(locality);
      } else if (region) {
        parts.push(region);
      }
    }
  }

  return parts.length > 0 ? parts.join("; ") : undefined;
}

function trySetField(
  ctx: DetectionContext,
  field: keyof DetectionContext["fields"],
  value: string | undefined,
  attempts: TraceAttempt[]
): void {
  if (!value || value.trim().length === 0) {
    attempts.push({
      layer: "json-ld",
      attempted: true,
      matched: false,
      field,
      accepted: false,
      rejectionReason: "empty-value",
    });
    return;
  }

  const trimmed = value.trim();
  const existing = ctx.fields[field];

  // Only write if not already set or new confidence is higher
  if (existing && existing.confidence >= JSON_LD_CONFIDENCE) {
    attempts.push({
      layer: "json-ld",
      attempted: true,
      matched: true,
      field,
      rawValue: trimmed,
      accepted: false,
      rejectionReason: "higher-confidence-exists",
    });
    return;
  }

  const extraction: FieldExtraction = {
    value: trimmed,
    source: "json-ld",
    confidence: JSON_LD_CONFIDENCE,
  };

  ctx.fields[field] = extraction;
  attempts.push({
    layer: "json-ld",
    attempted: true,
    matched: true,
    field,
    rawValue: trimmed,
    cleanedValue: trimmed,
    accepted: true,
  });
}

export const jsonLd: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "json-ld");

  const attempts: TraceAttempt[] = [];
  const scripts = ctx.dom.querySelectorAll('script[type="application/ld+json"]');

  for (const script of Array.from(scripts)) {
    const text = script.textContent;
    if (!text) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      attempts.push({
        layer: "json-ld",
        attempted: true,
        matched: false,
        accepted: false,
        rejectionReason: "malformed-json",
        rawValue: text.slice(0, 100),
      });
      continue;
    }

    const postings = findJobPostings(parsed);
    for (const posting of postings) {
      // Title
      trySetField(ctx, "title", posting.title ?? posting.name, attempts);

      // Company
      const org = posting.hiringOrganization;
      const companyName =
        typeof org === "string" ? org : org?.name;
      trySetField(ctx, "company", companyName, attempts);

      // Description
      trySetField(ctx, "description", posting.description, attempts);

      // Location
      trySetField(ctx, "location", extractLocation(posting), attempts);

      // Salary
      trySetField(ctx, "salary", extractSalary(posting), attempts);

      // Employment Type
      const empType = posting.employmentType;
      const empStr = Array.isArray(empType) ? empType.join(", ") : empType;
      trySetField(ctx, "employmentType", empStr, attempts);
    }
  }

  // Record field traces for accepted extractions
  for (const attempt of attempts) {
    if (attempt.accepted && attempt.field) {
      const existing = ctx.trace.fields.find((f) => f.field === attempt.field);
      if (existing) {
        existing.attempts.push(attempt);
        existing.finalValue = attempt.cleanedValue ?? "";
        existing.finalSource = "json-ld";
      } else {
        ctx.trace.fields.push({
          field: attempt.field,
          finalValue: attempt.cleanedValue ?? "",
          finalSource: "json-ld",
          attempts: [attempt],
        });
      }
    }
  }

  updateCompleteness(ctx);
  await next();
};
