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

export interface SelectorHealthStore {
  record(selectorId: string, success: boolean, board: string, field: string): void;
  getHealth(selectorId: string): SelectorHealthRecord | undefined;
  getSuggestedRepairs(): SelectorHealthRecord[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEGRADED_THRESHOLD = 0.5;

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
}
