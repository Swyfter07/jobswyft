/**
 * CSS Selector Layer — Extracts job data using the SELECTOR_REGISTRY.
 *
 * Filters registry by ctx.board (exact match + mode "read"/"both"/undefined),
 * falls back to "generic" board. Queries ctx.dom for each field's selectors
 * in priority order. Board-specific confidence: 0.85, generic: 0.60.
 *
 * Architecture reference: ADR-REV-SE2 (Confidence Scores Per Layer)
 */

import { SELECTOR_REGISTRY } from "../../registry/selector-registry";
import type { SelectorEntry } from "../../registry/selector-registry";
import { recordLayerExecution, updateCompleteness } from "../create-context";
import type {
  DetectionContext,
  ExtractionMiddleware,
  FieldExtraction,
  TraceAttempt,
} from "../types";

const BOARD_CONFIDENCE = 0.85;
const GENERIC_CONFIDENCE = 0.60;

type FieldName = "title" | "company" | "description" | "location" | "salary" | "employmentType";

function getReadableEntries(board: string | null): SelectorEntry[] {
  return SELECTOR_REGISTRY.filter((entry) => {
    // Filter by mode: read, both, or undefined (defaults to read)
    const mode = entry.mode ?? "read";
    if (mode !== "read" && mode !== "both") return false;

    // Filter by status
    if (entry.status === "deprecated") return false;

    // Filter by board: match exact board or use generic
    return entry.board === board || entry.board === "generic";
  });
}

function groupByField(entries: SelectorEntry[]): Map<FieldName, SelectorEntry[]> {
  const groups = new Map<FieldName, SelectorEntry[]>();
  for (const entry of entries) {
    const field = entry.field as FieldName;
    const list = groups.get(field) ?? [];
    list.push(entry);
    groups.set(field, list);
  }
  // Sort each group by priority (lower = first)
  for (const [, list] of groups) {
    list.sort((a, b) => a.priority - b.priority);
  }
  return groups;
}

export const cssSelector: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "css");

  const entries = getReadableEntries(ctx.board);
  const grouped = groupByField(entries);
  const attempts: TraceAttempt[] = [];

  for (const [field, fieldEntries] of grouped) {
    for (const entry of fieldEntries) {
      const isGeneric = entry.board === "generic";
      const confidence = isGeneric ? GENERIC_CONFIDENCE : BOARD_CONFIDENCE;

      for (const selector of entry.selectors) {
        let rawValue: string | undefined;
        try {
          const el = ctx.dom.querySelector(selector);
          rawValue = el?.textContent?.trim() ?? undefined;
        } catch {
          // Invalid selector — skip
          continue;
        }

        if (!rawValue || rawValue.length === 0) {
          attempts.push({
            layer: "css",
            attempted: true,
            matched: false,
            field,
            selectorId: entry.id,
            selector,
            accepted: false,
            rejectionReason: "no-match",
          });
          continue;
        }

        // Check field override rule: only write if not set or higher confidence
        const existing = ctx.fields[field];
        if (existing && existing.confidence >= confidence) {
          attempts.push({
            layer: "css",
            attempted: true,
            matched: true,
            field,
            selectorId: entry.id,
            selector,
            rawValue,
            accepted: false,
            rejectionReason: "higher-confidence-exists",
          });
          // Skip remaining selectors in this entry — field is already filled
          break;
        }

        const extraction: FieldExtraction = {
          value: rawValue,
          source: isGeneric ? "css-generic" : "css-board",
          confidence,
        };

        ctx.fields[field] = extraction;
        attempts.push({
          layer: "css",
          attempted: true,
          matched: true,
          field,
          selectorId: entry.id,
          selector,
          rawValue,
          cleanedValue: rawValue,
          accepted: true,
        });

        // Found a match for this field via this entry — stop trying selectors
        break;
      }

      // If we found a match for this field from this entry, stop trying more entries
      const accepted = attempts.find(
        (a) => a.field === field && a.accepted && a.selectorId === entry.id
      );
      if (accepted) break;
    }
  }

  // Record field traces
  for (const attempt of attempts) {
    if (attempt.accepted && attempt.field) {
      const existing = ctx.trace.fields.find((f) => f.field === attempt.field);
      if (existing) {
        existing.attempts.push(attempt);
        existing.finalValue = attempt.cleanedValue ?? "";
        existing.finalSource = attempt.selectorId ? `css:${attempt.selectorId}` : "css";
      } else {
        ctx.trace.fields.push({
          field: attempt.field,
          finalValue: attempt.cleanedValue ?? "",
          finalSource: attempt.selectorId ? `css:${attempt.selectorId}` : "css",
          attempts: [attempt],
        });
      }
    }
  }

  updateCompleteness(ctx);
  await next();
};
