/**
 * Engine Scan Adapter — Bridges collectPageData output to engine pipeline.
 *
 * Runs in the side panel context (has full access to engine imports, DOMParser).
 * Accepts raw page data from the thin collector (MAIN world), parses HTML,
 * and delegates extraction to the engine's Koa-style middleware pipeline.
 *
 * Architecture references:
 * - ADR-REV-D4 (Engine = Pure Functional Core)
 * - Story 2-6, Task 3 (scan adapter)
 */

import {
  createDefaultPipeline,
  createDetectionContext,
  validateExtraction,
} from "@jobswyft/engine";
import type {
  ExtractionConfidence,
  ExtractionSource,
  FieldExtraction,
  ExtractionTrace,
} from "@jobswyft/engine";
import type { ScanCollectionResult } from "@/lib/message-types";

// ─── Result Types ────────────────────────────────────────────────────────────

export interface ScanEngineResult {
  /** Extracted job fields (title, company, description, etc.) */
  jobData: Record<string, string>;
  /** Per-field extraction sources (e.g. "json-ld", "css-board") */
  sources: Record<string, string>;
  /** Per-field confidence scores */
  confidence: ExtractionConfidence | null;
  /** Detected job board identifier */
  board: string | null;
  /** Overall extraction completeness (0–1) */
  completeness: number;
  /** Whether any frame has a "show more" button */
  hasShowMore: boolean;
  /** Pipeline execution trace for debugging */
  trace: ExtractionTrace | null;
}

// ─── Injection Result Mapping ─────────────────────────────────────────────────
// Maps Chrome scripting InjectionResult[] to ScanCollectionResult[] by adding
// the frameId from the injection result to the collected data.

export function toScanCollectionResults(
  results: chrome.scripting.InjectionResult[],
): ScanCollectionResult[] {
  return results
    .filter((r) => r.result != null)
    .map((r) => ({
      ...(r.result as Omit<ScanCollectionResult, "frameId">),
      frameId: r.frameId,
    }));
}

// ─── Frame Selection ─────────────────────────────────────────────────────────
// Pick the best frame from multi-frame collection results.
// Prefers main frame (frameId 0); falls back to frame with largest HTML.

function pickBestFrame(frames: ScanCollectionResult[]): ScanCollectionResult {
  if (frames.length === 1) return frames[0];

  // Prefer main frame if it has meaningful content
  const mainFrame = frames.find((f) => f.frameId === 0);
  if (mainFrame && mainFrame.html.length > 500) return mainFrame;

  // Fall back to largest HTML (most content)
  return frames.reduce((best, frame) =>
    frame.html.length > best.html.length ? frame : best,
  );
}

// ─── Pipeline Execution ──────────────────────────────────────────────────────

/**
 * Run the engine extraction pipeline on collected page data.
 *
 * 1. Picks the best frame from multi-frame results
 * 2. Parses HTML via DOMParser
 * 3. Creates a DetectionContext and runs the engine pipeline
 * 4. Extracts job fields from the completed context
 * 5. Validates and returns results compatible with ScanState
 */
export async function runEngineScan(
  collectedData: ScanCollectionResult[],
): Promise<ScanEngineResult> {
  if (!collectedData.length) {
    return emptyResult();
  }

  // 1. Pick best frame; aggregate hasShowMore across all frames
  const best = pickBestFrame(collectedData);
  const hasShowMore = collectedData.some((f) => f.hasShowMore);

  // 2. Parse HTML into a Document for engine consumption
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(best.html, "text/html");

  // 3. Create detection context via engine factory
  const ctx = createDetectionContext(best.url, parsedDoc);

  // 4. Create and execute pipeline (skips AI fallback for IC-0)
  const pipeline = createDefaultPipeline();
  const result = await pipeline(ctx);

  // 5. Extract job fields from completed context
  const jobData: Record<string, string> = {};
  const sources: Record<string, string> = {};
  const fieldKeys = [
    "title",
    "company",
    "description",
    "location",
    "salary",
    "employmentType",
  ] as const;

  for (const key of fieldKeys) {
    const field: FieldExtraction | undefined = result.fields[key];
    if (field?.value) {
      jobData[key] = field.value;
      sources[key] = field.source;
    }
  }

  // Always include sourceUrl from the collected page URL
  jobData.sourceUrl = best.url;

  // 6. Validate extraction and compute confidence
  const validation = validateExtraction(
    jobData,
    sources as Record<string, ExtractionSource>,
  );

  return {
    jobData,
    sources,
    confidence: validation.confidence,
    board: result.board,
    completeness: validation.completeness,
    hasShowMore,
    trace: result.trace,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyResult(): ScanEngineResult {
  return {
    jobData: {},
    sources: {},
    confidence: null,
    board: null,
    completeness: 0,
    hasShowMore: false,
    trace: null,
  };
}
