/**
 * Pipeline Types — Koa-style middleware extraction pipeline types.
 *
 * Defines DetectionContext, FieldExtraction, ExtractionMiddleware,
 * ExtractionTrace, and supporting types for the extraction pipeline.
 *
 * Architecture reference: ADR-REV-SE5 (Koa Middleware Pipeline)
 */

import type { ExtractionSource } from "../scoring/extraction-validator";

// ─── Layer Names ─────────────────────────────────────────────────────────────

export type LayerName =
  | "board-detector"
  | "json-ld"
  | "css"
  | "og-meta"
  | "heuristic"
  | "ai-fallback"
  | "post-process";

// ─── Field Extraction ────────────────────────────────────────────────────────

export interface FieldExtraction {
  value: string;
  source: ExtractionSource;
  confidence: number;
}

// ─── Trace Types ─────────────────────────────────────────────────────────────

export interface TraceAttempt {
  layer: LayerName;
  attempted: true;
  matched: boolean;
  field?: string;
  selectorId?: string;
  selector?: string;
  rawValue?: string;
  cleanedValue?: string;
  accepted: boolean;
  rejectionReason?: string;
}

export interface FieldTrace {
  field: string;
  finalValue: string;
  finalSource: string;
  attempts: TraceAttempt[];
}

export interface ExtractionTrace {
  fields: FieldTrace[];
  board: string | null;
  url: string;
  timestamp: number;
  totalTimeMs: number;
  layersExecuted: LayerName[];
  gateDecisions: Array<{
    gate: number;
    completeness: number;
    action: "short-circuit" | "continue";
  }>;
  aiTriggered: boolean;
  completeness: number;
}

// ─── Site Config ─────────────────────────────────────────────────────────────

export interface SiteConfig {
  board: string;
  urlPatterns: string[];
  pipelineHints?: Record<string, unknown>;
}

// ─── Detection Context ───────────────────────────────────────────────────────

export interface DetectionContext {
  url: string;
  dom: Document;
  board: string | null;
  fields: {
    title?: FieldExtraction;
    company?: FieldExtraction;
    description?: FieldExtraction;
    location?: FieldExtraction;
    salary?: FieldExtraction;
    employmentType?: FieldExtraction;
  };
  completeness: number;
  trace: ExtractionTrace;
  siteConfig?: SiteConfig;
  metadata: Record<string, unknown>;
}

// ─── Middleware Signature ─────────────────────────────────────────────────────

export type ExtractionMiddleware = (
  ctx: DetectionContext,
  next: () => Promise<void>
) => Promise<void>;
