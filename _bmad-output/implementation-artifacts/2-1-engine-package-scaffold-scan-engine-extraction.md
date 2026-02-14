# Story 2.1: Engine Package Scaffold & Scan Engine Extraction

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the existing scan logic extracted from the extension into a standalone `packages/engine/` package with zero Chrome API dependencies,
So that the core intelligence is independently testable and reusable across surfaces.

## Acceptance Criteria

1. **Package scaffold exists and is workspace-integrated**
   - `packages/engine/` exists with `package.json` (name: `@jobswyft/engine`)
   - TypeScript strict mode, ESM output (`tsup` bundler — architecture-prescribed for library packages; note: `@jobswyft/ui` uses Vite, not tsup)
   - Vitest config with `jsdom` or `happy-dom` environment
   - pnpm workspace resolves `@jobswyft/engine` — importable by `apps/extension/` and future surfaces
   - Zero `chrome.*` API imports enforced (build-time check or ESLint rule)

2. **Pure extraction functions relocated to engine package**
   - `job-detector.ts` — URL-based job board detection (`detectJobPage()`, `getJobBoard()`)
   - `extraction-validator.ts` — confidence scoring, completeness calculation, validation
   - `selector-registry.ts` — board-specific CSS selector database (`SELECTOR_REGISTRY[]`)
   - `frame-aggregator.ts` — multi-frame result merging (`aggregateFrameResults()`). **Note:** current signature uses `chrome.scripting.InjectionResult[]` — must abstract to a generic `FrameResult` type before/during move (see Dev Notes)
   - `ats-detector.ts` — ATS form page URL detection (`detectATSForm()`)
   - `field-types.ts` — core autofill type definitions (`AutofillFieldType`, `DetectedField`, etc.)
   - `signal-weights.ts` — signal confidence weights + computation (`computeFieldConfidence()`, `resolveFieldType()`)

3. **Chrome-specific code remains in extension**
   - `html-cleaner.ts` (uses `chrome.scripting.executeScript`) stays in `apps/extension/`
   - `scanner.ts` (injectable serialized function) stays in extension but imports types/constants from engine
   - `field-detector.ts` (injectable serialized function) stays in extension but imports types/constants from engine
   - `field-filler.ts` (injectable serialized function) stays in extension
   - `autofill-data-service.ts`, `resume-uploader.ts` stay in extension

4. **Extension scan flow works identically through new import path**
   - All existing extension tests pass after extraction
   - `apps/extension/` imports from `@jobswyft/engine` instead of local paths
   - Scan on LinkedIn, Indeed, and Greenhouse produces identical results

5. **Engine package has at least 10 unit tests**
   - Job board detection (known boards, unknown URLs)
   - Confidence scoring (single-source, multi-source, edge cases)
   - Selector registry (board filtering, priority ordering, status filtering)
   - Frame aggregation (single frame, multi-frame merge, gap filling)
   - ATS form detection (known ATS, generic patterns)
   - Field type helpers (`getFieldCategory()`)
   - Signal weight computation (weighted voting, diminishing returns, cap at 0.99)

## Tasks / Subtasks

