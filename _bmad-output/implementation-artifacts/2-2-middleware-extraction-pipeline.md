# Story 2.2: Middleware Extraction Pipeline

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a Koa-style middleware extraction pipeline with a shared `DetectionContext` and inline confidence gates,
So that extraction is modular, composable, and can short-circuit early when confidence is high enough.

## Acceptance Criteria

1. **DetectionContext type and middleware signature exist**
   - `DetectionContext` contains: URL, raw DOM (`Document`), extracted fields (per-field value + source + confidence), overall completeness score, pipeline metadata, site config hints, and extraction trace
   - Each middleware layer is `(ctx: DetectionContext, next: () => Promise<void>) => Promise<void>`
   - Layers can read/write the context and call `next()` to continue the chain

2. **Full pipeline chain executes in correct order**
   - Layers execute in order: BoardDetector -> JsonLd -> Gate(0.85) -> CssSelector -> Gate(0.75) -> OgMeta -> Heuristic -> Gate(0.70) -> AiFallback -> PostProcess
   - Inline confidence gates check `ctx.completeness` and skip remaining layers when threshold is met
   - Pipeline returns the final `DetectionContext` with extracted fields and confidence scores

3. **High-confidence extraction short-circuits**
   - When JSON-LD provides title + company + description (e.g., LinkedIn), Gate(0.85) fires
   - CssSelector, OgMeta, Heuristic, and AiFallback are NOT executed
   - Extraction completes in under 500ms

4. **Low-confidence extraction runs all layers**
   - On unknown job boards, all layers execute in sequence
   - Each layer adds confidence signals to fields it can extract
   - AiFallback is reached only when completeness remains below 0.70 after Heuristic
   - PostProcess normalizes and validates final data

5. **15+ tests cover pipeline behavior**
   - Full pipeline execution (high-confidence + low-confidence paths)
   - Each gate threshold (0.85, 0.75, 0.70) with short-circuit verification
   - Layer ordering enforcement
   - Error handling: layer throws -> pipeline continues with degraded confidence
   - Individual layer behavior (board detection, JSON-LD parsing, CSS extraction, OG meta, post-processing)

## Tasks / Subtasks

