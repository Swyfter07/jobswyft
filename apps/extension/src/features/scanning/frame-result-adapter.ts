/**
 * Adapter: maps chrome.scripting.InjectionResult[] → FrameResult[]
 *
 * This bridges the Chrome extension API types with the engine package's
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
