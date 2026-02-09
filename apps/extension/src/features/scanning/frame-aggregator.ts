/**
 * Frame Aggregator — Merges multi-frame executeScript results into a single best-effort result.
 *
 * Strategy: Pick the "best" frame (one with both title AND company) as primary,
 * then fill gaps from remaining frames. Description uses longest-wins heuristic.
 *
 * This handles LinkedIn's SPA architecture where job details render in a same-origin
 * sub-frame while the main frame (frameId 0) only contains the navigation shell.
 */

/** Fields tracked during aggregation */
const SIMPLE_FIELDS = ["title", "company", "location", "salary", "employmentType", "sourceUrl"] as const;

export interface AggregatedResult {
  data: Record<string, string>;
  sources: Record<string, string>;
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
 * @param results - Array of chrome.scripting.executeScript InjectionResult[]
 * @returns Aggregated best data and sources
 */
export function aggregateFrameResults(
  results: chrome.scripting.InjectionResult[] | undefined | null
): AggregatedResult {
  const data: Record<string, string> = {
    title: "", company: "", description: "", location: "", salary: "", employmentType: "", sourceUrl: "",
  };
  const sources: Record<string, string> = {};

  const safeResults = results || [];

  // Sort frames by quality score (best first)
  const sorted = [...safeResults].sort((a, b) => scoreResult(b.result) - scoreResult(a.result));

  for (const r of sorted) {
    const d = r?.result;
    if (!d) continue;

    for (const field of SIMPLE_FIELDS) {
      if (d[field] && !data[field]) {
        data[field] = d[field];
        if (d.sources?.[field]) sources[field] = d.sources[field];
      }
    }

    // Description uses longest-wins heuristic
    if (d.description && d.description.length > (data.description?.length || 0)) {
      data.description = d.description;
      if (d.sources?.description) sources.description = d.sources.description;
    }
  }

  return { data, sources };
}