- [ ] Task 1: Scaffold `packages/engine/` package (AC: #1)
  - [ ] 1.1 Create `packages/engine/package.json` with name `@jobswyft/engine`, ESM exports
  - [ ] 1.2 Create `tsconfig.json` (strict, ES2020 target, ESNext module, declaration: true)
  - [ ] 1.3 Create `tsup.config.ts` for ESM bundling (architecture-prescribed; do NOT reference `@jobswyft/ui` which uses Vite)
  - [ ] 1.4 Create `vitest.config.ts` with jsdom environment
  - [ ] 1.5 Add Chrome API ban lint rule (ESLint `no-restricted-imports` for `chrome.*` or `webextension-polyfill`)
  - [ ] 1.6 Verify `pnpm install` resolves `@jobswyft/engine` in workspace
- [ ] Task 2: Extract pure scanning modules (AC: #2)
  - [ ] 2.1 Move `job-detector.ts` to `packages/engine/src/detection/job-detector.ts`
  - [ ] 2.2 Move `extraction-validator.ts` to `packages/engine/src/scoring/extraction-validator.ts`
  - [ ] 2.3 Move `selector-registry.ts` to `packages/engine/src/registry/selector-registry.ts`
  - [ ] 2.4 Move `frame-aggregator.ts` to `packages/engine/src/extraction/frame-aggregator.ts` — replace `chrome.scripting.InjectionResult[]` param type with a generic `FrameResult` interface defined in engine types
  - [ ] 2.5 Move `ats-detector.ts` to `packages/engine/src/detection/ats-detector.ts`
  - [ ] 2.6 Move `field-types.ts` to `packages/engine/src/types/field-types.ts`
  - [ ] 2.7 Move `signal-weights.ts` to `packages/engine/src/scoring/signal-weights.ts`
  - [ ] 2.8 Create `packages/engine/src/index.ts` barrel exports
- [ ] Task 3: Update extension imports (AC: #3, #4)
  - [ ] 3.1 Add `@jobswyft/engine` dependency to `apps/extension/package.json`
  - [ ] 3.2 Update all extension source imports from local `features/scanning/` to `@jobswyft/engine`
  - [ ] 3.3 Update all extension source imports from local `features/autofill/field-types` and `signal-weights` to `@jobswyft/engine`
  - [ ] 3.4 Update extension test file imports — any test that imports from moved modules must use `@jobswyft/engine` (e.g., `ats-detector.test.ts`, `signal-weights.test.ts`); Chrome-dependent tests (`scanner.integration.test.ts`, `field-detector.test.ts`, `field-filler.test.ts`, `resume-uploader.test.ts`) stay but may need import path fixes for types/constants
  - [ ] 3.5 Update `scanner.ts` injectable function to import types/constants from engine (note: injectable functions inline their logic, but surrounding orchestration code uses engine imports)
  - [ ] 3.6 Create extension-side adapter to map `chrome.scripting.InjectionResult[]` → engine's `FrameResult[]` before calling `aggregateFrameResults()`
  - [ ] 3.7 Verify no circular dependencies between engine and extension
- [ ] Task 4: Write engine package unit tests (AC: #5)
  - [ ] 4.1 Port existing `job-detector.test.ts` to engine package
  - [ ] 4.2 Port existing `extraction-validator.test.ts` to engine package
  - [ ] 4.3 Port existing `selector-registry.test.ts` to engine package
  - [ ] 4.4 Port existing `signal-weights.test.ts` to engine package
  - [ ] 4.5 Write new `frame-aggregator.test.ts`
  - [ ] 4.6 Write new `ats-detector.test.ts`
  - [ ] 4.7 Write new `field-types.test.ts` (getFieldCategory helper)
  - [ ] 4.8 Verify all tests pass: `cd packages/engine && pnpm test`
- [ ] Task 5: Validate end-to-end extension behavior (AC: #4)
  - [ ] 5.1 Run existing extension test suite — all must pass
  - [ ] 5.2 Build extension: `cd apps/extension && pnpm build`
  - [ ] 5.3 Manual smoke test: scan on LinkedIn, Indeed, Greenhouse pages (if fixtures or manual test available)

## Dev Notes

### Critical Architecture Constraints

**Zero Chrome API Dependency Rule (ADR-REV-D4):**
The engine package is a hexagonal core — pure functional, no browser API dependencies. This is the foundation for Stories 2.2-2.6. Enforcement matters more than the extraction itself.

**Injectable Function Pattern (Chrome serialization constraint):**
`scanner.ts:scrapeJobPage()`, `field-detector.ts:detectFormFields()`, and `field-filler.ts:fillFormFields()` are self-contained injectable functions with zero imports. They are serialized by `chrome.scripting.executeScript()` and cannot reference outer scope. These functions **stay in the extension** — they cannot import from `@jobswyft/engine` at runtime. However, the orchestration code around them (which calls these functions and processes results) CAN and SHOULD import from `@jobswyft/engine`.

**frame-aggregator.ts Chrome Type Abstraction (CRITICAL):**
`frame-aggregator.ts` currently has `chrome.scripting.InjectionResult[]` in its function signature. Since the engine package omits DOM/Chrome types from tsconfig, this will cause a compile error. You must:
1. Define a generic `FrameResult` interface in `packages/engine/src/types/` that captures the shape needed (e.g., `{ result: unknown; frameId: number }`)
2. Update `aggregateFrameResults()` to accept `FrameResult[]` instead of `chrome.scripting.InjectionResult[]`
3. In the extension adapter code, map `chrome.scripting.InjectionResult[]` → `FrameResult[]` before calling the engine function

**What moves vs. what stays:**

| Module | Moves to Engine? | Reason |
|--------|-----------------|--------|
| `job-detector.ts` | YES | Pure URL regex matching, no DOM |
| `extraction-validator.ts` | YES | Pure scoring/validation math |
| `selector-registry.ts` | YES | Pure data + types |
| `frame-aggregator.ts` | YES | Pure aggregation logic (abstract `chrome.scripting.InjectionResult[]` → generic `FrameResult` type) |
| `ats-detector.ts` | YES | Pure URL regex matching |
| `field-types.ts` | YES | Pure type definitions + helper |
| `signal-weights.ts` | YES | Pure confidence math |
| `scanner.ts` | NO | Injectable (serialized by Chrome) |
| `field-detector.ts` | NO | Injectable (serialized by Chrome) |
| `field-filler.ts` | NO | Injectable (serialized by Chrome) |
| `html-cleaner.ts` | NO | Uses `chrome.scripting` API |
| `autofill-data-service.ts` | NO | Uses extension `apiClient` (backend REST calls + caching) |
| `resume-uploader.ts` | NO | Injectable injection function + DataTransfer API |
| `field-registry.ts` | NO | Autofill scope — moves in Story 2.5 |
| `undo-manager.ts` | NO | Autofill scope — uses `chrome.storage.session` (Story 2.5+) |

### Package Configuration Patterns

Use `tsup` for the engine build (architecture-prescribed for library packages). **Note:** `@jobswyft/ui` uses Vite — do NOT copy its build config. The engine is a simpler pure-logic library where tsup is the better fit.

**package.json essentials:**
```json
{
  "name": "@jobswyft/engine",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**tsconfig.json:** Target ES2020, strict: true, moduleResolution: bundler, declaration: true, lib: ["ES2020"] (no "DOM"). Do NOT reference `@jobswyft/ui` tsconfig — it targets a different build toolchain (Vite).

**tsup.config.ts:** ESM format, dts: true, clean: true, entry: ["src/index.ts"].

**vitest.config.ts:** Environment: jsdom (for future DOM-related tests in Story 2.2+). For Story 2.1, all tests are pure logic and don't need DOM.

### Chrome API Ban Enforcement

Add to `packages/engine/package.json` or create `.eslintrc.js`:
```js
// Option A: ESLint no-restricted-globals
{ rules: { "no-restricted-globals": ["error", "chrome", "browser"] } }

// Option B: TypeScript path restriction — don't include DOM types that expose chrome
// tsconfig.json: "lib": ["ES2020"] (no "DOM" — add only when needed for Story 2.2+)
```

**Simplest approach:** Omit `"DOM"` from tsconfig `lib` array. This makes any `chrome.*`, `document.*`, `window.*` reference a compile error. Add DOM types only when Story 2.2 introduces jsdom-based pipeline testing.

### Engine Package Directory Structure (Story 2.1 scope only)

```
packages/engine/
├── src/
│   ├── detection/
│   │   ├── job-detector.ts          # detectJobPage(), getJobBoard()
│   │   └── ats-detector.ts          # detectATSForm()
│   ├── extraction/
│   │   └── frame-aggregator.ts      # aggregateFrameResults()
│   ├── registry/
│   │   └── selector-registry.ts     # SELECTOR_REGISTRY[], SelectorEntry type
│   ├── scoring/
│   │   ├── extraction-validator.ts  # confidence, completeness, validation
│   │   └── signal-weights.ts        # SIGNAL_WEIGHTS, computeFieldConfidence(), resolveFieldType()
│   ├── types/
│   │   └── field-types.ts           # AutofillFieldType, DetectedField, etc.
│   └── index.ts                     # Barrel exports
├── test/
│   ├── detection/
│   │   ├── job-detector.test.ts
│   │   └── ats-detector.test.ts
│   ├── extraction/
│   │   └── frame-aggregator.test.ts
│   ├── registry/
│   │   └── selector-registry.test.ts
│   ├── scoring/
│   │   ├── extraction-validator.test.ts
│   │   └── signal-weights.test.ts
│   └── types/
│       └── field-types.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

**Note:** This is a subset of the full architecture target structure (which includes `pipeline/`, `autofill/`, `trace/`, `configs/`). Stories 2.2-2.5 will add those directories. Do NOT scaffold empty directories for future stories.

### Naming Conventions (Enforced)

| Layer | Convention | Example |
|-------|-----------|---------|
| TS files | `kebab-case.ts` | `job-detector.ts`, `signal-weights.ts` |
| Exports | `camelCase` functions, `PascalCase` types | `getJobBoard()`, `SelectorEntry` |
| Constants | `UPPER_SNAKE_CASE` | `SELECTOR_REGISTRY`, `SIGNAL_WEIGHTS` |
| Test files | `*.test.ts` co-located or in `test/` | `job-detector.test.ts` |

### Existing Extension Test Files (Must Continue Passing)

These tests exist in the extension and must pass after extraction:
- `apps/extension/src/features/scanning/job-detector.test.ts`
- `apps/extension/src/features/scanning/extraction-validator.test.ts`
- `apps/extension/src/features/scanning/selector-registry.test.ts`
- `apps/extension/src/features/scanning/scanner.integration.test.ts`
- `apps/extension/src/features/autofill/field-detector.test.ts`
- `apps/extension/src/features/autofill/ats-detector.test.ts`
- `apps/extension/src/features/autofill/signal-weights.test.ts`
- `apps/extension/src/features/autofill/field-registry.test.ts`
- `apps/extension/src/features/autofill/field-filler.test.ts`
- `apps/extension/src/features/autofill/resume-uploader.test.ts`

**Strategy:** For files that move to engine, either:
1. Move the test file too and update extension test to import from `@jobswyft/engine` (preferred)
2. Keep test in extension importing from new path

Tests for Chrome-dependent files (`scanner.integration.test.ts`, `field-detector.test.ts`, `field-filler.test.ts`, `resume-uploader.test.ts`) stay in extension — they test integration with Chrome APIs.

**Test directory structure note:** Scanning tests are co-located with source (`features/scanning/*.test.ts`). Autofill tests are in a subdirectory (`features/autofill/__tests__/`). Engine package tests use a separate `test/` directory mirroring `src/` structure.

### Anti-Patterns to Avoid

- **Do NOT** scaffold empty directories for future stories (pipeline/, autofill/, configs/) — YAGNI
- **Do NOT** create a `scanner.ts` wrapper in engine that tries to abstract the injectable function
- **Do NOT** add `"DOM"` to engine tsconfig lib — keep it pure ES2020 for now
- **Do NOT** change the internal logic of any extracted function — copy exactly, fix imports only
- **Do NOT** create duplicate type definitions — single source of truth in engine package
- **Do NOT** use `tsc` for building — use `tsup` (architecture-prescribed). Note: `@jobswyft/ui` uses Vite, not tsup — do not copy UI's build config

### Project Structure Notes

- `packages/engine/` is a **new workspace package** at the same level as `packages/ui/`
- pnpm workspace (`pnpm-workspace.yaml`) already includes `packages/*` — no change needed
- Extension references engine via workspace protocol: `"@jobswyft/engine": "workspace:*"`
- Engine has zero runtime dependencies — only devDependencies (typescript, tsup, vitest)
- Build output: `packages/engine/dist/` (gitignored)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-engine-package-detection-extraction-autofill-core.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture/core-engine-implementation-detail.md#Package Structure]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#Smart Engine Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#Enforcement Guidelines]
- [Source: _bmad-output/planning-artifacts/architecture/core-engine-implementation-detail.md#Key TypeScript Interfaces]
- [Source: apps/extension/src/features/scanning/ — existing scan modules explored via codebase analysis]
- [Source: apps/extension/src/features/autofill/ — existing autofill modules explored via codebase analysis]
- [Source: packages/ui/package.json — workspace package reference (note: UI uses Vite, engine uses tsup)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
