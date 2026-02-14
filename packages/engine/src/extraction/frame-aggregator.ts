/**
 * Frame Aggregator — Merges multi-frame executeScript results into a single best-effort result.
 *
 * Strategy: Pick the "best" frame (one with both title AND company) as primary,
 * then fill gaps from remaining frames. Description uses longest-wins heuristic.
 *
 * This handles LinkedIn's SPA architecture where job details render in a same-origin
 * sub-frame while the main frame (frameId 0) only contains the navigation shell.
 */

import type { FrameResult } from "../types/frame-result";

/** Fields tracked during aggregation */
const SIMPLE_FIELDS = ["title", "company", "location", "salary", "employmentType", "sourceUrl"] as const;

export interface AggregatedResult {
  data: Record<string, string>;
  sources: Record<string, string>;
  sourceSelectorIds: Record<string, string>;
  hasShowMore: boolean;
}

/**
 * Score a frame result by data quality. Higher = better.
 * Frames with both title + company are strongly preferred.
 */
function scoreResult(d: Record<string, unknown> | undefined | null): number {
  if (!d) return 0;
  let score = 0;
  if (d.title) score += 10;
  if (d.company) score += 10;
  // Bonus for having BOTH title + company (core required fields)
  if (d.title && d.company) score += 20;
  if (d.description && typeof d.description === "string" && d.description.length > 50) score += 5;
  if (d.location) score += 2;
  if (d.salary) score += 1;
  return score;
}

/**
 * Aggregate multi-frame scripting results into a single data + sources record.
 *
 * @param results - Array of FrameResult (abstracted from chrome.scripting.InjectionResult[])
 * @returns Aggregated best data and sources
 */
export function aggregateFrameResults(
  results: FrameResult[] | undefined | null
): AggregatedResult {
  const data: Record<string, string> = {
    title: "", company: "", description: "", location: "", salary: "", employmentType: "", sourceUrl: "",
  };
  const sources: Record<string, string> = {};
  const sourceSelectorIds: Record<string, string> = {};
  let hasShowMore = false;

  const safeResults = results || [];

  // Sort frames by quality score (best first)
  const sorted = [...safeResults].sort((a, b) => scoreResult(b.result) - scoreResult(a.result));

  for (const r of sorted) {
    const d = r?.result as Record<string, unknown> | undefined;
    if (!d) continue;

    // hasShowMore: OR across all frames — if ANY frame detected show-more, report true
    if (d.hasShowMore) hasShowMore = true;

    for (const field of SIMPLE_FIELDS) {
      if (d[field] && !data[field]) {
        data[field] = d[field] as string;
        const dSources = d.sources as Record<string, string> | undefined;
        const dSelectorIds = d.sourceSelectorIds as Record<string, string> | undefined;
        if (dSources?.[field]) sources[field] = dSources[field];
        if (dSelectorIds?.[field]) sourceSelectorIds[field] = dSelectorIds[field];
      }
    }

    // Description uses longest-wins heuristic
    const dDesc = d.description as string | undefined;
    if (dDesc && dDesc.length > (data.description?.length || 0)) {
      data.description = dDesc;
      const dSources = d.sources as Record<string, string> | undefined;
      const dSelectorIds = d.sourceSelectorIds as Record<string, string> | undefined;
      if (dSources?.description) sources.description = dSources.description;
      if (dSelectorIds?.description) sourceSelectorIds.description = dSelectorIds.description;
    }
  }

  return { data, sources, sourceSelectorIds, hasShowMore };
}
