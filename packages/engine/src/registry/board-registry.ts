/**
 * Board Registry — URL-to-SiteConfig mapping with pattern matching.
 *
 * Immutable after construction. Validates configs with assertSiteConfig(),
 * compiles URL patterns to RegExp, and provides config lookup by URL or board name.
 *
 * Architecture reference: PATTERN-SE1 (Site Config), ADR-REV-SE4 (Board Registry)
 */

import type { SiteConfig } from "../pipeline/types";
import type { SelectorHealthStore, HealthSummary } from "./selector-health";
import { assertSiteConfig } from "./config-schema";

// ─── Internal Types ──────────────────────────────────────────────────────────

interface CompiledPattern {
  regex: RegExp;
  board: string;
  specificity: number; // Longer pattern = more specific
}

// ─── Board Registry ──────────────────────────────────────────────────────────

export class BoardRegistry {
  private readonly configs: Map<string, SiteConfig>;
  private readonly patterns: CompiledPattern[];
  private readonly healthStore?: SelectorHealthStore;

  constructor(configs: SiteConfig[], healthStore?: SelectorHealthStore) {
    this.configs = new Map();
    this.patterns = [];
    this.healthStore = healthStore;

    for (const config of configs) {
      try {
        assertSiteConfig(config);
        this.configs.set(config.board, config);

        for (const pattern of config.urlPatterns) {
          try {
            this.patterns.push({
              regex: new RegExp(pattern, "i"),
              board: config.board,
              specificity: pattern.length,
            });
          } catch {
            // Skip invalid regex patterns — graceful degradation
            console.warn(
              `BoardRegistry: Invalid URL pattern "${pattern}" in config "${config.board}" — skipped`
            );
          }
        }
      } catch {
        // Skip invalid configs — graceful degradation
        console.warn(
          `BoardRegistry: Invalid config skipped — ${config?.board ?? "unknown"}`
        );
      }
    }

    // Sort patterns by specificity (most specific first)
    this.patterns.sort((a, b) => b.specificity - a.specificity);
  }

  /**
   * Find the best-match config for a given URL.
   * Returns undefined if no pattern matches.
   */
  getConfig(url: string): SiteConfig | undefined {
    for (const { regex, board } of this.patterns) {
      if (regex.test(url)) {
        return this.configs.get(board);
      }
    }
    return undefined;
  }

  /**
   * Returns the "generic" board config for fallback when getConfig() returns undefined.
   */
  getGenericConfig(): SiteConfig | undefined {
    return this.configs.get("generic");
  }

  /**
   * Direct board lookup by name.
   */
  getConfigByBoard(board: string): SiteConfig | undefined {
    return this.configs.get(board);
  }

  /**
   * Returns all loaded configs.
   */
  getAllConfigs(): SiteConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Returns the max version across all configs (for delta sync).
   */
  getVersion(): number {
    let max = 0;
    for (const config of this.configs.values()) {
      if (config.version > max) {
        max = config.version;
      }
    }
    return max;
  }

  /**
   * Delta sync: returns configs with version > input.
   */
  getConfigsSince(version: number): SiteConfig[] {
    return Array.from(this.configs.values()).filter(
      (c) => c.version > version
    );
  }

  /**
   * List all registered board names.
   */
  getBoardNames(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Check if a board config exists.
   */
  has(board: string): boolean {
    return this.configs.has(board);
  }

  /**
   * Delegates to healthStore.getHealthSummary(board) if healthStore was provided.
   */
  getHealthForConfig(config: SiteConfig): HealthSummary | undefined {
    if (!this.healthStore?.getHealthSummary) return undefined;
    return this.healthStore.getHealthSummary(config.board);
  }
}
