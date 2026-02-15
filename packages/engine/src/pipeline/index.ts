// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  LayerName,
  FieldExtraction,
  ExtractionSignal,
  SelectorRepairProposal,
  TraceAttempt,
  FieldTrace,
  ExtractionTrace,
  SiteConfig,
  DetectionContext,
  ExtractionMiddleware,
} from "./types";

// ─── Context Helpers ─────────────────────────────────────────────────────────
export {
  createDetectionContext,
  updateCompleteness,
  recordLayerExecution,
  trySetField,
  recordFieldTraces,
  addSignal,
  resolveSignals,
} from "./create-context";
export type { CreateContextOptions } from "./create-context";

// ─── Compose ─────────────────────────────────────────────────────────────────
export { compose } from "./compose";

// ─── Layers ──────────────────────────────────────────────────────────────────
export {
  boardDetector,
  jsonLd,
  cssSelector,
  createConfidenceGate,
  ogMeta,
  heuristic,
  aiFallback,
  postProcess,
} from "./layers/index";

// ─── Default Pipeline ────────────────────────────────────────────────────────
export { createDefaultPipeline, createPipelineForUrl } from "./default-pipeline";
