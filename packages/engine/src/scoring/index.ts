// ─── Scoring Barrel ──────────────────────────────────────────────────────────

export { combineSignals } from "./confidence-scorer";

export { computeDiminishingScore } from "./signal-weights";

export {
  computeFieldConfidence as computeExtractionFieldConfidence,
  computeCompleteness,
  validateExtraction,
} from "./extraction-validator";
export type {
  ExtractionSource,
  ExtractionConfidence,
  ValidationIssue,
  ValidationResult,
} from "./extraction-validator";

export {
  SIGNAL_WEIGHTS,
  computeFieldConfidence as computeSignalFieldConfidence,
  resolveFieldType,
} from "./signal-weights";
