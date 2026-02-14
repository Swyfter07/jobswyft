# Autofill & Scanning Engine

**Path:** `apps/extension/src/features/`  
**Status:** Current implementation (as of 2026-02-13)

---

## Overview

Two separate engines share the same pattern: **injectable functions** run via `chrome.scripting.executeScript` in the page context, with **data-driven registries** passed as `args`. Both use **board detection** from URL patterns.

| Engine | Purpose | Board Detection | Registry |
|--------|---------|-----------------|----------|
| **Scanning** | Extract job data from job posting pages | `job-detector.ts` | `selector-registry.ts` |
| **Autofill** | Detect and fill form fields on application pages | `ats-detector.ts` | `field-registry.ts` |

---

## Scanning Engine

### Flow

1. **Background** detects job URL → `chrome.tabs.onUpdated`, `webNavigation.onHistoryStateUpdated`, `onReferenceFragmentUpdated`, `tabs.onActivated`
2. **Cooldown** (30s) via `chrome.storage.session` to avoid re-scanning same URL
3. **Auto-scan toggle** in settings — if off, background does not trigger
4. **Signal** stored in `chrome.storage.local` → side panel listens and runs scan
5. **Content Sentinel** (optional) — MutationObserver on job URLs, signals when description content appears; 3s fallback timeout
6. **Side panel** calls `chrome.scripting.executeScript({ func: scrapeJobPage, args: [board, SELECTOR_REGISTRY] })` with `allFrames: true`
7. **Aggregate** results from main frame + sub-frames
8. **Validate** extraction completeness
9. **AI fallback** — if completeness < threshold and token present, call `POST /v1/ai/extract-job` with cleaned HTML
10. **Delayed verification** — if still incomplete, re-run rule-based scan after 5s (no AI)

### Components

| File | Role |
|------|------|
| `job-detector.ts` | URL patterns → board name (linkedin, indeed, greenhouse, lever, workday, etc.) or null |
| `selector-registry.ts` | `SelectorEntry[]` — board + field → CSS selectors, priority, status |
| `scanner.ts` | `scrapeJobPage(board, registry)` — injectable, zero imports |
| `extraction-validator.ts` | Validates title, company, description; returns completeness + confidence |
| `content-sentinel.content.ts` | MutationObserver on job URLs; board-specific readiness selectors; signals via `chrome.storage.session`; detects "Show More" (read-only, no click) |
| `authenticated-layout.tsx` | Orchestrates scan, AI fallback, delayed verification, scan store updates |

### Extraction Layers (in `scanner.ts`)

1. **JSON-LD** — `script[type="application/ld+json"]` → JobPosting schema
2. **Registry CSS** — Board-filtered + generic entries, first non-empty match per field
3. **OpenGraph** — `og:title`, `og:site_name` for company
4. **Generic** — `document.title`, `meta[name="description"]`
5. **Heuristic** — Hidden content (`display:none`, `max-height`, `overflow:hidden`), read-only, no DOM clicks

### Supported Boards (job-detector)

linkedin, indeed, greenhouse, lever, workday, glassdoor, ziprecruiter, monster, wellfound, dice, simplyhired, careerbuilder, builtin, icims, smartrecruiters, generic

---

## Autofill Engine

### Flow

1. User opens **Autofill** tab in sidebar
2. **Detect ATS** from current tab URL via `detectATSForm(url)` → `{ isATS, board }`
3. **Field detection** — `chrome.scripting.executeScript({ func: detectFormFields, args: [board, REGISTRY_SERIALIZED] })` with `allFrames: true`
4. **Aggregate** results across frames, de-duplicate by `stableId`
5. **Fetch autofill data** — `GET /v1/autofill/data` (resume + profile data), cached 5 min
6. **Map** detected fields to autofill data
7. User **fills** (single or bulk) → `chrome.scripting.executeScript({ func: fillFormFields, args: [instructions] })`
8. **Undo** — single-step revert via `undoFormFills` with stored `previousValue`

### Components

| File | Role |
|------|------|
| `ats-detector.ts` | URL patterns → ATS board (greenhouse, lever, workday, ashby, smartrecruiters, icims, workable, bamboohr, jobvite, generic) |
| `field-registry.ts` | `AutofillFieldEntry[]` — board + fieldType → CSS selectors |
| `field-detector.ts` | `detectFormFields(board, registry)` — injectable, multi-signal scoring |
| `field-filler.ts` | `fillFormFields(instructions)`, `undoFormFills(entries)` — injectable |
| `field-types.ts` | `AutofillFieldType`, `SignalType`, `SignalEvaluation` |
| `signal-weights.ts` | Weights per signal, `computeFieldConfidence`, `resolveFieldType` |
| `autofill-data-service.ts` | Fetches `GET /v1/autofill/data`, 5-min cache, invalidate on resume change |
| `autofill-tab.tsx` | Orchestrates detect → display → fill → undo |

### Signal Weights (field detection)

| Signal | Weight |
|--------|--------|
| autocomplete | 0.95 |
| name-id-regex | 0.85 |
| board-selector | 0.85 |
| input-type | 0.80 |
| label-for | 0.75 |
| aria-label | 0.75 |
| parent-label | 0.70 |
| placeholder | 0.65 |
| sibling-text | 0.50 |
| css-data-attr | 0.50 |
| heading-context | 0.40 |
| section-context | 0.30 |

**Confidence:** Highest signal + diminishing bonus for corroborating signals. Capped at 0.99.

**Field type resolution:** Weighted voting — each matched signal votes for `suggestedType`; highest total wins.

### Detection Layers (in `field-detector.ts`)

1. **Board-specific registry** — `el.matches(selector)` for active entries
2. **autocomplete** — `autocomplete` attribute → fieldType map
3. **name/id regex** — Patterns on `name` + `id` (e.g. `first_name`, `email`)
4. **input-type** — `type="email"` → email, etc.
5. **label-for** — Associated `<label for="...">`
6. **aria-label** — `aria-label` text
7. **parent-label** — Parent with label-like text
8. **placeholder** — Placeholder text patterns
9. **sibling-text** — Adjacent text nodes
10. **css-data-attr** — `data-*` attributes
11. **heading-context** — Section heading proximity
12. **section-context** — Form section labels

### Fill Behavior (field-filler.ts)

- **Input/Textarea:** Native value setter + `input`/`change`/`blur` events
- **Select:** Fuzzy option match (exact → case-insensitive → starts-with → substring)
- **Checkbox:** Click if value differs
- **Radio:** Click to select
- **Contenteditable:** `textContent` + `input` event
- **File:** Skipped (handled via resume-uploader)

---

## Shared Constraints

- **Injectable functions** must have zero imports, closures, or external refs — Chrome serializes them
- **Registries** are JSON-serializable, passed as `args` to `executeScript`
- **Board filtering** — only run registry entries matching detected board + `"generic"`
