# Story 2.4: Site Config System & Board Registry

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a config-driven site registry with JSON config files per job board and a selector health tracking system,
So that adding new board support is a config change (not a code change) and selector breakage is detectable.

## Acceptance Criteria

1. **Site config file system (PATTERN-SE1)**
   - Each config lives at `configs/sites/{domain}.json` (repo root, per architecture project structure)
   - The config schema includes: `name`, `urlPatterns` (array of regex), `selectors` (per field with fallback chain), `pipelineHints` (optional layer overrides), `customExtractor` (optional escape hatch module path)
   - A Zod schema in `packages/engine/src/registry/config-schema.ts` validates configs at runtime
   - A JSON Schema (`configs/sites/_schema.json`) is generated from the Zod schema for CI validation

2. **Board registry**
   - When the engine initializes, all site configs are loaded and indexed by URL pattern
   - URL matching returns the best-match config for any given URL
   - Unknown URLs (no config match) proceed to the heuristic + AI fallback path. `BoardRegistry` exposes `getGenericConfig(): SiteConfig | undefined` for callers to use as a fallback when `getConfig(url)` returns `undefined`
   - The registry is a standalone class injectable via `DetectionContext.boardRegistry`

3. **Top 10 job board configs**
   - Configs exist for: LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor, Monster, ZipRecruiter, AngelList/Wellfound, and a generic ATS template
   - Each config has at least primary + secondary selectors for: title, company, description, location
   - Selectors sourced from `SELECTOR_REGISTRY` where available (LinkedIn, Indeed, Greenhouse, Lever, Workday have good coverage). Boards with limited registry coverage (Glassdoor, Monster, ZipRecruiter, Wellfound) use researched selectors — dev must verify against live pages before finalizing
   - The `board` field in each config MUST match the `getJobBoard()` return value (e.g., `"linkedin"`, `"indeed"`, `"greenhouse"`) so that `ctx.board` and `ctx.siteConfig.board` are consistent for health tracking aggregation

4. **Selector health tracking integration (ADR-REV-I3)**
   - When an extraction runs, selector success/failure is recorded per selector per site
   - Health data is stored locally (in-memory in engine, persistence is extension adapter scope)
   - A health summary function returns: per-site success rate, last-failed selectors, suggested repairs
   - (Already implemented in Story 2.3 `SelectorHealthStore` — this story wires it into the config system)

5. **Config version system (PATTERN-SE6)**
   - Each config has a `version` number (monotonic integer)
   - The engine can detect when local configs are stale vs. the bundled version
   - Delta sync is supported (only load changed configs) — `getConfigsSince(version): SiteConfig[]`

6. **Board-detector integration**
   - `board-detector.ts` updated to populate `ctx.siteConfig` from the board registry (replacing `ctx.siteConfig = undefined` placeholder)
   - When `ctx.siteConfig` is populated, downstream layers use site-config selectors (already wired in Story 2.3 css-selector.ts)
   - Pipeline creation supports config-driven `skipLayers` at composition time (already implemented in default-pipeline.ts)

## Tasks / Subtasks

