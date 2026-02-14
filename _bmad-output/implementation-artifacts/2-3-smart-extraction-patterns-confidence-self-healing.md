# Story 2.3: Smart Extraction Patterns — Confidence & Self-Healing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want weighted multi-signal confidence scoring, self-healing selectors, and config-driven site support,
So that extraction is accurate, resilient to DOM changes, and extensible to new job boards.

## Acceptance Criteria

1. **Weighted multi-signal confidence scoring (ADR-REV-SE2)**
   - When multiple extraction signals produce values for the same field, a weighted scoring algorithm combines them using source base weights: JSON-LD (0.95), CSS board-specific (0.85), CSS generic (0.60), OG meta (0.40), heuristic (0.30), heuristic-repair (0.40), AI fallback (0.90) — matching ADR-REV-SE2 and `SOURCE_CONFIDENCE` in `extraction-validator.ts`
   - Per-field confidence is tracked independently (title, company, description, location, salary)
   - Overall confidence is the weighted average of required field confidences
   - Confidence is 0-1 float internally, 0-100% for display only (PATTERN-SE5)

2. **Self-healing selector system (ADR-REV-SE3)**
   - When a primary CSS selector fails to match, a fallback chain is attempted in order: primary -> secondary -> tertiary -> heuristic repair
   - Each fallback attempt is logged with the selector tried and result
   - If heuristic repair succeeds, the repaired selector is proposed for config update
   - The system never silently returns empty data — partial results are returned with lowered confidence

