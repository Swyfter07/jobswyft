// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  LayerName,
  FieldExtraction,
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
} from "./create-context";

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
export { createDefaultPipeline } from "./default-pipeline";
