/**
 * @deprecated Superseded by engine-scan-adapter.ts:toScanCollectionResults() in Story 2.6.
 * The engine pipeline now uses ScanCollectionResult[] instead of FrameResult[].
 * Adapter: features/scanning/engine-scan-adapter.ts
 *
 * Original purpose: maps chrome.scripting.InjectionResult[] → FrameResult[]
 * This bridged the Chrome extension API types with the engine package's
 * generic FrameResult interface, keeping the engine Chrome-free.
 */

import type { FrameResult } from "@jobswyft/engine";

/**
 * Convert Chrome scripting injection results to engine-compatible FrameResult[].
 */
export function toFrameResults(
  results: chrome.scripting.InjectionResult[] | undefined | null
): FrameResult[] {
  if (!results) return [];
  return results.map((r) => ({
    result: r.result as Record<string, unknown> | null | undefined,
    frameId: r.frameId,
  }));
}
