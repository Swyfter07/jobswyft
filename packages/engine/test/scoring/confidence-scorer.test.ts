import { describe, it, expect } from "vitest";
import { combineSignals } from "../../src/scoring/confidence-scorer";
import type { ExtractionSignal } from "../../src/pipeline/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create an ExtractionSignal with sensible defaults. */
function sig(
  value: string,
  confidence: number,
  source: ExtractionSignal["source"] = "css-board",
  layer: ExtractionSignal["layer"] = "css"
): ExtractionSignal {
  return { value, confidence, source, layer };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("combineSignals", () => {
  // 1. Single signal passthrough
  it("returns a single signal as-is", () => {
    const result = combineSignals([sig("Software Engineer", 0.85, "json-ld", "json-ld")]);

    expect(result).not.toBeNull();
    expect(result!.value).toBe("Software Engineer");
    expect(result!.confidence).toBe(0.85);
    expect(result!.source).toBe("json-ld");
  });

  // 2. Two corroborating signals — combined confidence > highest individual
  it("boosts confidence when two signals agree on the same value", () => {
    const signals: ExtractionSignal[] = [
      sig("Software Engineer", 0.8, "json-ld", "json-ld"),
      sig("Software Engineer", 0.7, "css-board", "css"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    expect(result!.value).toBe("Software Engineer");
    // base = 0.8, bonus = 0.7 * 0.1 * 0.5^0 = 0.07 → combined = 0.87
    expect(result!.confidence).toBeCloseTo(0.87, 5);
    expect(result!.confidence).toBeGreaterThan(0.8);
  });

  // 3. Three corroborating signals — near-max confidence
  it("approaches max confidence with three corroborating signals", () => {
    const signals: ExtractionSignal[] = [
      sig("Acme Corp", 0.9, "json-ld", "json-ld"),
      sig("Acme Corp", 0.85, "css-board", "css"),
      sig("Acme Corp", 0.8, "og-meta", "og-meta"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    expect(result!.value).toBe("Acme Corp");
    // base = 0.9
    // bonus1 = 0.85 * 0.1 * 0.5^0 = 0.085
    // bonus2 = 0.8  * 0.1 * 0.5^1 = 0.04
    // total  = 0.9 + 0.085 + 0.04 = 1.025 → capped at 0.99
    expect(result!.confidence).toBeCloseTo(0.99, 5);
  });

  // 4. Disagreeing signals — highest confidence value wins
  it("picks the highest-confidence value when signals disagree", () => {
    const signals: ExtractionSignal[] = [
      sig("Senior Engineer", 0.9, "json-ld", "json-ld"),
      sig("Junior Engineer", 0.6, "heuristic", "heuristic"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    expect(result!.value).toBe("Senior Engineer");
    // single signal in each group; base is the only contributor
    expect(result!.confidence).toBe(0.9);
    expect(result!.source).toBe("json-ld");
  });

  // 5. Empty signals array — returns null
  it("returns null for an empty signals array", () => {
    expect(combineSignals([])).toBeNull();
  });

  // 6. Mixed: two agree + one disagrees — agreeing pair wins when combined > single
  it("favors an agreeing pair over a single higher-confidence disagreeing signal", () => {
    const signals: ExtractionSignal[] = [
      // Single disagreeing signal with higher base confidence
      sig("Wrong Title", 0.88, "heuristic", "heuristic"),
      // Two agreeing signals with individually lower confidence
      sig("Correct Title", 0.85, "json-ld", "json-ld"),
      sig("Correct Title", 0.82, "css-board", "css"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    // Agreeing pair: 0.85 + 0.82 * 0.1 * 1 = 0.85 + 0.082 = 0.932
    // Disagreeing:   0.88
    // 0.932 > 0.88, so the agreeing pair wins
    expect(result!.value).toBe("Correct Title");
    expect(result!.confidence).toBeCloseTo(0.932, 5);
    expect(result!.confidence).toBeGreaterThan(0.88);
  });

  // 7. Confidence cap at 0.99
  it("caps combined confidence at 0.99", () => {
    const signals: ExtractionSignal[] = [
      sig("Full Stack Developer", 0.95, "json-ld", "json-ld"),
      sig("Full Stack Developer", 0.92, "css-board", "css"),
      sig("Full Stack Developer", 0.90, "og-meta", "og-meta"),
      sig("Full Stack Developer", 0.88, "heuristic", "heuristic"),
      sig("Full Stack Developer", 0.85, "ai-llm", "ai-fallback"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(0.99);
    expect(result!.confidence).toBeLessThanOrEqual(0.99);
  });

  // 8. Source attribution — returns source of the highest-confidence base signal
  it("returns the source of the highest-confidence signal in the winning group", () => {
    const signals: ExtractionSignal[] = [
      sig("Data Analyst", 0.70, "heuristic", "heuristic"),
      sig("Data Analyst", 0.90, "json-ld", "json-ld"),
      sig("Data Analyst", 0.60, "og-meta", "og-meta"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    // The base signal is the one with confidence 0.90 (json-ld)
    expect(result!.source).toBe("json-ld");
    expect(result!.value).toBe("Data Analyst");
  });

  // ─── Additional edge-case tests ────────────────────────────────────────────

  // 9. Case-insensitive grouping — preserves original casing from base signal
  it("groups signals case-insensitively and preserves the base signal's casing", () => {
    const signals: ExtractionSignal[] = [
      sig("software engineer", 0.70, "heuristic", "heuristic"),
      sig("Software Engineer", 0.85, "json-ld", "json-ld"),
      sig("SOFTWARE ENGINEER", 0.60, "og-meta", "og-meta"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    // Base signal (0.85) has "Software Engineer" casing
    expect(result!.value).toBe("Software Engineer");
    expect(result!.confidence).toBeGreaterThan(0.85);
  });

  // 10. Whitespace normalization — trimmed values group together
  it("groups signals with leading/trailing whitespace together", () => {
    const signals: ExtractionSignal[] = [
      sig("  Backend Developer  ", 0.80, "css-board", "css"),
      sig("Backend Developer", 0.75, "json-ld", "json-ld"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    // Both normalize to "backend developer", forming one group
    // Base is 0.80 signal since it has higher confidence
    expect(result!.confidence).toBeGreaterThan(0.80);
  });

  // 11. Exact diminishing-returns math verification
  it("matches the exact diminishing-returns formula for two signals", () => {
    const signals: ExtractionSignal[] = [
      sig("QA Engineer", 0.6, "css-generic", "css"),
      sig("QA Engineer", 0.5, "heuristic", "heuristic"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    // base = 0.6, bonus = 0.5 * 0.1 * 0.5^0 = 0.05 → total = 0.65
    expect(result!.confidence).toBeCloseTo(0.65, 10);
  });

  // 12. Three groups — group with most corroboration wins over single high-confidence
  it("resolves correctly across three distinct value groups", () => {
    const signals: ExtractionSignal[] = [
      sig("Title A", 0.50, "heuristic", "heuristic"),
      sig("Title B", 0.70, "css-board", "css"),
      sig("Title B", 0.65, "og-meta", "og-meta"),
      sig("Title C", 0.80, "json-ld", "json-ld"),
    ];

    const result = combineSignals(signals);

    expect(result).not.toBeNull();
    // Title A: 0.50
    // Title B: 0.70 + 0.65 * 0.1 * 1 = 0.765
    // Title C: 0.80
    // Title C wins (0.80 > 0.765)
    expect(result!.value).toBe("Title C");
    expect(result!.confidence).toBe(0.80);
  });
});