3. **Config-driven site support (ADR-REV-SE4)**
   - When a supported job board is detected, the site config provides: board name, URL patterns, selector sets per field, pipeline hints, and custom extractor escape hatches
   - Pipeline hints can customize layer ordering (e.g., skip JSON-LD for boards that don't use it)

4. **Fixture-based test coverage**
   - At least 5 job board fixtures exist (LinkedIn, Indeed, Greenhouse, Lever, Workday — reusing alpha EXT-5.5 fixtures where possible)
   - Each fixture tests: field extraction accuracy, confidence scoring, and self-healing fallback behavior
   - Extraction accuracy meets NFR7 (95%+ on supported boards)

## Tasks / Subtasks

- [x] Task 1: Enhance confidence scoring with multi-signal combination (AC: #1)
  - [x] 1.1 Create `packages/engine/src/scoring/confidence-scorer.ts` — Multi-signal confidence combiner: `combineSignals(signals: ExtractionSignal[]): { value: string; confidence: number; source: ExtractionSource }`.
    - **Optimization:** Extract the diminishing returns logic from `computeFieldConfidence()` in `signal-weights.ts` into a generic shared helper `computeDiminishingScore(sortedWeights: number[]): number` that accepts a pre-sorted array of weight values. Both `computeFieldConfidence` (autofill `SignalEvaluation[]`) and `combineSignals` (extraction `ExtractionSignal[]`) should use this shared helper — they operate on different types but the math is identical.
    - **Requirement:** The returned `source` must be the source of the highest-confidence "base" signal.
  - [x] 1.2 Update `packages/engine/src/pipeline/types.ts`:
    - Define `ExtractionSignal`: `{ value: string; source: ExtractionSource; confidence: number; layer: LayerName }`.
    - Update `DetectionContext` to include `signals: Record<string, ExtractionSignal[]>` and `selectorRepairs?: SelectorRepairProposal[]` (typed array, not generic metadata).
    - Update `ExtractionSource` type in `src/scoring/extraction-validator.ts` (or wherever defined) to include `"heuristic-repair"`.
  - [x] 1.3 Update `packages/engine/src/pipeline/create-context.ts` — Initialize `ctx.signals = {}` in `createDetectionContext()`. Add `addSignal(ctx, field, signal)` helper that pushes to `ctx.signals[field]` array. Add `resolveSignals(ctx)` helper that runs `combineSignals` per field and writes final values to `ctx.fields`.
  - [x] 1.4 Update extraction layers (json-ld, css-selector, og-meta, heuristic) — **In addition to** existing `trySetField()` calls, also call `addSignal()` to accumulate signals. Layers must call BOTH: `trySetField()` keeps `ctx.fields` updated with best-so-far values (gates depend on this mid-pipeline), and `addSignal()` accumulates all signals for later resolution. Each layer continues to call `updateCompleteness()` after field writes.
  - [x] 1.5 Update `packages/engine/src/pipeline/layers/post-process.ts` — Call `resolveSignals(ctx)` before validation to combine all accumulated signals into final `ctx.fields`. **Crucial:** Call `updateCompleteness(ctx)` immediately after resolution to ensure the final completeness score reflects the combined values. **Trace update:** After resolution, update `ctx.trace.fields` entries whose `finalValue`/`finalSource` changed due to combined confidence exceeding any individual signal — the trace must reflect the resolved output, not just the mid-pipeline best-so-far.
  - [x] 1.6 Create `packages/engine/src/scoring/index.ts` barrel file (does not exist yet) to export `combineSignals`, `computeDiminishingScore`, and re-export existing functions. Then add scoring barrel re-export to `packages/engine/src/index.ts`.

- [x] Task 2: Implement self-healing selector system (AC: #2)
  - [x] 2.1 Create `packages/engine/src/registry/selector-health.ts` — `SelectorHealthRecord` type: `{ selectorId: string; board: string; field: string; successCount: number; failCount: number; totalAttempts: number; healthScore: number; lastVerified: string; lastFailed?: string }`. `SelectorHealthStore` interface with `record(selectorId, success)`, `getHealth(selectorId)`, `getSuggestedRepairs()` methods. In-memory implementation (no chrome.storage dependency — that's extension adapter scope).
  - [x] 2.2 Create `packages/engine/src/registry/heuristic-repair.ts` — `attemptHeuristicRepair(dom: Document, field: string, board: string | null): RepairResult | null`.
    - Repair strategies:
      (a) **Sibling/Parent Traversal:** Look for elements with similar structure/classes within the same container.
      (b) **Attribute Discovery:** Search for `[data-*]`, `aria-label`, or `[itemprop]` containing field keywords.
      (c) **Class Name Fuzzy Match:** Levenshtein distance < 3 on class names vs field keywords. Implement inline Levenshtein function (~15 lines, no external dependency — engine has no string distance library).
    - Returns: `{ value: string; repairedSelector: string; confidence: number; strategy: string }` or null.
  - [x] 2.3 Update `packages/engine/src/pipeline/layers/css-selector.ts` — After all registry selectors fail for a field, invoke `attemptHeuristicRepair()`. Log repair attempt and result in trace. If repair succeeds: set field with confidence 0.40 (lower than board-specific CSS 0.85), add `repairProposal` to `ctx.selectorRepairs[]` for upstream config update. Record health for all selectors tried (success/fail).
  - [x] 2.4 Add `SelectorRepairProposal` type to `packages/engine/src/pipeline/types.ts`: `{ board: string; field: string; failedSelectors: string[]; repairedSelector: string; strategy: string; confidence: number }`

- [x] Task 3: Define enhanced SiteConfig type for config-driven extraction (AC: #3)
  - [x] 3.1 Expand `SiteConfig` in `packages/engine/src/pipeline/types.ts`:
    ```typescript
    interface SiteConfig {
      board: string;
      name: string; // Human-readable board name
      urlPatterns: string[]; // Regex patterns for URL matching
      selectors: {
        // Per-field selector sets with fallback chain
        [field: string]: {
          primary: string[];
          secondary?: string[];
          tertiary?: string[];
        };
      };
      pipelineHints?: {
        skipLayers?: LayerName[]; // Layers to skip (e.g., "json-ld" for boards without it)
        layerOrder?: LayerName[]; // Custom layer ordering
        gateOverrides?: Record<string, number>; // Custom gate thresholds
      };
      customExtractor?: string; // Module path for escape hatch
      version: number; // Monotonic integer (PATTERN-SE6)
    }
    ```
  - [x] 3.2 No changes needed to `packages/engine/src/pipeline/layers/board-detector.ts` — `ctx.siteConfig` is already on the shared context and available to all downstream layers. Board-detector currently sets `ctx.siteConfig = undefined` (placeholder). Story 2.4 will set real config values here.
  - [x] 3.3 Update `packages/engine/src/pipeline/layers/css-selector.ts` — When `ctx.siteConfig?.selectors` is available, use site config selectors (primary → secondary → tertiary fallback chain) BEFORE falling back to `SELECTOR_REGISTRY`. This allows site configs to override the bundled registry.
  - [x] 3.4 Update `packages/engine/src/pipeline/default-pipeline.ts` — Accept optional `siteConfig?: SiteConfig` parameter in `createDefaultPipeline(siteConfig?)`. When `siteConfig?.pipelineHints?.skipLayers` is set, filter out named layers from the middleware array before composing. This approach resolves skipLayers at pipeline creation time (not runtime), matching the static composition pattern. For this story, the parameter is unused (activated in Story 2.4 when configs are loaded).

- [x] Task 4: Create HTML fixtures for fixture-based testing (AC: #4)
  - [x] 4.1 Create `packages/engine/test/fixtures/linkedin-job.html` — Structurally accurate LinkedIn job page trimmed to job content region only (no nav/footer/ads). Include: JSON-LD `@type: "JobPosting"` script block, CSS-matchable elements (`.job-details-jobs-unified-top-card__job-title`, `.job-details-jobs-unified-top-card__company-name`, etc.), OG meta tags. All 6 fields present (title, company, description, location, salary, employmentType).
  - [x] 4.2 Create `packages/engine/test/fixtures/indeed-job.html` — Indeed job page with `data-testid` attributes, `#jobDescriptionText`, salary info. Title + company + description + location. No JSON-LD (tests CSS path).
  - [x] 4.3 Create `packages/engine/test/fixtures/greenhouse-job.html` — Greenhouse job page with `.app-title`, `.company-name`, `#content` description. May have JSON-LD. Title + company + description + location.
  - [x] 4.4 Create `packages/engine/test/fixtures/lever-job.html` — Lever job page with `.posting-headline h2`, `.posting-categories .sort-by-time`. Title + description + location + employment type. No company (tests partial extraction).
  - [x] 4.5 Create `packages/engine/test/fixtures/workday-job.html` — Workday job page with `data-automation-id` attributes. Minimal selectors — tests heuristic repair and AI fallback paths.

- [x] Task 5: Write comprehensive tests (AC: #1, #2, #3, #4)
  - [x] 5.1 Create `packages/engine/test/scoring/confidence-scorer.test.ts` — Test multi-signal combination: corroborating signals boost confidence, disagreeing signals keep highest, single signal passthrough, empty signals return 0, cap at 0.99
  - [x] 5.2 Create `packages/engine/test/registry/selector-health.test.ts` — Test health recording, score calculation, degraded detection, repair suggestion
  - [x] 5.3 Create `packages/engine/test/registry/heuristic-repair.test.ts` — Test each repair strategy: sibling/parent traversal, attribute-based discovery, class-name fuzzy matching, null when all fail
  - [x] 5.4 Create `packages/engine/test/pipeline/fixture-extraction.test.ts` — Full pipeline integration tests with HTML fixtures: LinkedIn (JSON-LD short-circuit, 95%+ accuracy), Indeed (CSS path, 95%+), Greenhouse (CSS + JSON-LD, 95%+), Lever (partial extraction — no company field), Workday (heuristic/repair path)
  - [x] 5.5 Create `packages/engine/test/pipeline/self-healing.test.ts` — Test fallback chain: primary fails → secondary works, all selectors fail → heuristic repair succeeds, all fail → partial result with lowered confidence, repair proposal generated
  - [x] 5.6 Create `packages/engine/test/pipeline/multi-signal.test.ts` — Test signal accumulation across layers: JSON-LD + CSS agree → boosted confidence, JSON-LD + CSS disagree → highest wins, three signals corroborate → near-max confidence
  - [x] 5.7 **Existing test regression check:** Adding `addSignal()` alongside `trySetField()` in layers should not break existing 73 pipeline tests (layers still set `ctx.fields` identically mid-pipeline). However, `resolveSignals()` in post-process may change final field values when combined confidence exceeds individual signals. Review and update any existing pipeline-integration or post-process tests that assert on final field confidence values — they may need adjustment to expect resolved (combined) confidences instead of single-layer values.
  - [x] 5.8 Verify total test count across all new test files >= 30 and all 190 existing tests pass

- [x] Task 6: Validate (AC: all)
  - [x] 6.1 Run engine tests: `cd packages/engine && pnpm test` — all pass (190 existing + new)
  - [x] 6.2 Run extension tests: `cd apps/extension && pnpm test` — extension tests pass (zero regressions)
  - [x] 6.3 Build engine: `cd packages/engine && pnpm build` — clean build
  - [x] 6.4 Verify no Chrome API leakage: `cd packages/engine && pnpm lint` — clean

## Dev Notes

### Critical Architecture Constraints

**Multi-Signal Confidence Scoring (ADR-REV-SE2 — Core Enhancement):**
The current pipeline uses simple override: higher-confidence layer wins, lower-confidence layer is rejected. Story 2.3 adds multi-signal combination: when multiple layers agree on a field's value, their confidences are combined using a diminishing-returns algorithm.

Signal combination algorithm (reuse `computeDiminishingScore` helper):

```typescript
function combineSignals(signals: ExtractionSignal[]): {
  value: string;
  confidence: number;
  source: ExtractionSource;
} {
  // Group by value (exact match or high similarity)
  // For the winning value group:
  //   Base = highest confidence signal
  //   Bonus = sum of (other signals * 0.1 * 0.5^(i-1)) - handled by shared helper
  //   Cap at 0.99
  // Returns value + combined confidence + source of the BASE signal
}
```

**Source confidence weights for signal combination (ADR-REV-SE2):**

| Source               | Base Weight |
| -------------------- | ----------- |
| JSON-LD              | 0.95        |
| CSS (board-specific) | 0.85        |
| CSS (generic)        | 0.60        |
| OG Meta              | 0.40        |
| Heuristic            | 0.30        |
| Heuristic repair     | 0.40        | _(intentionally same as OG Meta — repair is better than raw heuristic 0.30, but less reliable than CSS)_ |
| AI Fallback          | 0.90        |

### Signal Accumulation Pattern (CRITICAL — Read This First)

Instead of replacing `trySetField()`, ADD a parallel `addSignal()` path. Each layer calls BOTH `addSignal()` (accumulates for later resolution) and continues to update `ctx.fields` with the best-so-far value (needed for confidence gates to work mid-pipeline). Then PostProcess calls `resolveSignals()` followed immediately by `updateCompleteness()` to produce final combined confidences.

**Self-Healing Selectors (ADR-REV-SE3 — Fallback Chain):**

```
Primary selector(s) → Secondary selector(s) → Tertiary selector(s) → Heuristic repair
```

Each level is tried in order. Heuristic repair uses three strategies:

1. **Sibling/Parent Traversal**: Walk DOM from known containers or siblings to find text content
2. **Attribute Discovery**: Search for `[data-*]`, `[aria-label]`, `[itemprop]` attributes matching field keywords
3. **Class Fuzzy Match**: Find elements with class names similar to expected patterns (Levenshtein distance < 3)

**Integration Points:**

- **CSS Selector Layer:** Self-healing plugs into `css-selector.ts`. After Registry failure, invoke `attemptHeuristicRepair()`.
- **DetectionContext Update:**
  ```typescript
  interface DetectionContext {
    // ... existing fields ...
    signals: Record<string, ExtractionSignal[]>;
    selectorRepairs?: SelectorRepairProposal[]; // Type-safe array
  }
  ```

**SiteConfig Enhanced Type (Foundation for Story 2.4):**
Story 2.3 defines the full TypeScript interface for site configs. Story 2.4 creates JSON config files and the config loading/registry system. The CSS selector layer in 2.3 should already CHECK for `ctx.siteConfig?.selectors`.

**`employmentType` Handling:**
Signal accumulation (`addSignal`, `resolveSignals`, `combineSignals`) must handle all 6 `DetectionContext.fields` including `employmentType`. It has no completeness weight (only title/company/description/location/salary are weighted), so it won't affect scoring, but it still participates in signal resolution and trace recording.

**Deferred Logic:**

- **Persistent Selector Health:** Engine tracks in-memory only. Persistence is Extension Adapter scope.
- **Config Loading:** Fake/stub loading in tests only. Real loading is Story 2.4.

### Reuse Existing Engine Functions

| Function                   | Location                              | Usage in Story 2.3                                        |
| -------------------------- | ------------------------------------- | --------------------------------------------------------- |
| `computeCompleteness()`    | `src/scoring/extraction-validator.ts` | Still used for overall completeness                       |
| `computeFieldConfidence()` | `src/scoring/extraction-validator.ts` | Used by signal combiner for per-source confidence         |
| `validateExtraction()`     | `src/scoring/extraction-validator.ts` | PostProcess validation unchanged                          |
| `SELECTOR_REGISTRY`        | `src/registry/selector-registry.ts`   | CSS layer still uses registry; self-healing adds fallback |
| `trySetField()`            | `src/pipeline/create-context.ts`      | Kept for backward compat; `addSignal()` added alongside   |
| `updateCompleteness()`     | `src/pipeline/create-context.ts`      | Called after signal resolution                            |
| `recordLayerExecution()`   | `src/pipeline/create-context.ts`      | All layers still use this                                 |
| `recordFieldTraces()`      | `src/pipeline/create-context.ts`      | All layers still use this                                 |
| `getJobBoard()`            | `src/detection/job-detector.ts`       | Board detection unchanged                                 |

### Pipeline Directory Structure (Story 2.3 additions)

```
packages/engine/
├── src/
│   ├── scoring/
│   │   ├── extraction-validator.ts  # EXISTING — no changes
│   │   ├── signal-weights.ts        # MODIFY — extract computeDiminishingScore()
│   │   └── confidence-scorer.ts     # NEW — multi-signal confidence combiner
│   ├── registry/
│   │   ├── selector-registry.ts     # EXISTING — no changes
│   │   ├── selector-health.ts       # NEW — selector success/failure tracking
│   │   └── heuristic-repair.ts      # NEW — last-resort selector repair
│   ├── pipeline/
│   │   ├── types.ts                 # MODIFY — add ExtractionSignal, SelectorRepairProposal, expand SiteConfig
│   │   ├── create-context.ts        # MODIFY — add signals map, addSignal(), resolveSignals()
│   │   ├── compose.ts               # EXISTING — no changes
│   │   ├── default-pipeline.ts      # MODIFY — add skipLayers support
│   │   ├── layers/
│   │   │   ├── css-selector.ts      # MODIFY — add self-healing, site-config selectors, health recording
│   │   │   ├── json-ld.ts           # MODIFY — add signal accumulation
│   │   │   ├── og-meta.ts           # MODIFY — add signal accumulation
│   │   │   ├── heuristic.ts         # MODIFY — add signal accumulation
│   │   │   ├── post-process.ts      # MODIFY — call resolution + updateCompleteness
│   │   │   └── (others unchanged)
│   │   └── index.ts                 # MODIFY — add new exports
│   └── index.ts                     # MODIFY — add new exports
├── test/
│   ├── fixtures/                    # NEW — HTML fixtures directory
│   │   ├── linkedin-job.html
│   │   ├── indeed-job.html
│   │   ├── greenhouse-job.html
│   │   ├── lever-job.html
│   │   └── workday-job.html
│   ├── scoring/
│   │   └── confidence-scorer.test.ts  # NEW
│   ├── registry/
│   │   ├── selector-health.test.ts    # NEW
│   │   └── heuristic-repair.test.ts   # NEW
│   └── pipeline/
│       ├── fixture-extraction.test.ts # NEW — full pipeline + fixture tests
│       ├── self-healing.test.ts       # NEW — fallback chain tests
│       └── multi-signal.test.ts       # NEW — signal combination tests
```

### Naming Conventions (Enforced — same as Stories 2.1, 2.2)

| Layer      | Convention                                | Example                                           |
| ---------- | ----------------------------------------- | ------------------------------------------------- |
| TS files   | `kebab-case.ts`                           | `confidence-scorer.ts`, `selector-health.ts`      |
| Exports    | `camelCase` functions, `PascalCase` types | `combineSignals()`, `SelectorHealthRecord`        |
| Constants  | `UPPER_SNAKE_CASE`                        | `SIGNAL_COMBINATION_WEIGHTS`, `REPAIR_STRATEGIES` |
| Test files | `*.test.ts` in `test/` mirroring `src/`   | `test/scoring/confidence-scorer.test.ts`          |
| Fixtures   | `{board}-job.html`                        | `linkedin-job.html`                               |

### Previous Story Intelligence (Stories 2.1 + 2.2 Learnings)

**From Story 2.1:**

- Build tool: tsup (ESM + DTS) — do NOT switch to Vite or tsc
- Barrel export aliases: `computeFieldConfidence` is aliased as `computeExtractionFieldConfidence` (from extraction-validator) and `computeSignalFieldConfidence` (from signal-weights). New `combineSignals` should NOT clash with these names.
- `scoring/index.ts` barrel does not exist yet — must be created (see Task 1.6).
- ESLint flat config with `@typescript-eslint/parser`. Chrome API ban via `no-restricted-globals`.
- `SelectorEntry.mode` field: `"read" | "write" | "both"`. Filter by mode in CSS layer.

**From Story 2.2:**

- 190 engine tests + 123 extension tests. New tests must not break any.
- Shared helpers: `trySetField()`, `recordFieldTraces()` in `create-context.ts`. Extend, don't replace.
- Compose error recovery: catches throws, marks `ctx.metadata.degraded`, continues. Self-healing must work within this.
- `ctx.metadata.errors: string[]` tracks multiple middleware failures.
- `ExtractionTrace.layersExecuted` is `LayerName[]` (not `string[]`).
- Post-process already: trims whitespace, decodes HTML entities, validates via `validateExtraction()`.

**Code review patterns:**

- Use concrete assertions (`expect(x).toBeDefined()`).
- Extract shared helpers to reduce duplication.

### Git Intelligence

Recent commit pattern: `feat(engine): story 2-X — ...` with code review as follow-up `fix(engine): story 2-X code review — ...`. Branch: `feat/jobswyft-alpha`.

### Anti-Patterns to Avoid

- **Do NOT** reimplement confidence combination from scratch — reuse the diminishing-returns algorithm pattern from `signal-weights.ts`
- **Do NOT** remove or replace `trySetField()` — add `addSignal()` alongside it for backward compatibility
- **Do NOT** create JSON config files for individual boards — that is Story 2.4 scope
- **Do NOT** implement config loading/syncing from API — that is Story 2.4 scope
- **Do NOT** implement persistent selector health storage — engine provides in-memory; persistence is extension adapter scope
- **Do NOT** implement real AI fallback logic — layer remains a stub (unchanged from Story 2.2)
- **Do NOT** modify any extension code — this story is 100% within `packages/engine/`
- **Do NOT** import from `@jobswyft/engine` barrel within the engine package (use relative imports)
- **Do NOT** use global `document` or `window` — always access DOM through `ctx.dom` parameter
- **Do NOT** create fixtures with full page HTML — keep them minimal (job content region only)
- **Do NOT** make signal accumulation break existing confidence gate behavior — gates must still work mid-pipeline using best-so-far values

### Project Structure Notes

- All new code goes in `packages/engine/` — zero extension changes
- `scoring/confidence-scorer.ts` is a NEW file in the existing `scoring/` directory
- `registry/selector-health.ts` and `registry/heuristic-repair.ts` are NEW files in the existing `registry/` directory
- `test/fixtures/` is a NEW directory for HTML test fixtures
- Engine remains zero Chrome API dependency
- Existing 190 tests must continue passing; new tests add to the total

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-engine-package-detection-extraction-autofill-core.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-SE2]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-SE3]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-SE4]
- [Source: _bmad-output/planning-artifacts/architecture/core-engine-implementation-detail.md#Extraction Pipeline]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#PATTERN-SE5]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#PATTERN-SE3]
- [Source: _bmad-output/implementation-artifacts/2-1-engine-package-scaffold-scan-engine-extraction.md]
- [Source: _bmad-output/implementation-artifacts/2-2-middleware-extraction-pipeline.md]
- [Source: packages/engine/src/scoring/extraction-validator.ts — confidence scoring functions]
- [Source: packages/engine/src/scoring/signal-weights.ts — signal weight computation pattern]
- [Source: packages/engine/src/registry/selector-registry.ts — existing selector registry]
- [Source: packages/engine/src/pipeline/types.ts — pipeline types]
- [Source: packages/engine/src/pipeline/create-context.ts — context helpers]
- [Source: packages/engine/src/pipeline/layers/css-selector.ts — current CSS extraction layer]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- All 6 tasks completed: multi-signal confidence scoring, self-healing selectors, enhanced SiteConfig, HTML fixtures, comprehensive tests, validation
- 99 new tests added across 6 test files (289 total, all passing)
- Dual-path signal accumulation pattern: `trySetField()` (best-so-far for gates) + `addSignal()` (accumulate for resolution) ensures backward compatibility
- `computeDiminishingScore()` extracted as shared helper used by both autofill and extraction scoring
- Self-healing fallback chain: site config → registry → heuristic repair (sibling traversal, attribute discovery, class fuzzy match)
- Confidence gate interaction: OG meta may be skipped for boards where CSS already achieves high completeness (expected behavior)
- All 190 existing tests pass without modification — zero regressions
- **Task 5.7 verification:** All 190 existing tests were re-run after signal accumulation changes. No modifications were needed because `resolveSignals()` only upgrades field confidence when the combined score exceeds the existing value — single-signal scenarios (all existing tests) produce identical confidence to their individual layer confidence, so no existing assertions were invalidated

### File List

**New Files:**
- `packages/engine/src/scoring/confidence-scorer.ts` — Multi-signal confidence combiner
- `packages/engine/src/scoring/index.ts` — Scoring barrel exports
- `packages/engine/src/registry/selector-health.ts` — Selector health tracking (in-memory)
- `packages/engine/src/registry/heuristic-repair.ts` — Last-resort selector repair strategies
- `packages/engine/test/fixtures/linkedin-job.html` — LinkedIn fixture (JSON-LD + CSS + OG)
- `packages/engine/test/fixtures/indeed-job.html` — Indeed fixture (CSS + OG, no JSON-LD)
- `packages/engine/test/fixtures/greenhouse-job.html` — Greenhouse fixture (JSON-LD + CSS)
- `packages/engine/test/fixtures/lever-job.html` — Lever fixture (partial extraction)
- `packages/engine/test/fixtures/workday-job.html` — Workday fixture (heuristic repair path)
- `packages/engine/test/scoring/confidence-scorer.test.ts` — 12 tests
- `packages/engine/test/registry/selector-health.test.ts` — 15 tests
- `packages/engine/test/registry/heuristic-repair.test.ts` — 17 tests
- `packages/engine/test/pipeline/fixture-extraction.test.ts` — 15 tests
- `packages/engine/test/pipeline/self-healing.test.ts` — 28 tests
- `packages/engine/test/pipeline/multi-signal.test.ts` — 12 tests

**Modified Files:**
- `packages/engine/package.json` — Dependency version updates
- `pnpm-lock.yaml` — Lockfile sync for dependency changes
- `packages/engine/src/scoring/extraction-validator.ts` — Added `heuristic-repair` to ExtractionSource
- `packages/engine/src/scoring/signal-weights.ts` — Extracted `computeDiminishingScore()` shared helper
- `packages/engine/src/pipeline/types.ts` — Added ExtractionSignal, SelectorRepairProposal, expanded SiteConfig
- `packages/engine/src/pipeline/create-context.ts` — Added signals init, addSignal(), resolveSignals()
- `packages/engine/src/pipeline/default-pipeline.ts` — Added siteConfig param, skipLayers support
- `packages/engine/src/pipeline/layers/css-selector.ts` — Self-healing, site config selectors, health recording
- `packages/engine/src/pipeline/layers/json-ld.ts` — Signal accumulation
- `packages/engine/src/pipeline/layers/og-meta.ts` — Signal accumulation
- `packages/engine/src/pipeline/layers/heuristic.ts` — Signal accumulation
- `packages/engine/src/pipeline/layers/post-process.ts` — resolveSignals() + updateCompleteness()
- `packages/engine/src/pipeline/index.ts` — New exports
- `packages/engine/src/index.ts` — New exports

## Senior Developer Review (AI)

**Reviewer:** Code Review Agent (Claude Opus 4.6)
**Date:** 2026-02-14
**Outcome:** Changes Requested → Fixed

### Issues Found: 3 High, 5 Medium, 4 Low

**All HIGH and MEDIUM issues were auto-fixed. Summary of fixes applied:**

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | HIGH | `SelectorHealthRecord` missing `board`/`field` per Task 2.1 spec | Added `board` and `field` to interface, updated `record()` signature, callers, and tests |
| H2 | HIGH | `resolveSignals()` didn't create trace entries for signal-only fields (Task 1.5 violation) | Added trace entry creation in `resolveSignals()` when no prior trace exists; updated test #11 |
| H3 | HIGH | Task 5.7 marked [x] without documented investigation | Added explicit verification note to Completion Notes |
| M1 | MEDIUM | Module-level singleton `healthStore` in css-selector.ts (untestable, non-injectable) | Added optional `healthStore` to `DetectionContext`; css-selector uses `ctx.healthStore ?? defaultHealthStore` |
| M2 | MEDIUM | `combineSignals()` returned untrimmed values from base signal | Added `.trim()` to returned value |
| M3 | MEDIUM | `package.json` modified but missing from story File List | Added to File List |
| M4 | MEDIUM | `pnpm-lock.yaml` changed but missing from story File List | Added to File List |
| M5 | MEDIUM | `el.className` in heuristic-repair unsafe for SVG elements | Replaced with `el.getAttribute("class")` in both `trySiblingParentTraversal` and `tryClassNameFuzzyMatch` |

**LOW issues noted but not fixed (acceptable):**
- L1: `_board` param unused in `attemptHeuristicRepair()` — intentional placeholder for future board-specific repair
- L2: Unnecessary `as ExtractionSignal` type assertion in css-selector.ts:241 — cosmetic
- L3: `tryClassNameFuzzyMatch` scans all elements with class — acceptable for last-resort repair path
- L4: Test count claim verified correct (99 new, 289 total)

**Post-fix verification:** 289 tests passing, build clean, lint clean.

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-14 | Code Review Agent | H1: Added board/field to SelectorHealthRecord type + record() + callers + tests |
| 2026-02-14 | Code Review Agent | H2: resolveSignals() now creates trace entries for signal-only fields |
| 2026-02-14 | Code Review Agent | M1: healthStore injectable via DetectionContext.healthStore |
| 2026-02-14 | Code Review Agent | M2: combineSignals() trims returned values |
| 2026-02-14 | Code Review Agent | M3/M4: Added package.json and pnpm-lock.yaml to File List |
| 2026-02-14 | Code Review Agent | M5: el.className replaced with el.getAttribute("class") for SVG safety |
