/**
 * CSS Selector Layer — Extracts job data using the SELECTOR_REGISTRY.
 *
 * Filters registry by ctx.board (exact match + mode "read"/"both"/undefined),
 * falls back to "generic" board. Queries ctx.dom for each field's selectors
 * in priority order. Board-specific confidence: 0.85, generic: 0.60.
 *
 * Story 2.3 additions:
 * - Signal accumulation via addSignal() for multi-signal combination
 * - Self-healing selector fallback via attemptHeuristicRepair()
 * - Site config selector support (ctx.siteConfig?.selectors override)
 * - Selector health recording
 *
 * Architecture reference: ADR-REV-SE2 (Confidence Scores Per Layer)
 */

import { SELECTOR_REGISTRY } from "../../registry/selector-registry";
import type { SelectorEntry } from "../../registry/selector-registry";
import { attemptHeuristicRepair } from "../../registry/heuristic-repair";
import { InMemorySelectorHealthStore } from "../../registry/selector-health";
import { addSignal, recordLayerExecution, updateCompleteness } from "../create-context";
import type {
  DetectionContext,
  ExtractionMiddleware,
  ExtractionSignal,
  FieldExtraction,
  TraceAttempt,
} from "../types";

const BOARD_CONFIDENCE = 0.85;
const GENERIC_CONFIDENCE = 0.60;
const HEURISTIC_REPAIR_CONFIDENCE = 0.40;

type FieldName = "title" | "company" | "description" | "location" | "salary" | "employmentType";

// Default in-memory health store (used when ctx.healthStore is not provided)
const defaultHealthStore = new InMemorySelectorHealthStore();

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

/**
 * Try site config selectors for a field (primary -> secondary -> tertiary fallback chain).
 * Returns the extracted value and confidence, or null if none matched.
 */
function trySiteConfigSelectors(
  ctx: DetectionContext,
  field: FieldName,
  attempts: TraceAttempt[]
): { value: string; confidence: number } | null {
  const siteSelectors = ctx.siteConfig?.selectors?.[field];
  if (!siteSelectors) return null;

  const tiers: Array<{ selectors: string[]; label: string }> = [
    { selectors: siteSelectors.primary, label: "primary" },
  ];
  if (siteSelectors.secondary) {
    tiers.push({ selectors: siteSelectors.secondary, label: "secondary" });
  }
  if (siteSelectors.tertiary) {
    tiers.push({ selectors: siteSelectors.tertiary, label: "tertiary" });
  }

  for (const tier of tiers) {
    for (const selector of tier.selectors) {
      let rawValue: string | undefined;
      try {
        const el = ctx.dom.querySelector(selector);
        rawValue = el?.textContent?.trim() ?? undefined;
      } catch {
        continue;
      }

      if (!rawValue || rawValue.length === 0) {
        attempts.push({
          layer: "css",
          attempted: true,
          matched: false,
          field,
          selector,
          accepted: false,
          rejectionReason: `site-config-${tier.label}-no-match`,
        });
        continue;
      }

      attempts.push({
        layer: "css",
        attempted: true,
        matched: true,
        field,
        selector,
        rawValue,
        cleanedValue: rawValue,
        accepted: true,
      });

      return { value: rawValue, confidence: BOARD_CONFIDENCE };
    }
  }

  return null;
}