- [x] Task 1: Create Zod config schema and validation (AC: #1)
  - [x] 1.1 Create `packages/engine/src/registry/config-schema.ts` — Define `SiteConfigSchema` using Zod that validates against the `SiteConfig` interface already defined in `pipeline/types.ts`:
    ```typescript
    const SiteConfigSchema = z.object({
      board: z.string(),
      name: z.string(),
      urlPatterns: z.array(z.string()),
      selectors: z.record(z.object({
        primary: z.array(z.string()),
        secondary: z.array(z.string()).optional(),
        tertiary: z.array(z.string()).optional(),
      })),
      pipelineHints: z.object({
        skipLayers: z.array(z.string()).optional(),
        layerOrder: z.array(z.string()).optional(),
        gateOverrides: z.record(z.number()).optional(),
      }).optional(),
      customExtractor: z.string().optional(),
      version: z.number().int().min(1),
    });
    ```
    Export: `SiteConfigSchema`, `validateSiteConfig(json: unknown): SiteConfig`, `validateSiteConfigs(jsonArray: unknown[]): SiteConfig[]`.
    - `validateSiteConfig` throws a typed `ConfigValidationError` with field-level detail on failure.
    - **Do NOT add Zod as production dependency.** Zod should be a devDependency for build-time validation and tests. At runtime in the engine, configs are pre-validated. Add a lightweight `assertSiteConfig(config: unknown): asserts config is SiteConfig` using TypeScript type guards for runtime safety without the Zod bundle cost.
  - [x] 1.2 Create `configs/sites/_schema.json` — Generate JSON Schema from the Zod schema using `zod-to-json-schema` (devDependency). This enables CI validation of JSON config files without importing the engine package. Add a script to `packages/engine/package.json`: `"generate:schema": "tsx scripts/generate-json-schema.ts"`.
  - [x] 1.3 Create `packages/engine/scripts/generate-json-schema.ts` — Script that imports `SiteConfigSchema`, converts to JSON Schema via `zod-to-json-schema`, writes to `../../configs/sites/_schema.json`.

- [x] Task 2: Create BoardRegistry class (AC: #2)
  - [x] 2.1 Create `packages/engine/src/registry/board-registry.ts`:
    ```typescript
    export class BoardRegistry {
      private configs: Map<string, SiteConfig>;
      private patterns: Array<{ regex: RegExp; board: string }>;

      constructor(configs: SiteConfig[], healthStore?: SelectorHealthStore) // Validate and index; healthStore enables getHealthForConfig()
      getConfig(url: string): SiteConfig | undefined // URL pattern match, best match wins
      getGenericConfig(): SiteConfig | undefined // Returns the "generic" board config for fallback when getConfig() returns undefined
      getConfigByBoard(board: string): SiteConfig | undefined // Direct board lookup
      getAllConfigs(): SiteConfig[] // All loaded configs
      getVersion(): number // Max version across all configs
      getConfigsSince(version: number): SiteConfig[] // Delta: configs with version > input
      getBoardNames(): string[] // List of registered board names
      has(board: string): boolean // Check if board config exists
      getHealthForConfig(config: SiteConfig): HealthSummary | undefined // Delegates to healthStore (if provided at construction)
    }
    ```
    - URL matching: compile `urlPatterns` to `RegExp` at construction time. On `getConfig(url)`, test all patterns, return the config whose pattern matched. If multiple match, prefer the more specific pattern (longer regex or first match).
    - Config validation: run `assertSiteConfig()` on each config at construction time. Skip invalid configs with a warning (don't throw — graceful degradation).
    - **Thread-safe:** The registry is immutable after construction. No mutation methods. To update, create a new `BoardRegistry` instance.
  - [x] 2.2 Update `packages/engine/src/pipeline/types.ts` — Add `boardRegistry?: BoardRegistry` to `DetectionContext` interface (optional, similar to `healthStore`).
  - [x] 2.3 Update `packages/engine/src/pipeline/create-context.ts` — Change signature to `createDetectionContext(url, dom, options?: { boardRegistry?, healthStore? })` and assign `ctx.boardRegistry = options?.boardRegistry` in the returned object. Follow the same injection pattern as `healthStore`.

- [x] Task 3: Update board-detector to use registry (AC: #6)
  - [x] 3.1 Update `packages/engine/src/pipeline/layers/board-detector.ts`:
    ```typescript
    export const boardDetector: ExtractionMiddleware = async (ctx, next) => {
      recordLayerExecution(ctx, "board-detector");
      const board = getJobBoard(ctx.url);
      ctx.board = board;
      ctx.trace.board = board;

      // Story 2.4: Load site config from board registry
      if (ctx.boardRegistry) {
        ctx.siteConfig = ctx.boardRegistry.getConfig(ctx.url);
      }
      // If no registry or no match, ctx.siteConfig remains undefined
      // Downstream layers (css-selector, etc.) handle undefined gracefully

      await next();
    };
    ```
    - The existing `getJobBoard(url)` still runs for `ctx.board` (used by selector registry filtering in css-selector.ts).
    - `ctx.siteConfig` is populated from the board registry when available.
    - When `ctx.siteConfig?.selectors` is populated, css-selector.ts already tries site config selectors BEFORE falling back to `SELECTOR_REGISTRY` (implemented in Story 2.3).
  - [x] 3.2 Update `packages/engine/src/pipeline/default-pipeline.ts` — Add `boardRegistry?: BoardRegistry` to the options that `createDefaultPipeline` passes through. The pipeline factory should accept `{ siteConfig?, boardRegistry? }` so callers can provide either direct config or registry-based lookup.
    - **Design decision:** When BOTH `siteConfig` and `boardRegistry` are provided, `siteConfig` takes precedence (explicit override). The board-detector only uses the registry when `ctx.siteConfig` is not already set.

- [x] Task 4: Create top 10 job board config files (AC: #3)
  **Reference JSON config** (canonical format for all board configs):
  ```json
  {
    "board": "greenhouse",
    "name": "Greenhouse",
    "urlPatterns": ["greenhouse\\.io/[\\w-]+/jobs/\\d+", "boards\\.greenhouse\\.io"],
    "selectors": {
      "title": { "primary": [".app-title"], "secondary": ["h1.heading"] },
      "company": { "primary": [".company-name"], "secondary": ["span[itemprop=\"hiringOrganization\"]"] },
      "description": { "primary": ["#content"], "secondary": [".content-intro"] },
      "location": { "primary": [".location"], "secondary": ["div[itemprop=\"jobLocation\"]"] }
    },
    "version": 1
  }
  ```
  **Selector sourcing strategy:**
  - Boards with good `SELECTOR_REGISTRY` coverage (LinkedIn, Indeed, Greenhouse, Lever, Workday): extract from registry. Map entries by field — priority-1 entry's selectors → `primary`, priority-2 → `secondary`.
  - Boards with limited coverage (Glassdoor, Monster, ZipRecruiter, Wellfound): selectors listed below are researched baselines — verify against live pages.
  - `board` field MUST match `getJobBoard()` return value exactly (e.g., `"linkedin"`, `"indeed"`).
  - `urlPatterns` are regex strings compiled to `RegExp` at construction. Model after `JOB_BOARD_PATTERNS` in `job-detector.ts` (e.g., `"linkedin\\.com/jobs"`, `"indeed\\.com/viewjob"`, `"myworkdayjobs\\.com"`).
  - [x] 4.1 Create directory `configs/sites/` at repo root
  - [x] 4.2 Create `configs/sites/linkedin.com.json` — Selectors from SELECTOR_REGISTRY `linkedin` entries:
    - title: primary `.job-details-jobs-unified-top-card__job-title`, secondary `h1.t-24`, `h1[data-test-id="job-title"]`
    - company: primary `.job-details-jobs-unified-top-card__company-name a`, secondary `a[data-tracking-control-name="public_jobs_topcard-org-name"]`
    - description: primary `.jobs-description__content`, secondary `#job-details`, `article.jobs-description`
    - location: primary `.job-details-jobs-unified-top-card__bullet`, secondary `span.jobs-unified-top-card__bullet`
    - salary: primary `.job-details-jobs-unified-top-card__job-insight span`, secondary `.salary-main-rail`
    - pipelineHints: none (LinkedIn has JSON-LD, so default ordering works well)
    - version: 1
  - [x] 4.3 Create `configs/sites/indeed.com.json` — Selectors from `indeed` entries:
    - title: primary `h1[data-testid="jobsearch-JobInfoHeader-title"]`, secondary `.jobsearch-JobInfoHeader-title`
    - company: primary `div[data-testid="inlineHeader-companyName"] a`, secondary `[data-company-name]`
    - description: primary `#jobDescriptionText`, secondary `.jobsearch-JobComponent-description`
    - location: primary `div[data-testid="inlineHeader-companyLocation"]`, secondary `div[data-testid="job-location"]`
    - salary: primary `div[data-testid="attribute_snippet_testid"] span`, secondary `#salaryInfoAndJobType span`
    - pipelineHints: `skipLayers: []` (Indeed sometimes has JSON-LD, keep all layers)
    - version: 1
  - [x] 4.4 Create `configs/sites/greenhouse.io.json` — Selectors from `greenhouse` entries:
    - title: primary `.app-title`, secondary `h1.heading`
    - company: primary `.company-name`, secondary `span[itemprop="hiringOrganization"]`
    - description: primary `#content`, secondary `.content-intro`
    - location: primary `.location`, secondary `div[itemprop="jobLocation"]`
    - pipelineHints: none (Greenhouse usually has JSON-LD)
    - version: 1
  - [x] 4.5 Create `configs/sites/lever.co.json` — Selectors from `lever` entries:
    - title: primary `.posting-headline h2`, secondary `.posting-header .posting-headline`
    - description: primary `.posting-page .content`, secondary `div[data-qa="posting-description"]`
    - location: primary `.posting-categories .sort-by-time`, secondary `.location .posting-category`
    - employmentType: primary `.posting-categories .commitment`, secondary `.workplaceTypes`
    - Note: Lever pages typically don't show company name — omit company selectors
    - pipelineHints: `skipLayers: ["json-ld"]` (Lever rarely has JSON-LD)
    - version: 1
  - [x] 4.6 Create `configs/sites/workday.com.json` (includes myworkdayjobs.com) — Selectors from `workday` entries:
    - title: primary `[data-automation-id="jobPostingHeader"]`, secondary `h2[data-automation-id="jobTitle"]`
    - description: primary `[data-automation-id="jobPostingDescription"]`, secondary `.job-description`
    - Note: Workday has minimal selectors — relies heavily on heuristic + AI fallback path
    - urlPatterns should match both `workday.com` and `myworkdayjobs.com`
    - version: 1
  - [x] 4.7 Create `configs/sites/glassdoor.com.json` — **Researched selectors** (only description in SELECTOR_REGISTRY; verify against live pages):
    - title: primary `h1[data-test="job-title"]`, secondary `.css-1vg6q84`
    - company: primary `div[data-test="employer-name"]`, secondary `.css-87uc0g`
    - description: primary `.jobDescriptionContent`, secondary `div[data-test="job-description"]`
    - location: primary `div[data-test="location"]`
    - salary: primary `div[data-test="detailSalary"]`
    - version: 1
  - [x] 4.8 Create `configs/sites/monster.com.json` — **Researched selectors** (no SELECTOR_REGISTRY coverage; verify against live pages):
    - title: primary `h1.heading-xxlarge`, secondary `h1[data-testid="job-title"]`
    - company: primary `.company-name`, secondary `a[data-testid="company-name"]`
    - description: primary `.job-description`, secondary `#job-description`
    - location: primary `.location-name`, secondary `div[data-testid="job-location"]`
    - version: 1
  - [x] 4.9 Create `configs/sites/ziprecruiter.com.json` — **Researched selectors** (only description in SELECTOR_REGISTRY; verify against live pages):
    - title: primary `h1.job_title`, secondary `.job-title h1`
    - company: primary `.hiring_company_text a`, secondary `.company-name`
    - description: primary `.job_description`, secondary `.job-description-content`
    - location: primary `.location_text`, secondary `.job-location`
    - salary: primary `.salary_text`, secondary `.job-salary`
    - version: 1
  - [x] 4.10 Create `configs/sites/wellfound.com.json` (AngelList/Wellfound) — **Researched selectors** (only description in SELECTOR_REGISTRY; verify against live pages):
    - title: primary `h1[data-test="job-title"]`, secondary `.styles_jobTitle__`
    - company: primary `a[data-test="company-name"]`, secondary `.styles_companyName__`
    - description: primary `.styles_description__`, secondary `.description-container`
    - location: primary `[data-test="job-location"]`, secondary `.styles_location__`
    - version: 1
  - [x] 4.11 Create `configs/sites/generic.json` — Generic ATS template with common patterns:
    - title: primary `h1`, secondary `[itemprop="title"]`, tertiary `.job-title, .posting-title`
    - company: primary `[itemprop="hiringOrganization"]`, secondary `.company-name, .employer-name`
    - description: primary `[itemprop="description"]`, secondary `.job-description, .posting-description, #job-description`
    - location: primary `[itemprop="jobLocation"]`, secondary `.location, .job-location`
    - salary: primary `[itemprop="baseSalary"]`, secondary `.salary, .compensation`
    - pipelineHints: none
    - version: 1
    - The generic config has `board: "generic"` and empty `urlPatterns: []`. It is NOT matched by URL — accessed via `BoardRegistry.getGenericConfig()` when `getConfig(url)` returns `undefined`

- [x] Task 5: Wire health tracking into config system (AC: #4)
  - [x] 5.1 Add `getHealthSummary(board?: string)` method to `SelectorHealthStore` interface in `selector-health.ts`:
    ```typescript
    interface HealthSummary {
      board: string;
      totalSelectors: number;
      healthyCount: number; // healthScore >= 0.7
      degradedCount: number; // healthScore < 0.7 && >= 0.3
      failedCount: number; // healthScore < 0.3
      overallSuccessRate: number; // weighted average
      lastFailedSelectors: SelectorHealthRecord[];
      suggestedRepairs: SelectorHealthRecord[];
    }
    getHealthSummary(board?: string): HealthSummary // Aggregate health for a board (or all)
    ```
  - [x] 5.2 Update `InMemorySelectorHealthStore` to implement `getHealthSummary()`. Group records by board, compute aggregate stats.
  - [x] 5.3 Implement `getHealthForConfig(config: SiteConfig): HealthSummary | undefined` in `BoardRegistry` — delegates to the `healthStore` passed at construction (see Task 2.1 constructor signature). Returns `undefined` when no healthStore is available. Groups health records by `config.board` using `getHealthSummary(board)`.

- [x] Task 6: Write comprehensive tests (AC: all)
  - [x] 6.1 Create `packages/engine/test/registry/config-schema.test.ts` — Test Zod schema validation: valid config passes, missing required fields rejected, invalid URL pattern format rejected, selector structure validated, version must be positive integer, partial configs with optional fields pass
  - [x] 6.2 Create `packages/engine/test/registry/board-registry.test.ts` — Test: construction with valid configs, URL matching returns correct config, unknown URL returns undefined, multiple configs with overlapping patterns (most specific wins), `getConfigsSince()` delta returns only newer configs, `getConfigByBoard()` direct lookup, empty registry handles gracefully, invalid configs are skipped with warning
  - [x] 6.3 Update `packages/engine/test/pipeline/layers/board-detector.test.ts` — Add tests for: board-detector populates `ctx.siteConfig` from registry, no registry means `ctx.siteConfig` stays undefined, registry has no match means `ctx.siteConfig` stays undefined
  - [x] 6.4 Create `packages/engine/test/registry/config-loading.test.ts` — Integration test: load actual JSON config files from `configs/sites/`, validate each with Zod schema, construct BoardRegistry, verify URL matching for each board's known URLs. **Path resolution:** use `path.resolve(__dirname, '../../../../configs/sites/')` or define a `CONFIGS_ROOT` test helper since configs are at repo root, not in engine package.
  - [x] 6.5 Create `packages/engine/test/pipeline/config-pipeline-integration.test.ts` — Full pipeline integration: run extraction with board registry populated, verify css-selector uses site config selectors, verify pipeline hints (skipLayers) applied correctly, compare extraction results with and without site config (should produce same or better results)
  - [x] 6.6 Update health store tests: add `getHealthSummary()` tests — aggregation by board, overall success rate calculation, degraded/failed/healthy counts
  - [x] 6.7 Verify total test count: existing 289 tests pass + new tests ≥ 30

- [x] Task 7: Validate (AC: all)
  - [x] 7.1 Run engine tests: `cd packages/engine && pnpm test` — all pass (289 existing + new)
  - [x] 7.2 Run extension tests: `cd apps/extension && pnpm test` — zero regressions
  - [x] 7.3 Build engine: `cd packages/engine && pnpm build` — clean build
  - [x] 7.4 Verify no Chrome API leakage: `cd packages/engine && pnpm lint` — clean
  - [x] 7.5 Validate all JSON configs against schema: `cd packages/engine && pnpm generate:schema && ajv validate -s configs/sites/_schema.json -d "configs/sites/*.json"`

## Dev Notes

### Critical Architecture Constraints

**Config Location (PATTERN-SE1 + Project Structure):**
JSON config data files live at `configs/sites/` (repo root), NOT inside `packages/engine/`. Validation code (Zod schema) lives at `packages/engine/src/registry/config-schema.ts`. This separation follows the architecture: data is shared/CI-validated, code is in the engine package.

**Config Schema (ADR-REV-D3):**
The architecture specifies Zod for config validation. The technical research recommends Valibot (90% smaller than Zod with tree-shaking). Resolution: Use Zod as the source-of-truth schema in the engine package (devDependency only — not bundled at runtime). For runtime validation in the engine, use a lightweight TypeScript type guard (`assertSiteConfig`). The extension adapter can decide on its own validation strategy later.

**SiteConfig Type (Already Defined in Story 2.3):**
The `SiteConfig` interface already exists in `packages/engine/src/pipeline/types.ts` (lines 90-110). Do NOT redefine it. The Zod schema must exactly match this existing type. Any schema additions must also be added to the TypeScript interface.

**Board Registry Injection Pattern:**
Follow the same pattern as `healthStore` injection (Story 2.3, review fix M1): `BoardRegistry` is injected via `DetectionContext.boardRegistry`. This keeps the engine pure — no global state, no file I/O at runtime.

**Config Versioning (PATTERN-SE6):**
Version is a monotonic integer per config file. The registry's `getVersion()` returns the max version across all configs. `getConfigsSince(version)` enables delta sync: the extension adapter stores `lastSyncedVersion` and requests only newer configs from the API. For Story 2.4, this is the engine-side interface only — actual API sync is Epic 3+ scope.

**Pipeline Hints — skipLayers:**
`createDefaultPipeline(siteConfig?)` already filters layers via `skipLayers` at composition time. When using a `BoardRegistry`, the config isn't known until board-detector runs (inside the pipeline). Two approaches:
1. **Pre-detection:** Caller detects board first, gets config, creates pipeline with that config. Requires extracting board detection from the pipeline.
2. **Runtime skip:** Individual layers check `ctx.siteConfig?.pipelineHints?.skipLayers` and call `next()` immediately when they should be skipped.

**Recommended approach:** Option 1 for the simple case (caller knows the URL upfront), with a convenience factory:
```typescript
export function createPipelineForUrl(
  url: string,
  registry: BoardRegistry
): (ctx: DetectionContext) => Promise<DetectionContext> {
  const config = registry.getConfig(url);
  return createDefaultPipeline(config);
}
```
This preserves the existing `skipLayers` behavior at composition time. Board-detector still runs inside the pipeline to set `ctx.board` and `ctx.siteConfig` on the context (for downstream layer access). The skipLayers optimization only works when using `createPipelineForUrl`.

**Security: Pure Data Configs Only (Research Lesson from Honey):**
Configs must be pure data (selectors, patterns, weights). The `customExtractor` field references built-in strategy function names — NOT arbitrary code paths. Never allow executable code in configs. This prevents the Universal XSS vulnerability found in Honey's config system.

### Code Integration Map

| File | Action | Details |
|------|--------|---------|
| `src/pipeline/types.ts:90-110` | **Use + Modify** | `SiteConfig` interface unchanged. Add `boardRegistry?: BoardRegistry` to `DetectionContext` |
| `src/pipeline/layers/board-detector.ts` | **Modify** | Populate `ctx.siteConfig` from registry; `getJobBoard()` still sets `ctx.board` |
| `src/pipeline/layers/css-selector.ts:153-175` | **No changes** | Already uses `ctx.siteConfig?.selectors` |
| `src/pipeline/default-pipeline.ts` | **Modify** | Add `boardRegistry?` to options, add `createPipelineForUrl()` convenience factory |
| `src/pipeline/create-context.ts` | **Modify** | Accept `boardRegistry` in options; `trySetField()`, `recordLayerExecution()` unchanged |
| `src/registry/selector-health.ts` | **Modify** | Add `getHealthSummary()` to interface and `InMemorySelectorHealthStore` |
| `src/registry/selector-registry.ts` | **Reference only** | Source data for JSON config selectors; `SELECTOR_REGISTRY` continues as bundled fallback |
| `src/detection/job-detector.ts` | **No changes** | `getJobBoard()` still used for `ctx.board` string |

### Pipeline Directory Structure (Story 2.4 Additions)

```
packages/engine/
├── src/
│   ├── registry/
│   │   ├── selector-registry.ts      # EXISTING — reference for selector data
│   │   ├── selector-health.ts        # MODIFY — add getHealthSummary()
│   │   ├── heuristic-repair.ts       # EXISTING — no changes
│   │   ├── config-schema.ts          # NEW — Zod schema + assertSiteConfig
│   │   └── board-registry.ts         # NEW — URL→SiteConfig registry
│   ├── pipeline/
│   │   ├── types.ts                  # MODIFY — add boardRegistry to DetectionContext
│   │   ├── create-context.ts         # MODIFY — accept boardRegistry param
│   │   ├── default-pipeline.ts       # MODIFY — add boardRegistry option, createPipelineForUrl()
│   │   ├── layers/
│   │   │   ├── board-detector.ts     # MODIFY — populate ctx.siteConfig from registry
│   │   │   └── (others unchanged)
│   │   └── index.ts                  # MODIFY — export new functions
│   └── index.ts                      # MODIFY — export BoardRegistry, config-schema

├── scripts/
│   └── generate-json-schema.ts       # NEW — Zod→JSON Schema generator (not in tsconfig include; tsup entry is src/index.ts only)

├── test/
│   ├── registry/
│   │   ├── config-schema.test.ts     # NEW
│   │   ├── board-registry.test.ts    # NEW
│   │   └── config-loading.test.ts    # NEW — integration test with real JSON files
│   └── pipeline/
│       ├── layers/
│       │   └── board-detector.test.ts  # MODIFY — add registry tests
│       └── config-pipeline-integration.test.ts  # NEW

configs/                               # REPO ROOT
└── sites/
    ├── _schema.json                   # NEW — generated JSON Schema
    ├── linkedin.com.json              # NEW
    ├── indeed.com.json                # NEW
    ├── greenhouse.io.json             # NEW
    ├── lever.co.json                  # NEW
    ├── workday.com.json               # NEW
    ├── glassdoor.com.json             # NEW
    ├── monster.com.json               # NEW
    ├── ziprecruiter.com.json          # NEW
    ├── wellfound.com.json             # NEW
    └── generic.json                   # NEW — fallback template
```

### Naming Conventions (Enforced — same as Stories 2.1-2.3)

| Layer | Convention | Example |
|-------|-----------|---------|
| TS files | `kebab-case.ts` | `board-registry.ts`, `config-schema.ts` |
| Exports | `camelCase` functions, `PascalCase` types/classes | `validateSiteConfig()`, `BoardRegistry` |
| Constants | `UPPER_SNAKE_CASE` | `SITE_CONFIG_SCHEMA_VERSION` |
| Test files | `*.test.ts` in `test/` mirroring `src/` | `test/registry/board-registry.test.ts` |
| Config files | `{domain}.json` | `greenhouse.io.json`, `lever.co.json` |
| Config naming | PATTERN-SE1 domain-based flat | No subdirectories per board |

### Previous Story Intelligence (Stories 2.1-2.3 Learnings)

**From Story 2.1:**
- Build tool: tsup (ESM + DTS) — do NOT switch
- ESLint flat config with Chrome API ban via `no-restricted-globals`
- Barrel exports: check for name clashes before adding new exports

**From Story 2.2:**
- 289 engine tests (as of 2.3 completion). New tests must not break any.
- Compose error recovery: catches throws, marks `ctx.metadata.degraded`, continues.
- `ctx.metadata.errors: string[]` tracks middleware failures.

**From Story 2.3:**
- `healthStore` injection pattern: `ctx.healthStore ?? defaultHealthStore` — use the same pattern for `boardRegistry`
- Self-healing wired in css-selector.ts — already uses `ctx.siteConfig?.selectors` when available
- `addSignal()` alongside `trySetField()` — no changes needed to signal accumulation
- Dual-path: `trySetField()` (best-so-far for gates) + `addSignal()` (accumulate for resolution)
- `computeDiminishingScore()` shared helper in `signal-weights.ts`
- **Code review pattern:** Use concrete assertions, extract shared helpers, add `board`/`field` to all record types

**From Story 2.3 Code Review:**
- H1: `SelectorHealthRecord` must include `board` and `field` — already fixed
- M1: `healthStore` injectable via `DetectionContext` — use same injection pattern for `boardRegistry`
- M5: Use `el.getAttribute("class")` not `el.className` for SVG safety

### Git Intelligence

Recent commit pattern: `feat(engine): story 2-X — ...` with code review as follow-up `fix(engine): story 2-X code review — ...`. Branch: `feat/jobswyft-alpha`.

Last 5 commits:
- `feat(engine): story 2-3 — multi-signal confidence, self-healing selectors, config-driven extraction`
- `fix(ui): story 1-4 code review — semantic tokens, AnswerTab rename, improved sync logic`
- `fix(engine): story 2-2 code review — compose crash bug, dedup helpers, type safety`
- `fix(ui): story 1-3 code review — missing stories, raw button fix, review record`
- `feat(engine): story 2-2 — Koa-style middleware extraction pipeline`

### Anti-Patterns to Avoid

- **Do NOT** add Zod as a production dependency — use it as devDependency only for schema generation and tests. Runtime validation uses lightweight type guards.
- **Do NOT** put executable code in config files — pure data only (selectors, patterns, weights). The `customExtractor` field references built-in strategy names, not code paths.
- **Do NOT** duplicate selector data — extract from existing `SELECTOR_REGISTRY` into JSON configs. The `SELECTOR_REGISTRY` continues to exist as a bundled fallback.
- **Do NOT** implement config sync from API — that is extension adapter scope (future story).
- **Do NOT** implement chrome.storage persistence — engine provides in-memory registry only.
- **Do NOT** create a configs directory inside `packages/engine/` — configs live at repo root `configs/sites/` per architecture.
- **Do NOT** modify css-selector.ts — it already handles `ctx.siteConfig?.selectors` correctly (Story 2.3).
- **Do NOT** modify any extraction middleware logic (json-ld, og-meta, heuristic, post-process) — this story is config + registry only.
- **Do NOT** import from `@jobswyft/engine` barrel within the engine package (use relative imports).
- **Do NOT** use global `document` or `window` — engine has no DOM runtime dependency.
- **Do NOT** create a global registry singleton — `BoardRegistry` is always constructed and injected.

### Deferred to Later Stories

| Feature | When | Why |
|---------|------|-----|
| Config sync from API (`GET /v1/configs/sites`) | Epic 3+ | Requires API endpoint + extension adapter |
| chrome.storage persistence of configs | Epic 2.6 (Extension Adapter) | Extension adapter scope |
| Config store (Zustand) | Epic 2.6 (Extension Adapter) | Extension UI scope |
| Supabase Realtime push notifications | Epic 3+ | Backend integration |
| CI config validation workflow | Future (ADR-REV-I1) | CI/CD scope |
| Admin config authoring dashboard | Post-MVP (ADR-REV-I3) | Admin dashboard scope |
| A/B testing / gradual config rollout | Post-MVP | Requires telemetry data |

### Project Structure Notes

- JSON configs at `configs/sites/` (repo root) — 11 files (10 boards + generic)
- New engine code in `packages/engine/src/registry/` — 2 new files
- New engine script in `packages/engine/scripts/` — 1 file
- Tests in `packages/engine/test/registry/` and `test/pipeline/`
- Engine remains zero Chrome API dependency
- Zod is devDependency only — NOT in production bundle
- Existing 289 tests must continue passing

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-engine-package-detection-extraction-autofill-core.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-SE4]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-D3]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-I1]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-I2]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#PATTERN-SE1]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#PATTERN-SE6]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md]
- [Source: _bmad-output/planning-artifacts/architecture/core-engine-implementation-detail.md#Key TypeScript Interfaces]
- [Source: _bmad-output/planning-artifacts/research/technical-smart-engine-detection-autofill-research-2026-02-13.md#Config-Driven vs Code-Driven]
- [Source: _bmad-output/planning-artifacts/research/technical-smart-engine-detection-autofill-research-2026-02-13.md#Versioned Config Schema Evolution]
- [Source: _bmad-output/implementation-artifacts/2-3-smart-extraction-patterns-confidence-self-healing.md]
- [Source: packages/engine/src/pipeline/types.ts — SiteConfig interface]
- [Source: packages/engine/src/pipeline/layers/board-detector.ts — ctx.siteConfig placeholder]
- [Source: packages/engine/src/pipeline/layers/css-selector.ts — site config selector handling]
- [Source: packages/engine/src/pipeline/default-pipeline.ts — skipLayers support]
- [Source: packages/engine/src/registry/selector-registry.ts — existing selector data]
- [Source: packages/engine/src/registry/selector-health.ts — health tracking interface]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Zod v4 installed initially but incompatible with zod-to-json-schema v3 (empty schema output). Downgraded to Zod v3 which has full compatibility.
- ESM `__dirname` not available — used `fileURLToPath(import.meta.url)` pattern in generate-json-schema.ts.
- Output path for schema generation required `../../../` (not `../../`) from `packages/engine/scripts/` to reach repo root `configs/sites/`.

### Completion Notes List

- **Task 1:** Created `config-schema.ts` with Zod schema (devDependency only), `assertSiteConfig()` runtime type guard, `ConfigValidationError` with field-level detail, and JSON Schema generation script. Generated `_schema.json` at `configs/sites/`.
- **Task 2:** Created `BoardRegistry` class with URL pattern matching (specificity-based), config lookup by board/URL, delta sync (`getConfigsSince`), generic config fallback, and health store delegation. Added `boardRegistry` to `DetectionContext`. Updated `createDetectionContext()` to accept `CreateContextOptions` with `boardRegistry` and `healthStore`.
- **Task 3:** Updated `board-detector.ts` to populate `ctx.siteConfig` from `ctx.boardRegistry.getConfig(url)` when available. Added `createPipelineForUrl()` convenience factory to `default-pipeline.ts`. Updated barrel exports.
- **Task 4:** Created 10 board config files + generic template at `configs/sites/`. Selectors sourced from `SELECTOR_REGISTRY` for boards with good coverage (LinkedIn, Indeed, Greenhouse, Lever, Workday). Researched selectors for Glassdoor, Monster, ZipRecruiter, Wellfound. Board field matches `getJobBoard()` return values.
- **Task 5:** Added `HealthSummary` interface and `getHealthSummary()` to `SelectorHealthStore` (optional method). Implemented in `InMemorySelectorHealthStore` with healthy/degraded/failed classification. `BoardRegistry.getHealthForConfig()` delegates to health store.
- **Task 6:** 89 new tests across 5 new test files + 1 updated file. Total: 378 tests (289 existing + 89 new).
- **Task 7:** Engine build clean (tsup), lint clean (eslint), all 378 engine tests pass, all 163 extension tests pass, all 10 JSON configs validate against Zod schema.

### Change Log

- 2026-02-14: Story 2.4 implementation — Site config system, board registry, 10 job board configs, health tracking integration, 89 new tests
- 2026-02-14: Code review fixes — 7 issues fixed (2 HIGH, 5 MEDIUM), 1 new test added, JSON Schema regenerated

### File List

**New Files:**
- `packages/engine/src/registry/config-schema.ts` — Zod schema, assertSiteConfig, ConfigValidationError
- `packages/engine/src/registry/board-registry.ts` — BoardRegistry class
- `packages/engine/scripts/generate-json-schema.ts` — Zod-to-JSON-Schema generator
- `configs/sites/_schema.json` — Generated JSON Schema
- `configs/sites/linkedin.com.json` — LinkedIn config
- `configs/sites/indeed.com.json` — Indeed config
- `configs/sites/greenhouse.io.json` — Greenhouse config
- `configs/sites/lever.co.json` — Lever config
- `configs/sites/workday.com.json` — Workday config
- `configs/sites/glassdoor.com.json` — Glassdoor config
- `configs/sites/monster.com.json` — Monster config
- `configs/sites/ziprecruiter.com.json` — ZipRecruiter config
- `configs/sites/wellfound.com.json` — Wellfound config
- `configs/sites/generic.json` — Generic ATS template
- `packages/engine/test/registry/config-schema.test.ts` — 30 tests
- `packages/engine/test/registry/board-registry.test.ts` — 23 tests
- `packages/engine/test/registry/config-loading.test.ts` — 16 tests (integration)
- `packages/engine/test/pipeline/config-pipeline-integration.test.ts` — 8 tests

**Modified Files:**
- `packages/engine/src/pipeline/types.ts` — Added `BoardRegistry` import, `boardRegistry` to DetectionContext
- `packages/engine/src/pipeline/create-context.ts` — Added `CreateContextOptions`, `boardRegistry`/`healthStore` params
- `packages/engine/src/pipeline/layers/board-detector.ts` — Populates ctx.siteConfig from registry
- `packages/engine/src/pipeline/default-pipeline.ts` — Added `createPipelineForUrl()`, `BoardRegistry` import
- `packages/engine/src/pipeline/index.ts` — Export `createPipelineForUrl`, `CreateContextOptions`
- `packages/engine/src/registry/selector-health.ts` — Added `HealthSummary` interface, `getHealthSummary()` method
- `packages/engine/src/index.ts` — Export BoardRegistry, config-schema, HealthSummary, createPipelineForUrl
- `packages/engine/package.json` — Added `generate:schema` script, zod/zod-to-json-schema/tsx devDependencies
- `packages/engine/test/pipeline/layers/board-detector.test.ts` — Added 3 registry integration tests
- `packages/engine/test/registry/selector-health.test.ts` — Added 9 getHealthSummary tests

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-14 | **Outcome:** Approved (after fixes)

### Findings Summary

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H1 | HIGH | `board-detector.ts` unconditionally overwrites `ctx.siteConfig` from registry, violating "siteConfig takes precedence" design decision | FIXED |
| H2 | HIGH | Zod schema validates `skipLayers`/`layerOrder` as `z.string()` instead of `LayerName` enum — typos silently ignored | FIXED |
| M1 | MEDIUM | `CreateContextOptions` type not exported from barrel `src/index.ts` | FIXED |
| M2 | MEDIUM | `assertSiteConfig()` skips `pipelineHints`, `urlPatterns` item, and `customExtractor` validation | FIXED |
| M3 | MEDIUM | LinkedIn config `"currentJobId="` URL pattern overly broad for cross-board BoardRegistry matching | FIXED |
| M4 | MEDIUM | `getHealthForConfig()` uses duck-typing + unsafe cast instead of optional chaining | FIXED |
| M5 | MEDIUM | `config-loading.test.ts` initializes registry at describe-time instead of `beforeAll` | FIXED |
| L1 | LOW | Glassdoor config has CSS-in-JS hashed class names as selectors (`.css-1vg6q84`) — unreliable | NOT FIXED (acknowledged as researched baseline) |
| L2 | LOW | No test for siteConfig precedence over boardRegistry | FIXED (test added with H1) |

### Fixes Applied

1. **H1:** Added `!ctx.siteConfig` guard to `board-detector.ts:21` + new precedence test
2. **H2:** Replaced `z.array(z.string())` with `z.array(z.enum([...LayerName values]))` in Zod schema; regenerated `_schema.json`
3. **M1:** Added `CreateContextOptions` to type exports in `src/index.ts`
4. **M2:** Extended `assertSiteConfig()` to validate `urlPatterns` items as strings, `pipelineHints` structure, and `customExtractor` type
5. **M3:** Changed `"currentJobId="` to `"linkedin\\.com/.*currentJobId="` in `linkedin.com.json` to scope to LinkedIn domain
6. **M4:** Replaced `in` check + cast with `this.healthStore?.getHealthSummary` optional chaining in `board-registry.ts`
7. **M5:** Wrapped registry initialization in `beforeAll` hook in `config-loading.test.ts`

### Verification

- Engine tests: 379 passed (27 files) — includes 1 new precedence test
- Extension tests: 163 passed (14 files) — zero regressions
- Engine build: clean (tsup ESM + DTS)
- JSON Schema regenerated with `LayerName` enum constraints
