/**
 * Engine Autofill Adapter — Orchestrates autofill operations via content script.
 *
 * Runs in the side panel context. Delegates DOM operations to content-engine.content.ts
 * via Chrome message passing. Pure functions (mapping, instruction building) run locally.
 *
 * Architecture references:
 * - ADR-REV-D4 (Engine = Pure Functional Core)
 * - PATTERN-SE2 (Dot-Namespaced Messages)
 * - PATTERN-SE10 (Operation ID Addressing)
 * - Story 2-6, Task 4 (autofill adapter)
 */

import {
  mapFieldsToData,
  buildFillInstructions,
  detectATSForm,
} from "@jobswyft/engine";
import type {
  DetectedField,
  MappedField,
  FillInstruction,
  AutofillData,
  FieldFillResult,
  UndoEntry,
} from "@jobswyft/engine";
import type {
  SerializedDetectedField,
  AutofillDetectMessage,
  AutofillDetectResultMessage,
  AutofillFillMessage,
  AutofillFillResultMessage,
  AutofillUndoMessage,
  AutofillUndoResultMessage,
} from "@/lib/message-types";

// ─── Detection ───────────────────────────────────────────────────────────────
// Sends autofill.detect message to each frame's content script.
// Aggregates results across all frames, de-duplicating by stableId.

export async function detectAndClassifyFields(
  tabId: number,
  board: string | null,
): Promise<SerializedDetectedField[]> {
  const frames = await chrome.webNavigation.getAllFrames({ tabId });
  if (!frames?.length) return [];

  const message: AutofillDetectMessage = {
    type: "autofill.detect",
    payload: { board },
  };

  // Send to each frame in parallel; detect board from frame URL if parent didn't match
  const results = await Promise.allSettled(
    frames.map((frame) => {
      // For embedded ATS forms (e.g. Greenhouse iframe on company site),
      // the parent URL won't match ATS patterns but the iframe URL will.
      let frameBoard = board;
      if (!frameBoard && frame.url) {
        const detected = detectATSForm(frame.url);
        if (detected.isATS) frameBoard = detected.board;
      }

      const frameMessage: AutofillDetectMessage = {
        type: "autofill.detect",
        payload: { board: frameBoard },
      };

      return chrome.tabs.sendMessage(tabId, frameMessage, { frameId: frame.frameId })
        .then((response: AutofillDetectResultMessage | undefined) => ({
          response,
          frameId: frame.frameId,
        }));
    }),
  );

  // Aggregate: de-duplicate by stableId, set correct frameId
  const allFields: SerializedDetectedField[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { response, frameId } = result.value;
    if (!response?.payload?.fields) continue;

    for (const field of response.payload.fields) {
      if (!seenIds.has(field.stableId)) {
        seenIds.add(field.stableId);
        allFields.push({ ...field, frameId });
      }
    }
  }

  return allFields;
}

// ─── Mapping & Instruction Building ──────────────────────────────────────────
// Pure functions — run in side panel, no DOM needed.

export function mapAndBuildInstructions(
  fields: SerializedDetectedField[],
  data: AutofillData,
): { mapped: MappedField[]; instructions: FillInstruction[] } {
  // SerializedDetectedField is a subset of DetectedField (no element refs).
  // mapFieldsToData only uses field metadata, so the cast is safe.
  const mapped = mapFieldsToData(fields as unknown as DetectedField[], data);
  const instructions = buildFillInstructions(mapped);
  return { mapped, instructions };
}

// ─── Fill Execution ──────────────────────────────────────────────────────────
// Sends autofill.fill message to each frame's content script.
// Each frame fills the elements it can find, ignoring the rest.

export async function executeFill(
  tabId: number,
  instructions: FillInstruction[],
): Promise<{
  filled: number;
  failed: number;
  results: FieldFillResult[];
  undoEntries: UndoEntry[];
}> {
  if (instructions.length === 0) {
    return { filled: 0, failed: 0, results: [], undoEntries: [] };
  }

  const frames = await chrome.webNavigation.getAllFrames({ tabId });
  if (!frames?.length) {
    return {
      filled: 0,
      failed: instructions.length,
      results: [],
      undoEntries: [],
    };
  }

  const message: AutofillFillMessage = {
    type: "autofill.fill",
    payload: { instructions },
  };

  // Send fill instructions to all frames
  const results = await Promise.allSettled(
    frames.map((frame) =>
      chrome.tabs.sendMessage(tabId, message, { frameId: frame.frameId }),
    ),
  );

  // Aggregate: pick first successful result for each stableId
  const allResults: FieldFillResult[] = [];
  const allUndoEntries: UndoEntry[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const response = result.value as AutofillFillResultMessage | undefined;
    if (!response?.payload) continue;

    if (response.payload.results) {
      for (const fieldResult of response.payload.results) {
        if (!seenIds.has(fieldResult.stableId)) {
          seenIds.add(fieldResult.stableId);
          allResults.push(fieldResult);
        }
      }
    }

    if (response.payload.undoEntries) {
      allUndoEntries.push(...response.payload.undoEntries);
    }
  }

  const filled = allResults.filter((r) => r.success).length;
  const failed = allResults.filter((r) => !r.success).length;

  return { filled, failed, results: allResults, undoEntries: allUndoEntries };
}

// ─── Undo ────────────────────────────────────────────────────────────────────
// Sends autofill.undo message to each frame's content script.

export async function executeUndoFill(
  tabId: number,
  entries: UndoEntry[],
): Promise<{ undone: number; failed: number }> {
  if (entries.length === 0) {
    return { undone: 0, failed: 0 };
  }

  const frames = await chrome.webNavigation.getAllFrames({ tabId });
  if (!frames?.length) {
    return { undone: 0, failed: entries.length };
  }

  const message: AutofillUndoMessage = {
    type: "autofill.undo",
    payload: { entries },
  };

  // Send undo to all frames
  const results = await Promise.allSettled(
    frames.map((frame) =>
      chrome.tabs.sendMessage(tabId, message, { frameId: frame.frameId }),
    ),
  );

  let totalUndone = 0;
  let totalFailed = 0;

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const response = result.value as AutofillUndoResultMessage | undefined;
    if (!response?.payload) continue;

    totalUndone += response.payload.undone;
    totalFailed += response.payload.failed;
  }

  return { undone: totalUndone, failed: totalFailed };
}
