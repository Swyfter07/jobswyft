import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  InMemorySelectorHealthStore,
  type SelectorHealthRecord,
} from "../../src/registry/selector-health";

describe("InMemorySelectorHealthStore", () => {
  let store: InMemorySelectorHealthStore;

  beforeEach(() => {
    store = new InMemorySelectorHealthStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── record() ───────────────────────────────────────────────────────────────

  it("records a success — updates counts and health score correctly", () => {
    store.record("sel-1", true, "linkedin", "title");

    const rec = store.getHealth("sel-1")!;
    expect(rec).toBeDefined();
    expect(rec.selectorId).toBe("sel-1");
    expect(rec.board).toBe("linkedin");
    expect(rec.field).toBe("title");
    expect(rec.successCount).toBe(1);
    expect(rec.failCount).toBe(0);
    expect(rec.totalAttempts).toBe(1);
    expect(rec.healthScore).toBe(1.0);
  });

  it("records a failure — updates counts and lowers health score", () => {
    store.record("sel-1", false, "indeed", "company");

    const rec = store.getHealth("sel-1")!;
    expect(rec).toBeDefined();
    expect(rec.selectorId).toBe("sel-1");
    expect(rec.board).toBe("indeed");
    expect(rec.field).toBe("company");
    expect(rec.successCount).toBe(0);
    expect(rec.failCount).toBe(1);
    expect(rec.totalAttempts).toBe(1);
    expect(rec.healthScore).toBe(0);
  });

  it("mixed success/failure — health score reflects ratio", () => {
    store.record("sel-1", true);
    store.record("sel-1", true);
    store.record("sel-1", false);
    store.record("sel-1", false);

    const rec = store.getHealth("sel-1")!;
    expect(rec.successCount).toBe(2);
    expect(rec.failCount).toBe(2);
    expect(rec.totalAttempts).toBe(4);
    expect(rec.healthScore).toBe(0.5);
  });

  it("health score is recomputed on every record call", () => {
    // 3 successes -> 1.0
    store.record("sel-1", true);
    store.record("sel-1", true);
    store.record("sel-1", true);
    expect(store.getHealth("sel-1")!.healthScore).toBe(1.0);

    // 1 failure brings it to 3/4 = 0.75
    store.record("sel-1", false);
    expect(store.getHealth("sel-1")!.healthScore).toBe(0.75);

    // another failure -> 3/5 = 0.6
    store.record("sel-1", false);
    expect(store.getHealth("sel-1")!.healthScore).toBeCloseTo(0.6);
  });

  // ─── getHealth() ─────────────────────────────────────────────────────────────

  it("getHealth returns undefined for unknown selectors", () => {
    expect(store.getHealth("nonexistent")).toBeUndefined();
  });

  it("getHealth returns independent records for different selectors", () => {
    store.record("sel-a", true);
    store.record("sel-b", false);

    const recA = store.getHealth("sel-a")!;
    const recB = store.getHealth("sel-b")!;

    expect(recA.healthScore).toBe(1.0);
    expect(recB.healthScore).toBe(0);
    expect(recA.selectorId).toBe("sel-a");
    expect(recB.selectorId).toBe("sel-b");
  });

  // ─── getSuggestedRepairs() ───────────────────────────────────────────────────

  it("getSuggestedRepairs returns degraded selectors (health < 0.5, attempts >= 2)", () => {
    // Degraded: 0 successes, 2 failures -> healthScore 0.0
    store.record("bad-sel", false);
    store.record("bad-sel", false);

    // Healthy: 2 successes -> healthScore 1.0
    store.record("good-sel", true);
    store.record("good-sel", true);

    const repairs = store.getSuggestedRepairs();
    expect(repairs).toHaveLength(1);
    expect(repairs[0].selectorId).toBe("bad-sel");
  });

  it("getSuggestedRepairs is sorted by worst health first", () => {
    // sel-worst: 0/3 = 0.0
    store.record("sel-worst", false);
    store.record("sel-worst", false);
    store.record("sel-worst", false);

    // sel-bad: 1/4 = 0.25
    store.record("sel-bad", true);
    store.record("sel-bad", false);
    store.record("sel-bad", false);
    store.record("sel-bad", false);

    // sel-borderline: 1/3 ~= 0.333
    store.record("sel-borderline", true);
    store.record("sel-borderline", false);
    store.record("sel-borderline", false);

    const repairs = store.getSuggestedRepairs();
    expect(repairs).toHaveLength(3);
    expect(repairs[0].selectorId).toBe("sel-worst");
    expect(repairs[0].healthScore).toBe(0);
    expect(repairs[1].selectorId).toBe("sel-bad");
    expect(repairs[1].healthScore).toBe(0.25);
    expect(repairs[2].selectorId).toBe("sel-borderline");
    expect(repairs[2].healthScore).toBeCloseTo(0.333, 2);
  });

  it("getSuggestedRepairs excludes selectors with too few attempts (< 2)", () => {
    // Only 1 attempt, even though healthScore = 0.0
    store.record("single-fail", false);

    const repairs = store.getSuggestedRepairs();
    expect(repairs).toHaveLength(0);
  });

  it("getSuggestedRepairs excludes selectors at exactly 0.5 health", () => {
    // 1 success + 1 failure = healthScore 0.5 (threshold is < 0.5, not <=)
    store.record("half-half", true);
    store.record("half-half", false);

    const repairs = store.getSuggestedRepairs();
    expect(repairs).toHaveLength(0);
  });

  it("getSuggestedRepairs returns empty array when no selectors tracked", () => {
    expect(store.getSuggestedRepairs()).toEqual([]);
  });

  // ─── Timestamps ──────────────────────────────────────────────────────────────

  it("lastVerified is set on success and lastFailed is set on failure", () => {
    const t1 = new Date("2026-02-14T10:00:00.000Z");
    vi.setSystemTime(t1);
    store.record("sel-ts", true);

    let rec = store.getHealth("sel-ts")!;
    expect(rec.lastVerified).toBe(t1.toISOString());
    expect(rec.lastFailed).toBeUndefined();

    const t2 = new Date("2026-02-14T11:00:00.000Z");
    vi.setSystemTime(t2);
    store.record("sel-ts", false);

    rec = store.getHealth("sel-ts")!;
    expect(rec.lastFailed).toBe(t2.toISOString());
    // lastVerified should still be t1 (not updated on failure)
    expect(rec.lastVerified).toBe(t1.toISOString());
  });

  it("lastVerified updates on subsequent successes", () => {
    const t1 = new Date("2026-02-14T10:00:00.000Z");
    vi.setSystemTime(t1);
    store.record("sel-ts2", true);

    const t2 = new Date("2026-02-14T12:00:00.000Z");
    vi.setSystemTime(t2);
    store.record("sel-ts2", true);

    const rec = store.getHealth("sel-ts2")!;
    expect(rec.lastVerified).toBe(t2.toISOString());
  });

  it("lastFailed updates on subsequent failures", () => {
    const t1 = new Date("2026-02-14T09:00:00.000Z");
    vi.setSystemTime(t1);
    store.record("sel-ts3", false);

    const t2 = new Date("2026-02-14T10:30:00.000Z");
    vi.setSystemTime(t2);
    store.record("sel-ts3", false);

    const rec = store.getHealth("sel-ts3")!;
    expect(rec.lastFailed).toBe(t2.toISOString());
  });

  it("initial record creation sets lastVerified regardless of success/failure", () => {
    const t1 = new Date("2026-02-14T08:00:00.000Z");
    vi.setSystemTime(t1);
    store.record("sel-init-fail", false);

    const rec = store.getHealth("sel-init-fail")!;
    // On creation the record initializes lastVerified, then the failure sets lastFailed
    expect(rec.lastVerified).toBe(t1.toISOString());
    expect(rec.lastFailed).toBe(t1.toISOString());
  });

  // ─── getHealthSummary() (Story 2.4) ───────────────────────────────────────

  describe("getHealthSummary", () => {
    it("returns summary for all selectors when no board filter", () => {
      store.record("sel-a", true, "linkedin", "title");
      store.record("sel-b", false, "indeed", "company");
      store.record("sel-b", false, "indeed", "company");

      const summary = store.getHealthSummary();
      expect(summary.board).toBe("all");
      expect(summary.totalSelectors).toBe(2);
    });

    it("filters by board when specified", () => {
      store.record("sel-li", true, "linkedin", "title");
      store.record("sel-in", false, "indeed", "company");

      const summary = store.getHealthSummary("linkedin");
      expect(summary.board).toBe("linkedin");
      expect(summary.totalSelectors).toBe(1);
    });

    it("classifies healthy selectors (healthScore >= 0.7)", () => {
      // 3 successes, 1 failure = 0.75 — healthy
      store.record("sel-h", true, "board", "title");
      store.record("sel-h", true, "board", "title");
      store.record("sel-h", true, "board", "title");
      store.record("sel-h", false, "board", "title");

      const summary = store.getHealthSummary("board");
      expect(summary.healthyCount).toBe(1);
      expect(summary.degradedCount).toBe(0);
      expect(summary.failedCount).toBe(0);
    });

    it("classifies degraded selectors (0.3 <= healthScore < 0.7)", () => {
      // 1 success, 1 failure = 0.5 — degraded
      store.record("sel-d", true, "board", "title");
      store.record("sel-d", false, "board", "title");

      const summary = store.getHealthSummary("board");
      expect(summary.healthyCount).toBe(0);
      expect(summary.degradedCount).toBe(1);
      expect(summary.failedCount).toBe(0);
    });

    it("classifies failed selectors (healthScore < 0.3)", () => {
      // 0 successes, 4 failures = 0.0 — failed
      store.record("sel-f", false, "board", "title");
      store.record("sel-f", false, "board", "title");
      store.record("sel-f", false, "board", "title");
      store.record("sel-f", false, "board", "title");

      const summary = store.getHealthSummary("board");
      expect(summary.healthyCount).toBe(0);
      expect(summary.degradedCount).toBe(0);
      expect(summary.failedCount).toBe(1);
    });

    it("computes overallSuccessRate as weighted average", () => {
      // 3 successes + 1 failure = 3/4 = 0.75
      store.record("sel-1", true, "board", "title");
      store.record("sel-1", true, "board", "title");
      store.record("sel-1", true, "board", "title");
      store.record("sel-1", false, "board", "title");

      const summary = store.getHealthSummary("board");
      expect(summary.overallSuccessRate).toBe(0.75);
    });

    it("returns 1.0 successRate for empty store", () => {
      const summary = store.getHealthSummary();
      expect(summary.overallSuccessRate).toBe(1.0);
      expect(summary.totalSelectors).toBe(0);
    });

    it("includes lastFailedSelectors sorted by most recent failure", () => {
      const t1 = new Date("2026-02-14T10:00:00.000Z");
      vi.setSystemTime(t1);
      store.record("sel-old", false, "board", "title");

      const t2 = new Date("2026-02-14T12:00:00.000Z");
      vi.setSystemTime(t2);
      store.record("sel-new", false, "board", "company");

      const summary = store.getHealthSummary("board");
      expect(summary.lastFailedSelectors).toHaveLength(2);
      expect(summary.lastFailedSelectors[0].selectorId).toBe("sel-new");
      expect(summary.lastFailedSelectors[1].selectorId).toBe("sel-old");
    });

    it("includes suggestedRepairs for degraded selectors", () => {
      store.record("sel-repair", false, "board", "title");
      store.record("sel-repair", false, "board", "title");
      store.record("sel-healthy", true, "board", "company");
      store.record("sel-healthy", true, "board", "company");

      const summary = store.getHealthSummary("board");
      expect(summary.suggestedRepairs).toHaveLength(1);
      expect(summary.suggestedRepairs[0].selectorId).toBe("sel-repair");
    });
  });
});
