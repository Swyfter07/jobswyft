/**
 * Pipeline Types — Koa-style middleware extraction pipeline types.
 *
 * Defines DetectionContext, FieldExtraction, ExtractionMiddleware,
 * ExtractionTrace, and supporting types for the extraction pipeline.
 *
 * Architecture reference: ADR-REV-SE5 (Koa Middleware Pipeline)
 */

import type { ExtractionSource } from "../scoring/extraction-validator";
import type { SelectorHealthStore } from "../registry/selector-health";
import type { BoardRegistry } from "../registry/board-registry";

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

// ─── Extraction Signal (Story 2.3 — Multi-Signal Combination) ───────────────

export interface ExtractionSignal {
  value: string;
  source: ExtractionSource;
  confidence: number;
  layer: LayerName;
}

// ─── Selector Repair Proposal (Story 2.3 — Self-Healing) ────────────────────

export interface SelectorRepairProposal {
  board: string;
  field: string;
  failedSelectors: string[];
  repairedSelector: string;
  strategy: string;
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

// ─── Site Config (Story 2.3 — Enhanced for Config-Driven Extraction) ────────

export interface SiteConfig {
  board: string;
  name: string;
  urlPatterns: string[];
  selectors: {
    [field: string]: {
      primary: string[];
      secondary?: string[];
      tertiary?: string[];
    };
  };
  pipelineHints?: {
    skipLayers?: LayerName[];
    layerOrder?: LayerName[];
    gateOverrides?: Record<string, number>;
  };
  customExtractor?: string;
  version: number;
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
  boardRegistry?: BoardRegistry;
  signals: Record<string, ExtractionSignal[]>;
  selectorRepairs?: SelectorRepairProposal[];
  healthStore?: SelectorHealthStore;
  metadata: Record<string, unknown>;
}

// ─── Middleware Signature ─────────────────────────────────────────────────────

export type ExtractionMiddleware = (
  ctx: DetectionContext,
  next: () => Promise<void>
) => Promise<void>;
