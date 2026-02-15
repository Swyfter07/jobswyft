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

export type { SelectorHealthRecord, SelectorHealthStore, HealthSummary } from "./registry/selector-health";
export { InMemorySelectorHealthStore } from "./registry/selector-health";

export { BoardRegistry } from "./registry/board-registry";

export {
  SiteConfigSchema,
  ConfigValidationError,
  validateSiteConfig,
  validateSiteConfigs,
  assertSiteConfig,
} from "./registry/config-schema";

export type { RepairResult } from "./registry/heuristic-repair";
export { attemptHeuristicRepair } from "./registry/heuristic-repair";

// ─── Scoring ─────────────────────────────────────────────────────────────────
export {
  combineSignals,
  computeDiminishingScore,
  computeExtractionFieldConfidence,
  computeCompleteness,
  validateExtraction,
  SIGNAL_WEIGHTS,
  computeSignalFieldConfidence,
  resolveFieldType,
} from "./scoring/index";
export type {
  ExtractionSource,
  ExtractionConfidence,
  ValidationIssue,
  ValidationResult,
} from "./scoring/index";

// ─── Pipeline ───────────────────────────────────────────────────────────────
export {
  createDetectionContext,
  updateCompleteness,
  recordLayerExecution,
  addSignal,
  resolveSignals,
  compose,
  boardDetector,
  jsonLd,
  cssSelector,
  createConfidenceGate,
  ogMeta,
  heuristic,
  aiFallback,
  postProcess,
  createDefaultPipeline,
  createPipelineForUrl,
} from "./pipeline/index";
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
  CreateContextOptions,
} from "./pipeline/index";

// ─── Autofill ───────────────────────────────────────────────────────────────
export {
  detectFormFields,
  findFieldByOpid,
  deepQueryFormFields,
  classifyField,
  classifyFields,
  evaluateAllSignals,
  mapFieldsToData,
  getDataValue,
  buildFillInstructions,
  executeFillInstruction,
  executeFillInstructions,
  setFieldValue,
  setSelectValue,
  setCheckboxValue,
  setRadioValue,
  setContentEditableValue,
  captureUndoSnapshot,
  executeUndo,
} from "./autofill/index";
export type { DeepQueryOptions } from "./autofill/index";

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
