/**
 * Extension Message Types — PATTERN-SE2 dot-namespaced discriminated unions.
 *
 * All cross-context messages (content script ↔ background ↔ side panel)
 * use these typed message definitions for type-safe Chrome message passing.
 *
 * Architecture reference: PATTERN-SE2 (Dot-Namespaced Messages)
 */

import type {
  FillInstruction,
  FieldFillResult,
  UndoEntry,
  AutofillFieldType,
  FieldCategory,
  SignalEvaluation,
} from "@jobswyft/engine";

// ─── Serializable Field Type ──────────────────────────────────────────────────
// Serializable subset of DetectedField — no Element refs, no WeakRef.
// Used for cross-context message passing (content script → side panel).

export interface SerializedDetectedField {
  stableId: string;
  opid: string;
  inputType: string;
  label: string;
  fieldType: AutofillFieldType;
  confidence: number;
  category: FieldCategory;
  signals: SignalEvaluation[];
  selector: string;
  currentValue: string;
  isVisible: boolean;
  isDisabled: boolean;
  isRequired: boolean;
  registryEntryId: string | null;
  board: string | null;
  frameId: number;
}

// ─── Scan Collection Result ───────────────────────────────────────────────────
// Raw page data collected by the thin scan-collector.ts (runs in MAIN world).

export interface ScanCollectionResult {
  html: string;
  url: string;
  jsonLd: string[];
  ogMeta: Record<string, string>;
  hasShowMore: boolean;
  frameId: number;
}

// ─── Scan Messages ────────────────────────────────────────────────────────────

export type ScanTriggerMessage = {
  type: "scan.trigger";
  payload: { tabId: number };
};

export type ScanCollectMessage = {
  type: "scan.collect";
  payload: { board: string | null };
};

export type ScanCollectResultMessage = {
  type: "scan.collect.result";
  payload: ScanCollectionResult;
};

export type ScanResultMessage = {
  type: "scan.result";
  payload: {
    jobData: Record<string, unknown> | null;
    confidence: Record<string, number> | null;
    board: string | null;
    completeness: number;
    trace: Record<string, unknown> | null;
  };
};

// ─── Autofill Messages ────────────────────────────────────────────────────────

export type AutofillDetectMessage = {
  type: "autofill.detect";
  payload: { board: string | null };
};

export type AutofillDetectResultMessage = {
  type: "autofill.detect.result";
  payload: {
    fields: SerializedDetectedField[];
    board: string | null;
    url: string;
    frameId: number;
  };
};

export type AutofillFillMessage = {
  type: "autofill.fill";
  payload: { instructions: FillInstruction[] };
};

export type AutofillFillResultMessage = {
  type: "autofill.fill.result";
  payload: {
    filled: number;
    failed: number;
    results: FieldFillResult[];
    undoEntries: UndoEntry[];
  };
};

export type AutofillUndoMessage = {
  type: "autofill.undo";
  payload: { entries: UndoEntry[] };
};

export type AutofillUndoResultMessage = {
  type: "autofill.undo.result";
  payload: { undone: number; failed: number };
};

// ─── Union Type ───────────────────────────────────────────────────────────────

export type ExtensionMessage =
  | ScanTriggerMessage
  | ScanCollectMessage
  | ScanCollectResultMessage
  | ScanResultMessage
  | AutofillDetectMessage
  | AutofillDetectResultMessage
  | AutofillFillMessage
  | AutofillFillResultMessage
  | AutofillUndoMessage
  | AutofillUndoResultMessage;

// ─── Type Guard ───────────────────────────────────────────────────────────────

const VALID_MESSAGE_TYPES = new Set<ExtensionMessage["type"]>([
  "scan.trigger",
  "scan.collect",
  "scan.collect.result",
  "scan.result",
  "autofill.detect",
  "autofill.detect.result",
  "autofill.fill",
  "autofill.fill.result",
  "autofill.undo",
  "autofill.undo.result",
]);

export function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
  if (msg == null || typeof msg !== "object") return false;
  const candidate = msg as Record<string, unknown>;
  if (typeof candidate.type !== "string") return false;
  if (!VALID_MESSAGE_TYPES.has(candidate.type as ExtensionMessage["type"])) return false;
  if (!("payload" in candidate) || candidate.payload == null || typeof candidate.payload !== "object") return false;
  return true;
}