export const cssSelector: ExtractionMiddleware = async (ctx, next) => {
  recordLayerExecution(ctx, "css");

  const healthStore = ctx.healthStore ?? defaultHealthStore;
  const entries = getReadableEntries(ctx.board);
  const grouped = groupByField(entries);
  const attempts: TraceAttempt[] = [];

  // Track which fields got a match from registry (for self-healing)
  const fieldsMatched = new Set<FieldName>();
  // Track failed selectors per field (for repair proposals)
  const failedSelectorsPerField = new Map<FieldName, string[]>();

  // Determine all fields to extract (from registry + any site config fields)
  const allFields = new Set<FieldName>([...grouped.keys()]);
  if (ctx.siteConfig?.selectors) {
    for (const field of Object.keys(ctx.siteConfig.selectors)) {
      allFields.add(field as FieldName);
    }
  }

  for (const field of allFields) {
    // 1. Try site config selectors first (if available)
    if (ctx.siteConfig?.selectors?.[field]) {
      const siteResult = trySiteConfigSelectors(ctx, field, attempts);
      if (siteResult) {
        const existing = ctx.fields[field];
        if (!existing || existing.confidence < siteResult.confidence) {
          const extraction: FieldExtraction = {
            value: siteResult.value,
            source: "css-board",
            confidence: siteResult.confidence,
          };
          ctx.fields[field] = extraction;
          addSignal(ctx, field, {
            value: siteResult.value,
            source: "css-board",
            confidence: siteResult.confidence,
            layer: "css",
          });
        }
        fieldsMatched.add(field);
        continue; // Site config matched — skip registry for this field
      }
    }

    // 2. Try registry selectors
    const fieldEntries = grouped.get(field);
    if (fieldEntries) {
      let fieldMatched = false;

      for (const entry of fieldEntries) {
        const isGeneric = entry.board === "generic";
        const confidence = isGeneric ? GENERIC_CONFIDENCE : BOARD_CONFIDENCE;
        const source = isGeneric ? "css-generic" : "css-board";

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
            // Record health: failure
            healthStore.record(`${entry.id}:${selector}`, false, entry.board, field);

            // Track failed selectors for repair proposals
            if (!failedSelectorsPerField.has(field)) {
              failedSelectorsPerField.set(field, []);
            }
            failedSelectorsPerField.get(field)!.push(selector);
            continue;
          }

          // Record health: success
          healthStore.record(`${entry.id}:${selector}`, true, entry.board, field);

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
            // Still accumulate signal even if field override rejects
            addSignal(ctx, field, {
              value: rawValue,
              source,
              confidence,
              layer: "css",
            } as ExtractionSignal);
            break;
          }

          const extraction: FieldExtraction = {
            value: rawValue,
            source,
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

          // Accumulate signal
          addSignal(ctx, field, {
            value: rawValue,
            source,
            confidence,
            layer: "css",
          });

          fieldMatched = true;
          // Found a match for this field via this entry — stop trying selectors
          break;
        }

        // If we found a match for this field from this entry, stop trying more entries
        if (fieldMatched) break;

        const accepted = attempts.find(
          (a) => a.field === field && a.accepted && a.selectorId === entry.id
        );
        if (accepted) {
          fieldMatched = true;
          break;
        }
      }

      if (fieldMatched) {
        fieldsMatched.add(field);
      }
    }

    // 3. Self-healing: if no registry selectors matched for this field, try heuristic repair
    if (!fieldsMatched.has(field)) {
      const repairResult = attemptHeuristicRepair(
        ctx.dom,
        field,
        ctx.board
      );

      if (repairResult) {
        // Log repair attempt in trace
        attempts.push({
          layer: "css",
          attempted: true,
          matched: true,
          field,
          selector: repairResult.repairedSelector,
          rawValue: repairResult.value,
          cleanedValue: repairResult.value,
          accepted: true,
          rejectionReason: undefined,
        });

        // Set field with heuristic-repair confidence
        const existing = ctx.fields[field];
        if (!existing || existing.confidence < HEURISTIC_REPAIR_CONFIDENCE) {
          ctx.fields[field] = {
            value: repairResult.value,
            source: "heuristic-repair",
            confidence: HEURISTIC_REPAIR_CONFIDENCE,
          };
        }

        // Accumulate signal
        addSignal(ctx, field, {
          value: repairResult.value,
          source: "heuristic-repair",
          confidence: HEURISTIC_REPAIR_CONFIDENCE,
          layer: "css",
        });

        // Add repair proposal
        if (!ctx.selectorRepairs) {
          ctx.selectorRepairs = [];
        }
        ctx.selectorRepairs.push({
          board: ctx.board ?? "unknown",
          field,
          failedSelectors: failedSelectorsPerField.get(field) ?? [],
          repairedSelector: repairResult.repairedSelector,
          strategy: repairResult.strategy,
          confidence: repairResult.confidence,
        });

        fieldsMatched.add(field);
      } else if (failedSelectorsPerField.has(field)) {
        // All selectors failed and repair failed — log trace
        attempts.push({
          layer: "css",
          attempted: true,
          matched: false,
          field,
          accepted: false,
          rejectionReason: "all-selectors-failed-repair-failed",
        });
      }
    }
  }

  // Record field traces — CSS uses selectorId-based source for accepted attempts
  for (const attempt of attempts) {
    if (attempt.accepted && attempt.field) {
      const source = attempt.selectorId ? `css:${attempt.selectorId}` : "css";
      const existing = ctx.trace.fields.find((f) => f.field === attempt.field);
      if (existing) {
        existing.attempts.push(attempt);
        existing.finalValue = attempt.cleanedValue ?? "";
        existing.finalSource = source;
      } else {
        ctx.trace.fields.push({
          field: attempt.field,
          finalValue: attempt.cleanedValue ?? "",
          finalSource: source,
          attempts: [attempt],
        });
      }
    }
  }

  updateCompleteness(ctx);
  await next();
};