- [x] Task 1: Define pipeline types (AC: #1)
  - [x] 1.1 Create `packages/engine/src/pipeline/types.ts` with `LayerName`, `DetectionContext`, `FieldExtraction`, `ExtractionMiddleware`, `ExtractionTrace`, `FieldTrace`, `TraceAttempt`, `SiteConfig` types. `FieldExtraction.source` must be typed as `ExtractionSource` (import from `../scoring/extraction-validator`)
  - [x] 1.2 Update `packages/engine/tsconfig.json` — add `"DOM"` to `lib` array (needed for `Document` type in DetectionContext)
  - [x] 1.3 Update `packages/engine/eslint.config.js` — add `document` and `window` to `no-restricted-globals` (allow DOM types but ban global access)
  - [x] 1.4 Create `packages/engine/src/pipeline/create-context.ts` — factory function `createDetectionContext(url: string, dom: Document): DetectionContext` with zeroed fields and fully initialized ExtractionTrace (see Dev Notes for exact initializer)
  - [x] 1.5 Export pipeline types from `packages/engine/src/pipeline/index.ts` barrel
  - [x] 1.6 Re-export from root `packages/engine/src/index.ts`

- [x] Task 2: Implement Koa-style compose function (AC: #1, #2)
  - [x] 2.1 Create `packages/engine/src/pipeline/compose.ts` — `compose(middlewares: ExtractionMiddleware[]): (ctx: DetectionContext) => Promise<DetectionContext>`. Record `Date.now()` at pipeline start, set `ctx.trace.totalTimeMs = Date.now() - start` after all middleware complete
  - [x] 2.2 Implement onion-model execution: each middleware receives `ctx` + `next`, calling `next()` runs the next middleware
  - [x] 2.3 Handle errors: if a middleware throws, catch the error, log it to `ctx.trace`, set `ctx.metadata.degraded = true`, and continue to `next()`
  - [x] 2.4 Return the mutated `ctx` after all middleware complete (or short-circuit)

- [x] Task 3: Implement confidence gate middleware (AC: #2, #3, #4)
  - [x] 3.1 Create `packages/engine/src/pipeline/layers/confidence-gate.ts` — `createConfidenceGate(threshold: number): ExtractionMiddleware`
  - [x] 3.2 Gate reads `ctx.completeness`, skips `next()` if threshold met, records gate decision in `ctx.trace`
  - [x] 3.3 Gate must record: `{ gate: threshold, completeness: ctx.completeness, action: 'short-circuit' | 'continue' }` in trace metadata

- [x] Task 4: Implement extraction middleware layers (AC: #2, #3, #4)
  - [x] 4.1 Create `packages/engine/src/pipeline/layers/board-detector.ts` — Calls existing `getJobBoard(ctx.url)` from `detection/job-detector.ts`, sets `ctx.board`. Sets `ctx.siteConfig = undefined` (placeholder — full site config loading deferred to Story 2.4)
  - [x] 4.2 Create `packages/engine/src/pipeline/layers/json-ld.ts` — Queries `ctx.dom` for `<script type="application/ld+json">`, parses JobPosting schema, extracts title/company/description/location/salary/employmentType, sets per-field confidence 0.95, recomputes `ctx.completeness` via `updateCompleteness(ctx)`
  - [x] 4.3 Create `packages/engine/src/pipeline/layers/css-selector.ts` — Filters `SELECTOR_REGISTRY` by `ctx.board` + `mode: "read"`, queries `ctx.dom` for each field's selectors in priority order, sets per-field confidence 0.85 (board-specific) or 0.60 (generic), recomputes `ctx.completeness` via `updateCompleteness(ctx)`
  - [x] 4.4 Create `packages/engine/src/pipeline/layers/og-meta.ts` — Extracts `<meta property="og:title">`, `<meta property="og:description">` from `ctx.dom`, sets confidence 0.40, recomputes `ctx.completeness` via `updateCompleteness(ctx)`
  - [x] 4.5 Create `packages/engine/src/pipeline/layers/heuristic.ts` — Pattern-match common heading structures (h1/h2 near job keywords), expand `<details>` elements, extract CSS-hidden content, confidence 0.30, recomputes `ctx.completeness` via `updateCompleteness(ctx)`
  - [x] 4.6 Create `packages/engine/src/pipeline/layers/ai-fallback.ts` — **Stub only for Story 2.2**: sets `ctx.trace.aiTriggered = true`, does NOT call any AI API (deferred to later stories), calls `next()`
  - [x] 4.7 Create `packages/engine/src/pipeline/layers/post-process.ts` — Trim whitespace, decode HTML entities, validate title+company required (using existing `validateExtraction()` — see Dev Notes for data transformation pattern from `ctx.fields` to flat maps), compute final `ctx.completeness` via `updateCompleteness(ctx)`

- [x] Task 5: Assemble default pipeline (AC: #2)
  - [x] 5.1 Create `packages/engine/src/pipeline/default-pipeline.ts` — Exports `createDefaultPipeline(): (ctx: DetectionContext) => Promise<DetectionContext>` composing: BoardDetector -> JsonLd -> Gate(0.85) -> CssSelector -> Gate(0.75) -> OgMeta -> Heuristic -> Gate(0.70) -> AiFallback -> PostProcess
  - [x] 5.2 Create `packages/engine/src/pipeline/layers/index.ts` — barrel re-export all layer factories. Update `packages/engine/src/pipeline/index.ts` — barrel export all layers (via layers barrel), compose, createDefaultPipeline, types, helpers (updateCompleteness, recordLayerExecution, createDetectionContext)
  - [x] 5.3 Update root `packages/engine/src/index.ts` — re-export pipeline module

- [x] Task 6: Write comprehensive tests (AC: #5)
  - [x] 6.1 Create `packages/engine/test/pipeline/compose.test.ts` — Test compose ordering, async execution, error recovery, empty middleware array
  - [x] 6.2 Create `packages/engine/test/pipeline/confidence-gate.test.ts` — Test each threshold (0.85, 0.75, 0.70), short-circuit behavior, trace recording
  - [x] 6.3 Create `packages/engine/test/pipeline/pipeline-integration.test.ts` — Test full pipeline with HTML fixtures: LinkedIn (JSON-LD short-circuits at Gate 0.85), unknown board (all layers execute), partial data (runs through heuristic)
  - [x] 6.4 Create `packages/engine/test/pipeline/layers/json-ld.test.ts` — Test JobPosting parsing, nested JSON-LD, missing fields, malformed JSON
  - [x] 6.5 Create `packages/engine/test/pipeline/layers/css-selector.test.ts` — Test board-specific selectors, generic fallback, no-match behavior
  - [x] 6.6 Create `packages/engine/test/pipeline/layers/og-meta.test.ts` — Test og:title/description extraction, missing meta tags
  - [x] 6.7 Create `packages/engine/test/pipeline/layers/post-process.test.ts` — Test normalization, validation (title+company required), completeness calculation
  - [x] 6.8 Create `packages/engine/test/pipeline/layers/board-detector.test.ts` — Test getJobBoard() delegation, ctx.board assignment, site config hint lookup
  - [x] 6.9 Create `packages/engine/test/pipeline/layers/heuristic.test.ts` — Test heading pattern extraction, details expansion, CSS-hidden content
  - [x] 6.10 Create `packages/engine/test/pipeline/layers/ai-fallback.test.ts` — Test stub behavior: aiTriggered set, trace recorded, next() called, no external API
  - [x] 6.11 Verify total test count >= 15 across all pipeline test files (73 tests across 10 files)

- [x] Task 7: Validate (AC: all)
  - [x] 7.1 Run engine tests: `cd packages/engine && pnpm test` — all 190 pass (117 existing + 73 new)
  - [x] 7.2 Run extension tests: `cd apps/extension && pnpm test` — zero regressions (123 tests)
  - [x] 7.3 Build engine: `cd packages/engine && pnpm build` — clean build (40KB ESM + 19KB DTS)
  - [x] 7.4 Verify no Chrome API leakage: `cd packages/engine && pnpm lint` — clean

## Dev Notes

### Critical Architecture Constraints

**Koa-Style Middleware Pattern (ADR-REV-SE5 — MANDATORY):**
The pipeline uses the Koa onion model. Each middleware receives `(ctx, next)`. Calling `next()` delegates to the next middleware. NOT calling `next()` short-circuits the chain (this is how confidence gates work). The compose function must handle the onion model correctly — middleware can run code before AND after `next()`, enabling timing/tracing in the same middleware.

**DetectionContext Interface (from architecture):**
```typescript
// Import ExtractionSource from '../scoring/extraction-validator'
import type { ExtractionSource } from '../scoring/extraction-validator';

interface FieldExtraction {
  value: string;
  source: ExtractionSource;  // "json-ld" | "css-board" | "css-generic" | "og-meta" | "heuristic" | "ai-llm"
  confidence: number;        // 0-1 float (PATTERN-SE5)
}

interface DetectionContext {
  url: string;
  dom: Document;                    // Parsed DOM — from JSDOM in tests, real DOM in extension
  board: string | null;             // "linkedin" | "indeed" | "greenhouse" | null
  fields: {
    title?: FieldExtraction;
    company?: FieldExtraction;
    description?: FieldExtraction;
    location?: FieldExtraction;
    salary?: FieldExtraction;
    employmentType?: FieldExtraction;
  };
  completeness: number;             // 0-1 weighted average (title:0.25, company:0.25, desc:0.35, location:0.10, salary:0.05)
  trace: ExtractionTrace;
  siteConfig?: SiteConfig;          // Optional — set by BoardDetector if board matched
  metadata: Record<string, unknown>; // Extensible pipeline metadata (gate decisions, timing, etc.)
}
```

**ExtractionMiddleware Signature:**
```typescript
type ExtractionMiddleware = (ctx: DetectionContext, next: () => Promise<void>) => Promise<void>;
```

**Completeness Scoring Weights (from existing extraction-validator.ts):**
| Field | Weight |
|-------|--------|
| title | 0.25 |
| company | 0.25 |
| description | 0.35 |
| location | 0.10 |
| salary | 0.05 |

Completeness = sum of (weight * field_confidence) for all populated fields. Reuse the existing `computeCompleteness()` logic from `packages/engine/src/scoring/extraction-validator.ts` — do NOT reimplement.

**Completeness Update Rule (CRITICAL — gates depend on this):**
Every extraction layer that writes to `ctx.fields` MUST recompute `ctx.completeness` afterwards. Without this, confidence gates always see completeness = 0 and never short-circuit — silently defeating the entire pipeline optimization.

The existing `computeCompleteness(data, confidenceMap)` takes flat maps (`Record<string, string | undefined>` + `Record<string, number>`), but `ctx.fields` uses `{ title?: FieldExtraction; ... }`. Create a shared helper in `create-context.ts`:
```typescript
// updateCompleteness(ctx) — call after any layer writes fields
export function updateCompleteness(ctx: DetectionContext): void {
  const data: Record<string, string | undefined> = {};
  const confidenceMap: Record<string, number> = {};
  for (const [field, extraction] of Object.entries(ctx.fields)) {
    if (extraction) {
      data[field] = extraction.value;
      confidenceMap[field] = extraction.confidence;
    }
  }
  ctx.completeness = computeCompleteness(data, confidenceMap);
}
```
Each extraction layer (JsonLd, CssSelector, OgMeta, Heuristic) and PostProcess must call `updateCompleteness(ctx)` after modifying fields.

**`createDetectionContext` Factory (exact initializer):**
```typescript
export function createDetectionContext(url: string, dom: Document): DetectionContext {
  return {
    url,
    dom,
    board: null,
    fields: {},
    completeness: 0,
    trace: {
      fields: [],
      board: null,
      url,
      timestamp: Date.now(),
      totalTimeMs: 0,
      layersExecuted: [],
      gateDecisions: [],
      aiTriggered: false,
      completeness: 0,
    },
    metadata: {},
  };
}
```

**PostProcess `validateExtraction()` Adapter Pattern:**
PostProcess must transform `ctx.fields` into the flat format expected by `validateExtraction()`:
```typescript
// In post-process.ts — build flat maps for validateExtraction()
const data: Record<string, string | undefined> = {};
const sources: Record<string, ExtractionSource> = {};
for (const [field, extraction] of Object.entries(ctx.fields)) {
  if (extraction) {
    data[field] = extraction.value;
    sources[field] = extraction.source;
  }
}
const result = validateExtraction(data, sources);
// Use result.isValid, result.issues for validation reporting in trace
```

**`recordLayerExecution` Helper (standardize trace recording):**
Each layer must push its name to `ctx.trace.layersExecuted`. Use a shared helper in `create-context.ts`:
```typescript
export function recordLayerExecution(ctx: DetectionContext, layer: LayerName): void {
  ctx.trace.layersExecuted.push(layer);
}
```

**Confidence Scores Per Layer (ADR-REV-SE2):**
| Layer | Confidence | Signal Source |
|-------|-----------|---------------|
| JSON-LD | 0.95 | `<script type="application/ld+json">` structured data |
| CSS Selector (board-specific) | 0.85 | Selectors from SELECTOR_REGISTRY with board match |
| CSS Selector (generic) | 0.60 | Generic fallback selectors |
| OG Meta | 0.40 | `<meta property="og:*">` tags |
| Heuristic | 0.30 | Text patterns, heading structures |
| AI Fallback | 0.90 | LLM extraction (STUB in this story) |

**Field Override Rule:** A layer should only write to `ctx.fields[field]` if:
1. The field is NOT already set, OR
2. The new extraction has HIGHER confidence than the existing one

This prevents low-confidence layers from overwriting high-confidence extractions.

**ExtractionTrace Interface (ADR-REV-D2):**
```typescript
type LayerName = "board-detector" | "json-ld" | "css" | "og-meta" | "heuristic" | "ai-fallback" | "post-process";

interface TraceAttempt {
  layer: LayerName;
  attempted: true;
  matched: boolean;
  field?: string;          // Which field this attempt targeted
  selectorId?: string;     // Registry selector ID (e.g., "li-title-unified-v3") — for selector health tracking
  selector?: string;       // CSS selector used (for css layer)
  rawValue?: string;
  cleanedValue?: string;
  accepted: boolean;
  rejectionReason?: string;
}

interface FieldTrace {
  field: string;
  finalValue: string;
  finalSource: string;
  attempts: TraceAttempt[];
}

interface ExtractionTrace {
  fields: FieldTrace[];
  board: string | null;
  url: string;
  timestamp: number;
  totalTimeMs: number;
  layersExecuted: string[];  // Track which layers ran (for verifying short-circuit)
  gateDecisions: Array<{ gate: number; completeness: number; action: 'short-circuit' | 'continue' }>;
  aiTriggered: boolean;
  completeness: number;
}
```

**SiteConfig Placeholder (full definition in Story 2.4):**
```typescript
interface SiteConfig {
  board: string;
  urlPatterns: string[];
  pipelineHints?: Record<string, unknown>;
}
```

### DOM Type Configuration (tsconfig change)

Story 2-1 intentionally omitted `"DOM"` from engine tsconfig lib to enforce zero browser API usage. Story 2.2 requires `"DOM"` because `DetectionContext.dom` is type `Document` and layers use `dom.querySelectorAll()`, `dom.querySelector()`.

**Required change to `packages/engine/tsconfig.json`:**
```json
"lib": ["ES2020", "DOM"]
```

**Chrome API ban enforcement after DOM addition:**
- ESLint `no-restricted-globals` already bans `chrome` and `browser`
- ADD `document` and `window` to banned globals — the pipeline must ONLY access DOM through `ctx.dom`, never global `document`/`window`
- The `Document` TYPE is fine (it's a parameter type), but the global `document` VARIABLE is banned

### Reuse Existing Engine Functions

These functions from Story 2-1 MUST be reused, not reimplemented:

| Function | Location | Usage in Pipeline |
|----------|----------|-------------------|
| `getJobBoard(url)` | `src/detection/job-detector.ts` | BoardDetector layer sets `ctx.board` |
| `detectJobPage(url)` | `src/detection/job-detector.ts` | Optional: verify URL is a job page |
| `SELECTOR_REGISTRY` | `src/registry/selector-registry.ts` | CssSelector layer queries DOM using registry selectors |
| `validateExtraction()` | `src/scoring/extraction-validator.ts` | PostProcess layer validates final data |
| `computeCompleteness()` | `src/scoring/extraction-validator.ts` | Gate layers + PostProcess compute completeness |

**Import pattern:** Import from sibling modules using relative paths within the engine package (e.g., `import { getJobBoard } from '../detection/job-detector'`). Do NOT import from `@jobswyft/engine` barrel within the engine package itself (circular dependency risk).

### AiFallback Layer — Stub Only

The AiFallback layer in Story 2.2 is a **stub**. It must:
1. Set `ctx.trace.aiTriggered = true`
2. Record a trace attempt: `{ layer: 'ai-fallback', attempted: true, matched: false, accepted: false, rejectionReason: 'stub-not-implemented' }`
3. Call `next()` to continue to PostProcess
4. NOT call any external API, NOT import any HTTP/fetch libraries

The real AI implementation requires API integration and rate limiting (50/user/day) — deferred to a later story.

### JSON-LD Parsing Details

The JsonLd layer must handle:
1. Multiple `<script type="application/ld+json">` blocks on a page (iterate all)
2. `@type: "JobPosting"` — direct match
3. `@graph` arrays — search for JobPosting within the graph
4. Nested `@type` — `hiringOrganization.name` for company
5. Field mapping: `title` -> ctx.fields.title, `hiringOrganization.name` -> ctx.fields.company, `description` -> ctx.fields.description, `jobLocation.address.addressLocality` -> ctx.fields.location, `baseSalary` or `estimatedSalary` -> ctx.fields.salary, `employmentType` -> ctx.fields.employmentType
6. Malformed JSON — catch parse errors, log to trace, continue pipeline

### CSS Selector Layer Details

The CssSelector layer must:
1. Filter `SELECTOR_REGISTRY` by `ctx.board` (exact match) + `mode: "read"` or `mode: "both"` or `mode: undefined` (undefined defaults to "read")
2. If no board match, use entries where `board === "generic"`
3. For each field, try selectors in priority order (lower priority number = tried first)
4. Use `ctx.dom.querySelector(selector)` — extract `textContent` or `innerText`
5. Only write to `ctx.fields[field]` if not already set by a higher-confidence layer
6. Set confidence 0.85 for board-specific selectors, 0.60 for generic

### Testing with JSDOM

Tests use JSDOM (already configured in `vitest.config.ts` with `environment: 'jsdom'`).

**HTML fixture pattern for tests:**
```typescript
function createDom(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

// Or using JSDOM directly:
import { JSDOM } from 'jsdom';
const dom = new JSDOM(html);
const document = dom.window.document;
```

**Preferred approach:** Use `new DOMParser().parseFromString()` since vitest with jsdom environment provides this globally. Do NOT import JSDOM directly unless DOMParser is insufficient.

**Test fixture examples needed:**
1. LinkedIn-style HTML with JSON-LD JobPosting (high-confidence, should short-circuit at Gate 0.85)
2. Generic job page with only CSS-matchable elements (medium confidence, should pass Gate 0.85 but short-circuit at Gate 0.75)
3. Bare-bones job page with only OG meta tags (low confidence, should reach Heuristic)
4. Unknown page with minimal structure (very low confidence, should reach AiFallback)

### Pipeline Directory Structure (Story 2.2 additions)

```
packages/engine/
├── src/
│   ├── pipeline/                     # NEW — all pipeline code
│   │   ├── types.ts                  # DetectionContext, FieldExtraction, ExtractionTrace, etc.
│   │   ├── compose.ts                # Koa-style compose function
│   │   ├── create-context.ts         # Factory: createDetectionContext(url, dom)
│   │   ├── default-pipeline.ts       # createDefaultPipeline() factory
│   │   ├── layers/
│   │   │   ├── board-detector.ts
│   │   │   ├── json-ld.ts
│   │   │   ├── css-selector.ts
│   │   │   ├── og-meta.ts
│   │   │   ├── heuristic.ts
│   │   │   ├── ai-fallback.ts
│   │   │   ├── post-process.ts
│   │   │   └── index.ts              # Layers barrel re-exports
│   │   └── index.ts                  # Pipeline barrel exports
│   ├── detection/                    # EXISTING — no changes
│   ├── extraction/                   # EXISTING — no changes
│   ├── registry/                     # EXISTING — no changes
│   ├── scoring/                      # EXISTING — no changes
│   ├── types/                        # EXISTING — no changes
│   └── index.ts                      # MODIFY — add pipeline re-exports
├── test/
│   ├── pipeline/                     # NEW — pipeline tests
│   │   ├── compose.test.ts
│   │   ├── confidence-gate.test.ts
│   │   ├── pipeline-integration.test.ts
│   │   └── layers/
│   │       ├── board-detector.test.ts
│   │       ├── json-ld.test.ts
│   │       ├── css-selector.test.ts
│   │       ├── og-meta.test.ts
│   │       ├── heuristic.test.ts
│   │       ├── ai-fallback.test.ts
│   │       └── post-process.test.ts
│   ├── detection/                    # EXISTING — no changes
│   ├── extraction/                   # EXISTING — no changes
│   ├── registry/                     # EXISTING — no changes
│   ├── scoring/                      # EXISTING — no changes
│   └── types/                        # EXISTING — no changes
```

### Naming Conventions (Enforced — same as Story 2-1)

| Layer | Convention | Example |
|-------|-----------|---------|
| TS files | `kebab-case.ts` | `confidence-gate.ts`, `json-ld.ts` |
| Exports | `camelCase` functions, `PascalCase` types | `createDefaultPipeline()`, `DetectionContext` |
| Constants | `UPPER_SNAKE_CASE` | `FIELD_WEIGHTS`, `DEFAULT_GATE_THRESHOLDS` |
| Test files | `*.test.ts` in `test/` mirroring `src/` | `test/pipeline/compose.test.ts` |

### Project Structure Notes

- **Architecture deviation (intentional):** The architecture reference (`core-engine-implementation-detail.md`) places extraction layers in `src/extraction/` alongside `frame-aggregator.ts`, with only infrastructure in `src/pipeline/`. This story groups all pipeline code (infrastructure + layers) under `src/pipeline/` for self-contained modularity. This is intentional — `extraction/` remains for non-pipeline utilities like frame aggregation.
- All new code goes in `packages/engine/src/pipeline/` — do NOT modify existing modules in `detection/`, `extraction/`, `registry/`, `scoring/`, `types/` (only import from them)
- The only existing files modified are: `tsconfig.json` (add DOM lib), `eslint.config.js` (add restricted globals), `src/index.ts` (add pipeline re-exports)
- Engine remains zero Chrome API dependency — DOM types are for parameter typing, not global access
- Build output: `packages/engine/dist/` includes new pipeline exports

### Anti-Patterns to Avoid

- **Do NOT** reimplement completeness scoring — reuse `computeCompleteness()` from `extraction-validator.ts`
- **Do NOT** reimplement job board detection — reuse `getJobBoard()` from `job-detector.ts`
- **Do NOT** use global `document` or `window` — always access DOM through `ctx.dom` parameter
- **Do NOT** implement real AI fallback — the layer is a stub in this story
- **Do NOT** create site config JSON files — those are Story 2.4 scope
- **Do NOT** implement self-healing selectors — that is Story 2.3 scope
- **Do NOT** implement autofill field detection — that is Story 2.5 scope
- **Do NOT** modify any extension code — this story is 100% within `packages/engine/`
- **Do NOT** import from `@jobswyft/engine` barrel within the engine package (use relative imports to avoid circular deps)
- **Do NOT** skip trace recording — every layer must log its attempts to `ctx.trace` for debuggability

### Previous Story Intelligence (2-1 Learnings)

From Story 2-1 implementation:
- **Build tool:** tsup (ESM + DTS) — clean 22KB output. Do NOT switch to Vite or tsc.
- **Test count:** 117 engine tests + 123 extension tests. New pipeline tests must not break any of these.
- **Barrel export aliases:** `computeFieldConfidence` is aliased as `computeExtractionFieldConfidence` (from extraction-validator) and `computeSignalFieldConfidence` (from signal-weights) to avoid naming collision. Be aware of these aliases when importing scoring functions.
- **ESLint config:** Uses flat config format (`eslint.config.js`), `@typescript-eslint/parser`. Chrome API ban via `no-restricted-globals: ["error", "chrome", "browser"]`.
- **FrameResult abstraction:** The engine already abstracts Chrome types — `FrameResult` replaces `chrome.scripting.InjectionResult[]`. Follow this same abstraction principle for any new types.
- **SelectorEntry mode field:** Added `mode: "read" | "write" | "both"` in code review. The CssSelector layer should filter by `mode: "read"` or `mode: "both"`.
- **Code review fixes applied:** ESLint Chrome API ban fix, doc comments on aliased exports, mode field on SelectorEntry. Standards are high — expect similar review scrutiny.

### Git Intelligence

Recent commit pattern: `feat(engine): story 2-1 — ...` with code review as a follow-up. Follow the same convention for this story. The branch is `feat/jobswyft-alpha`.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-engine-package-detection-extraction-autofill-core.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture/core-engine-implementation-detail.md#Extraction Pipeline]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-SE5]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-SE2]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#ADR-REV-D2]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#PATTERN-SE5]
- [Source: _bmad-output/implementation-artifacts/2-1-engine-package-scaffold-scan-engine-extraction.md — previous story]
- [Source: packages/engine/src/scoring/extraction-validator.ts — completeness scoring]
- [Source: packages/engine/src/detection/job-detector.ts — board detection]
- [Source: packages/engine/src/registry/selector-registry.ts — CSS selector registry]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1:** Defined all pipeline types (DetectionContext, FieldExtraction, ExtractionMiddleware, ExtractionTrace, etc.) in `types.ts`. Created factory function `createDetectionContext()` and helpers `updateCompleteness()`, `recordLayerExecution()` in `create-context.ts`. Added DOM lib to tsconfig, banned `document`/`window` globals in ESLint. All barrel exports wired.
- **Task 2:** Implemented Koa-style `compose()` with onion-model execution, error recovery (catches, marks degraded, continues), and timing in trace. 8 tests.
- **Task 3:** Implemented `createConfidenceGate(threshold)` — reads `ctx.completeness`, skips `next()` if threshold met, records gate decisions in trace. 7 tests.
- **Task 4:** Implemented all 7 extraction layers:
  - `boardDetector` — delegates to existing `getJobBoard()`, sets ctx.board
  - `jsonLd` — parses `<script type="application/ld+json">`, handles @graph, nested org, salary ranges, employment type arrays
  - `cssSelector` — filters SELECTOR_REGISTRY by board+mode, queries DOM in priority order, board-specific (0.85) vs generic (0.60) confidence
  - `ogMeta` — extracts og:title and og:description at 0.40 confidence
  - `heuristic` — h1 title extraction, main/details content, heading patterns at 0.30 confidence
  - `aiFallback` — stub: sets aiTriggered, records trace, calls next()
  - `postProcess` — HTML entity decoding, whitespace normalization, validateExtraction(), final completeness
- **Task 5:** Assembled default pipeline: BoardDetector → JsonLd → Gate(0.85) → CssSelector → Gate(0.75) → OgMeta → Heuristic → Gate(0.70) → AiFallback → PostProcess. All barrel exports wired from layers/index.ts → pipeline/index.ts → root index.ts.
- **Task 6:** 73 tests across 10 test files covering compose, gates, all layers, and full pipeline integration (LinkedIn short-circuit, unknown board full run, partial data, ordering enforcement, error resilience).
- **Task 7:** All 190 engine tests pass (117 existing + 73 new). 123 extension tests pass (zero regressions). Clean build (40KB ESM). Lint clean.

### Change Log

- 2026-02-14: Story 2.2 implementation complete — Koa-style middleware extraction pipeline with 7 layers, 3 confidence gates, and 73 tests.

### File List

**New files:**
- `packages/engine/src/pipeline/types.ts`
- `packages/engine/src/pipeline/create-context.ts`
- `packages/engine/src/pipeline/compose.ts`
- `packages/engine/src/pipeline/default-pipeline.ts`
- `packages/engine/src/pipeline/index.ts`
- `packages/engine/src/pipeline/layers/index.ts`
- `packages/engine/src/pipeline/layers/board-detector.ts`
- `packages/engine/src/pipeline/layers/json-ld.ts`
- `packages/engine/src/pipeline/layers/css-selector.ts`
- `packages/engine/src/pipeline/layers/confidence-gate.ts`
- `packages/engine/src/pipeline/layers/og-meta.ts`
- `packages/engine/src/pipeline/layers/heuristic.ts`
- `packages/engine/src/pipeline/layers/ai-fallback.ts`
- `packages/engine/src/pipeline/layers/post-process.ts`
- `packages/engine/test/pipeline/compose.test.ts`
- `packages/engine/test/pipeline/confidence-gate.test.ts`
- `packages/engine/test/pipeline/pipeline-integration.test.ts`
- `packages/engine/test/pipeline/layers/board-detector.test.ts`
- `packages/engine/test/pipeline/layers/json-ld.test.ts`
- `packages/engine/test/pipeline/layers/css-selector.test.ts`
- `packages/engine/test/pipeline/layers/og-meta.test.ts`
- `packages/engine/test/pipeline/layers/heuristic.test.ts`
- `packages/engine/test/pipeline/layers/ai-fallback.test.ts`
- `packages/engine/test/pipeline/layers/post-process.test.ts`

**Modified files:**
- `packages/engine/tsconfig.json` — added "DOM" to lib
- `packages/engine/eslint.config.js` — added document/window to restricted globals
- `packages/engine/src/index.ts` — added pipeline re-exports
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status updates
- `_bmad-output/implementation-artifacts/2-2-middleware-extraction-pipeline.md` — story file (this file)
