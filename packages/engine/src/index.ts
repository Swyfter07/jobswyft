// ─── Detection ───────────────────────────────────────────────────────────────
export { detectJobPage, getJobBoard } from "./detection/job-detector";
export { detectATSForm } from "./detection/ats-detector";
export type { ATSFormDetection } from "./detection/ats-detector";

// ─── Extraction ──────────────────────────────────────────────────────────────
export { aggregateFrameResults } from "./extraction/frame-aggregator";
export type { AggregatedResult } from "./extraction/frame-aggregator";

// ─── Registry ────────────────────────────────────────────────────────────────
export { SELECTOR_REGISTRY } from "./registry/selector-registry";
export type { SelectorEntry } from "./registry/selector-registry";

// ─── Scoring ─────────────────────────────────────────────────────────────────
// Note: Both extraction-validator and signal-weights export `computeFieldConfidence`.
// Re-exported with distinct names to avoid collision:
//   computeExtractionFieldConfidence → extraction-validator.ts:computeFieldConfidence (source-based scoring)
//   computeSignalFieldConfidence     → signal-weights.ts:computeFieldConfidence (multi-signal voting)
export {
  computeFieldConfidence as computeExtractionFieldConfidence,
  computeCompleteness,
  validateExtraction,
} from "./scoring/extraction-validator";
export type {
  ExtractionSource,
  ExtractionConfidence,
  ValidationIssue,
  ValidationResult,
} from "./scoring/extraction-validator";

export {
  SIGNAL_WEIGHTS,
  computeFieldConfidence as computeSignalFieldConfidence,
  resolveFieldType,
} from "./scoring/signal-weights";

// ─── Types ───────────────────────────────────────────────────────────────────
export type { FrameResult } from "./types/frame-result";

export {
  getFieldCategory,
} from "./types/field-types";

export type {
  AutofillFieldType,
  SignalType,
  SignalEvaluation,
  FieldCategory,
  DetectedField,
  DetectionResult,
  MappedFieldStatus,
  MappedField,
  AutofillPersonalData,
  AutofillResumeData,
  AutofillData,
  FillInstruction,
  FieldFillResult,
  FillResult,
  UndoEntry,
  UndoState,
} from "./types/field-types";
