# Epic 2: Engine Package — Detection, Extraction & Autofill Core

Extract the core detection, extraction, and autofill logic into `packages/engine/` (`@jobswyft/engine`). Zero Chrome API dependencies. Testable with JSDOM/happy-dom. Extension becomes a thin Chrome adapter layer.

## Story 2.1: Engine Package Scaffold & Scan Engine Extraction

As a developer,
I want the existing scan logic extracted from the extension into a standalone `packages/engine/` package with zero Chrome API dependencies,
So that the core intelligence is independently testable and reusable across surfaces.

**Acceptance Criteria:**

**Given** the existing scan engine code in `apps/extension/`
**When** the engine package is scaffolded
**Then** `packages/engine/` exists with:
- TypeScript configuration (strict mode, ESM output)
- Package name `@jobswyft/engine` in `package.json`
- pnpm workspace integration (importable by `apps/extension/` and future surfaces)
- Vitest test configuration with JSDOM/happy-dom environment
- Zero dependencies on `chrome.*` APIs or WXT runtime
**And** a lint rule or build check enforces no Chrome API imports

**Given** the existing scan/extraction modules in `apps/extension/`
**When** extraction logic is moved to `packages/engine/`
**Then** all pure functions (URL pattern matching, HTML parsing, data extraction, field mapping) are relocated
**And** Chrome-specific code (content script injection, message passing, `chrome.storage`) remains in the extension
**And** the extension imports extraction functions from `@jobswyft/engine`

**Given** the extraction is complete
**When** the existing extension scan flow is tested
**Then** all current scan functionality works identically through the new package import path
**And** existing extension tests continue to pass
**And** at least 10 unit tests exist in `packages/engine/` covering core extraction functions

---

## Story 2.2: Middleware Extraction Pipeline

As a developer,
I want a Koa-style middleware extraction pipeline with a shared `DetectionContext` and inline confidence gates,
So that extraction is modular, composable, and can short-circuit early when confidence is high enough.

**Acceptance Criteria:**

**Given** the middleware pipeline architecture (ADR-REV-SE5)
**When** the pipeline is implemented in `packages/engine/`
**Then** a `DetectionContext` type exists containing: URL, raw HTML, extracted fields, confidence scores per field, pipeline metadata, and site config hints
**And** each middleware layer is a function `(ctx: DetectionContext, next: () => Promise<void>) => Promise<void>`
**And** layers can read and write to the context, and call `next()` to continue the chain

**Given** the full pipeline chain
**When** a job page HTML is processed
**Then** layers execute in order: BoardDetector → JsonLd → Gate(0.85) → CssSelector → Gate(0.75) → OgMeta → Heuristic → Gate(0.70) → AiFallback → PostProcess
**And** inline confidence gates check the current overall confidence and skip remaining layers when the threshold is met
**And** the pipeline returns the final `DetectionContext` with extracted fields and confidence scores

**Given** a high-confidence extraction (e.g., LinkedIn with JSON-LD)
**When** the pipeline processes the page
**Then** the Gate(0.85) after JsonLd short-circuits the pipeline
**And** CssSelector, OgMeta, Heuristic, and AiFallback layers are NOT executed
**And** extraction completes in under 500ms

**Given** a low-confidence extraction (unknown job board)
**When** the pipeline processes the page
**Then** all layers execute in sequence, with each adding confidence signals
**And** AiFallback is reached and invoked only when confidence remains below 0.70 after Heuristic
**And** PostProcess normalizes and validates the final extracted data

**Given** the pipeline implementation
**When** tests are run
**Then** at least 15 tests cover: full pipeline execution, each gate threshold, short-circuit behavior, layer ordering, and error handling (layer throws → pipeline continues with degraded confidence)

---

## Story 2.3: Smart Extraction Patterns — Confidence & Self-Healing

As a developer,
I want weighted multi-signal confidence scoring, self-healing selectors, and config-driven site support,
So that extraction is accurate, resilient to DOM changes, and extensible to new job boards.

**Acceptance Criteria:**

**Given** the confidence scoring system (ADR-REV-SE2)
**When** multiple extraction signals produce values for the same field
**Then** a weighted scoring algorithm combines signals (e.g., JSON-LD weight 0.9, CSS selector weight 0.7, OG meta weight 0.5, heuristic weight 0.3)
**And** per-field confidence is tracked independently (title, company, description, location, salary)
**And** overall confidence is the weighted average of required field confidences
**And** confidence is 0-1 float internally, 0-100% for display only (PATTERN-SE5)

**Given** the self-healing selector system (ADR-REV-SE3)
**When** a primary CSS selector fails to match
**Then** a fallback chain is attempted in order: primary → secondary → tertiary → heuristic repair
**And** each fallback attempt is logged with the selector tried and result
**And** if heuristic repair succeeds, the repaired selector is proposed for config update
**And** the system never silently returns empty data — partial results are returned with lowered confidence

