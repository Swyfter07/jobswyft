/**
 * Selector Health Tracking — Monitors selector success/failure rates.
 *
 * In-memory implementation tracks health per selector to identify degraded
 * selectors and suggest repairs. No chrome.storage dependency — persistence
 * is extension adapter scope.
 *
 * Architecture reference: ADR-REV-SE3 (Self-Healing Selectors)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelectorHealthRecord {
  selectorId: string;
  board: string;
  field: string;
  successCount: number;
  failCount: number;
  totalAttempts: number;
  healthScore: number;
  lastVerified: string;
  lastFailed?: string;
}

export interface HealthSummary {
  board: string;
  totalSelectors: number;
  healthyCount: number;
  degradedCount: number;
  failedCount: number;
  overallSuccessRate: number;
  lastFailedSelectors: SelectorHealthRecord[];
  suggestedRepairs: SelectorHealthRecord[];
}

export interface SelectorHealthStore {
  record(selectorId: string, success: boolean, board: string, field: string): void;
  getHealth(selectorId: string): SelectorHealthRecord | undefined;
  getSuggestedRepairs(): SelectorHealthRecord[];
  getHealthSummary?(board?: string): HealthSummary;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEGRADED_THRESHOLD = 0.5;
const HEALTHY_THRESHOLD = 0.7;
const FAILED_THRESHOLD = 0.3;

// ─── In-Memory Implementation ───────────────────────────────────────────────

export class InMemorySelectorHealthStore implements SelectorHealthStore {
  private records = new Map<string, SelectorHealthRecord>();

  record(selectorId: string, success: boolean, board: string = "unknown", field: string = "unknown"): void {
    let rec = this.records.get(selectorId);
    if (!rec) {
      rec = {
        selectorId,
        board,
        field,
        successCount: 0,
        failCount: 0,
        totalAttempts: 0,
        healthScore: 1.0,
        lastVerified: new Date().toISOString(),
      };
      this.records.set(selectorId, rec);
    }

    rec.totalAttempts++;
    if (success) {
      rec.successCount++;
      rec.lastVerified = new Date().toISOString();
    } else {
      rec.failCount++;
      rec.lastFailed = new Date().toISOString();
    }

    // Recalculate health score
    rec.healthScore =
      rec.totalAttempts > 0 ? rec.successCount / rec.totalAttempts : 1.0;
  }

  getHealth(selectorId: string): SelectorHealthRecord | undefined {
    return this.records.get(selectorId);
  }

  getSuggestedRepairs(): SelectorHealthRecord[] {
    const degraded: SelectorHealthRecord[] = [];
    for (const rec of this.records.values()) {
      if (rec.healthScore < DEGRADED_THRESHOLD && rec.totalAttempts >= 2) {
        degraded.push(rec);
      }
    }
    // Sort by worst health first
    return degraded.sort((a, b) => a.healthScore - b.healthScore);
  }

  getHealthSummary(board?: string): HealthSummary {
    const filtered: SelectorHealthRecord[] = [];
    for (const rec of this.records.values()) {
      if (!board || rec.board === board) {
        filtered.push(rec);
      }
    }

    let healthyCount = 0;
    let degradedCount = 0;
    let failedCount = 0;
    let totalSuccess = 0;
    let totalAttempts = 0;
    const lastFailedSelectors: SelectorHealthRecord[] = [];
    const suggestedRepairs: SelectorHealthRecord[] = [];

    for (const rec of filtered) {
      totalSuccess += rec.successCount;
      totalAttempts += rec.totalAttempts;

      if (rec.healthScore >= HEALTHY_THRESHOLD) {
        healthyCount++;
      } else if (rec.healthScore >= FAILED_THRESHOLD) {
        degradedCount++;
      } else {
        failedCount++;
      }

      if (rec.lastFailed) {
        lastFailedSelectors.push(rec);
      }
      if (rec.healthScore < DEGRADED_THRESHOLD && rec.totalAttempts >= 2) {
        suggestedRepairs.push(rec);
      }
    }

    // Sort last failed by most recent failure
    lastFailedSelectors.sort(
      (a, b) => new Date(b.lastFailed!).getTime() - new Date(a.lastFailed!).getTime()
    );
    // Sort repairs by worst health first
    suggestedRepairs.sort((a, b) => a.healthScore - b.healthScore);

    return {
      board: board ?? "all",
      totalSelectors: filtered.length,
      healthyCount,
      degradedCount,
      failedCount,
      overallSuccessRate: totalAttempts > 0 ? totalSuccess / totalAttempts : 1.0,
      lastFailedSelectors,
      suggestedRepairs,
    };
  }
}
