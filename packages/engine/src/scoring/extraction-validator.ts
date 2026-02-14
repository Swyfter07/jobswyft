/**
 * Extraction Validator — Confidence scoring and field validation for scan results.
 *
 * Per-field confidence based on extraction source, weighted completeness calculation,
 * and cross-field validation (placeholder detection, suspicious patterns).
 *
 * Architecture reference: ADR-SCAN-3 (Confidence-Based Merging)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExtractionSource =
  | "json-ld"
  | "css-board"
  | "css-generic"
  | "og-meta"
  | "heuristic"
  | "heuristic-repair"
  | "ai-llm"
  | "user-edit";

export interface ExtractionConfidence {
  title: number;
  company: number;
  description: number;
  location: number;
  salary: number;
  [key: string]: number;
}

export type ValidationIssue =
  | "missing_title"
  | "missing_company"
  | "missing_description"
  | "title_matches_company"
  | "placeholder_title"
  | "placeholder_company"
  | "short_description"
  | "suspicious_length";

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  completeness: number;
  confidence: ExtractionConfidence;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Base confidence by extraction source (ADR-SCAN-3) */
const SOURCE_CONFIDENCE: Record<ExtractionSource, number> = {
  "json-ld": 0.95,
  "css-board": 0.85,
  "css-generic": 0.60,
  "og-meta": 0.40,
  "heuristic": 0.30,
  "heuristic-repair": 0.40,
  "ai-llm": 0.90,
  "user-edit": 1.0,
};

/** Completeness weights per field */
const FIELD_WEIGHTS: Record<string, number> = {
  title: 0.25,
  company: 0.25,
  description: 0.35,
  location: 0.10,
  salary: 0.05,
};

/** Values that indicate placeholders rather than real data */
const PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "unavailable",
  "tbd",
  "unknown",
  "not available",
  "not specified",
  "none",
  "-",
  "...",
]);

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Compute confidence for a single field based on its extraction source
 * and value quality heuristics.
 */
export function computeFieldConfidence(
  field: string,
  value: string | null | undefined,
  source: ExtractionSource
): number {
  if (!value || value.trim().length === 0) return 0;

  let confidence = SOURCE_CONFIDENCE[source] ?? 0;

  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  // Placeholder detection — reduces confidence significantly
  if (PLACEHOLDER_VALUES.has(lower)) {
    confidence *= 0.1;
  }

  // Length-based penalties for title/company
  if (field === "title" || field === "company") {
    if (trimmed.length < 3) {
      confidence *= 0.5;
    } else if (trimmed.length > 200) {
      confidence *= 0.7;
    }
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Compute overall extraction completeness as a weighted average.
 *
 * Each field's contribution = weight × (confidence for that field).
 * Sum of all weights = 1.0, so result is in [0, 1].
 */
export function computeCompleteness(
  data: Record<string, string | undefined>,
  confidenceMap: Record<string, number>
): number {
  let score = 0;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const value = data[field];
    const fieldConfidence = confidenceMap[field] ?? 0;
    if (value && value.trim().length > 0 && fieldConfidence > 0) {
      score += weight * fieldConfidence;
    }
  }

  return Math.round(score * 100) / 100;
}

/**
 * Validate extraction results: check required fields, detect suspicious patterns,
 * compute confidence and completeness.
 *
 * @param data - Extracted job fields
 * @param sources - Optional map of field → extraction source (defaults to css-generic)
 */
export function validateExtraction(
  data: Record<string, string | undefined>,
  sources?: Record<string, ExtractionSource>
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const defaultSource: ExtractionSource = "css-generic";

  // Compute per-field confidence
  const confidence: ExtractionConfidence = {
    title: 0,
    company: 0,
    description: 0,
    location: 0,
    salary: 0,
  };

  for (const field of Object.keys(confidence)) {
    const value = data[field];
    const source = sources?.[field] ?? defaultSource;
    confidence[field] = computeFieldConfidence(field, value, source);
  }

  // Required field checks (AC4: title AND company required)
  const title = data.title?.trim() ?? "";
  const company = data.company?.trim() ?? "";
  const description = data.description?.trim() ?? "";

  // Placeholder detection for required fields
  if (title && PLACEHOLDER_VALUES.has(title.toLowerCase())) {
    issues.push("placeholder_title");
  }
  if (company && PLACEHOLDER_VALUES.has(company.toLowerCase())) {
    issues.push("placeholder_company");
  }

  // Missing required fields
  if (!title || confidence.title === 0) {
    issues.push("missing_title");
  }
  if (!company || confidence.company === 0) {
    issues.push("missing_company");
  }

  // Missing description (warning, not blocking)
  if (!description) {
    issues.push("missing_description");
  } else if (description.length < 20) {
    issues.push("short_description");
  }

  // Cross-field: title matches company exactly
  if (
    title &&
    company &&
    title.toLowerCase() === company.toLowerCase()
  ) {
    issues.push("title_matches_company");
  }

  // Determine validity: title AND company required (AC4)
  const hasPlaceholderTitle = issues.includes("placeholder_title");
  const hasPlaceholderCompany = issues.includes("placeholder_company");
  const isValid =
    !issues.includes("missing_title") &&
    !issues.includes("missing_company") &&
    !hasPlaceholderTitle &&
    !hasPlaceholderCompany;

  // Compute overall completeness
  const completeness = computeCompleteness(data, confidence);

  return { isValid, issues, completeness, confidence };
}