**Given** the config-driven site support (ADR-REV-SE4)
**When** a supported job board is detected
**Then** the site config JSON provides: board name, URL patterns, selector sets per field, pipeline hints, and custom extractor escape hatches
**And** pipeline hints can customize layer ordering (e.g., skip JSON-LD for boards that don't use it)

**Given** fixture-based test coverage
**When** tests are run against saved HTML fixtures
**Then** at least 5 job board fixtures exist (LinkedIn, Indeed, Greenhouse, Lever, Workday — reusing alpha EXT.5.5 fixtures where possible)
**And** each fixture tests: field extraction accuracy, confidence scoring, and self-healing fallback behavior
**And** extraction accuracy meets NFR7 (95%+ on supported boards)

---

## Story 2.4: Site Config System & Board Registry

As a developer,
I want a config-driven site registry with JSON config files per job board and a selector health tracking system,
So that adding new board support is a config change (not a code change) and selector breakage is detectable.

**Acceptance Criteria:**

**Given** the site config system (PATTERN-SE1)
**When** configs are created
**Then** each config lives at `packages/engine/configs/sites/{domain}.json`
**And** the config schema includes: `name`, `urlPatterns` (array of regex), `selectors` (per field with fallback chain), `pipelineHints` (optional layer overrides), `customExtractor` (optional escape hatch module path)
**And** a TypeScript type/schema validates configs at build time

**Given** the board registry
**When** the engine initializes
**Then** all site configs are loaded and indexed by URL pattern
**And** URL matching returns the best-match config for any given URL
**And** unknown URLs (no config match) proceed to the heuristic + AI fallback path

**Given** the top 10 job boards
**When** configs are created
**Then** configs exist for: LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor, Monster, ZipRecruiter, AngelList/Wellfound, and a generic ATS template
**And** each config has at least primary + secondary selectors for: title, company, description, location

**Given** the selector health tracking system (ADR-REV-I3)
**When** an extraction runs
**Then** selector success/failure is recorded per selector per site
**And** health data is stored locally (not requiring a backend)
**And** a health summary function returns: per-site success rate, last-failed selectors, suggested repairs

**Given** the config version system (PATTERN-SE6)
**When** a config is updated
**Then** the version number is a monotonic integer
**And** the engine can detect when local configs are stale vs. the bundled version
**And** delta sync is supported (only load changed configs)

---

## Story 2.5: Autofill Engine Core — Field Detection & Form Filling

As a developer,
I want the autofill engine to detect form fields, map user data to fields, and fill them using the native property descriptor setter pattern,
So that autofill works reliably across standard HTML forms, React controlled forms, and shadow DOM components.

**Acceptance Criteria:**

**Given** the field detection system (ADR-REV-SE8)
**When** the engine scans a page for form fields
**Then** all `<input>`, `<textarea>`, `<select>`, and `[contenteditable]` elements are detected
**And** each detected field is assigned an operation ID (`data-jf-opid`) for addressing
**And** field purpose is inferred from: `name`, `id`, `label`, `placeholder`, `aria-label`, and surrounding text
**And** detected fields are returned as a typed array with: opid, element reference, inferred purpose, current value, and confidence score

**Given** the native property descriptor setter pattern (ADR-REV-SE6, mandatory)
**When** a form field is filled
**Then** the value is set via `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value)`
**And** synthetic `input`, `change`, and `blur` events are dispatched in sequence
**And** React controlled forms correctly pick up the value change
**And** no framework-specific workarounds bypass this pattern

**Given** the shadow DOM traversal (ADR-REV-SE7)
**When** form fields exist inside shadow DOM boundaries
**Then** the engine uses TreeWalker to traverse open shadow roots
**And** closed shadow roots are detected and logged (cannot be traversed)
**And** fields inside open shadow DOM are detected and fillable

**Given** the field mapping logic
**When** user data (from autofill API response) is mapped to detected fields
**Then** mapping uses a scoring algorithm considering: field purpose inference, label matching, name/id pattern matching, and field type compatibility
**And** each mapping includes a confidence score
**And** unmappable fields are returned as "skipped" with a reason

**Given** form fixture test coverage
**When** tests are run
**Then** at least 10 form fixtures exist covering: standard HTML form, React controlled inputs, select dropdowns, file upload fields, shadow DOM forms, multi-step forms
**And** autofill mapping accuracy meets NFR9 (90%+ on standard forms)
**And** fill execution completes within 500ms for a 20-field form

---

## Story 2.6: Extension Adapter & Engine Integration

As a user,
I want the extension to use the new engine package for all scanning and autofill operations while maintaining identical behavior,
So that I experience no change in functionality while the codebase is properly modularized.

**Acceptance Criteria:**

**Given** the engine package is complete (Stories 2.1-2.5)
**When** the extension adapter layer is implemented
**Then** `apps/extension/` contains a thin adapter that:
- Injects content scripts to collect page HTML
- Passes HTML to `@jobswyft/engine` pipeline for extraction
- Receives `DetectionContext` results and updates Zustand stores
- Uses engine autofill core for form filling
- Handles Chrome-specific concerns (permissions, message passing, `chrome.storage`)
**And** no extraction or autofill logic remains directly in extension code

**Given** the adapter uses Chrome message passing
**When** a content script collects page HTML
**Then** messages follow dot-namespaced discriminated unions (`scan.trigger`, `scan.result`, `autofill.start`, `autofill.result`) per PATTERN-SE2
**And** the adapter translates between Chrome message format and engine function signatures

**Given** the extension is loaded with the new engine integration
**When** a user navigates to a supported job board
**Then** auto-scan triggers identically to the alpha behavior
**And** extracted job data displays in the sidebar with confidence indicators
**And** scan completes within 2 seconds (NFR1)

**Given** the extension autofill flow
**When** a user triggers autofill on an application form
**Then** the engine's field detection and mapping runs
**And** fields are filled using the native setter pattern
**And** autofill completes within 1 second (NFR4)

**Given** the full integration
**When** a regression test is run
**Then** all existing extension tests pass
**And** all engine package tests pass
**And** manual verification confirms: scan on LinkedIn, Indeed, and Greenhouse produces identical results to alpha behavior
**And** this story serves as **Integration Checkpoint IC-0** validating engine extraction

---
