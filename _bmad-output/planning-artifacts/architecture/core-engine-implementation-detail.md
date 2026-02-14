# Core Engine Implementation Detail

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE ENGINE                                      │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Selector    │  │   Content    │  │  Extraction  │  │  Telemetry │  │
│  │   Registry    │  │   Sentinel   │  │    Trace     │  │   Client   │  │
│  │              │  │              │  │              │  │            │  │
│  │  Board defs  │  │  DOM ready   │  │  Per-field   │  │  Events →  │  │
│  │  Selectors   │  │  Show More   │  │  journey     │  │  Backend   │  │
│  │  Priority    │  │  Observer    │  │  recording   │  │            │  │
│  │  Health      │  │              │  │              │  │            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                │          │
│  ┌──────┴─────────────────┴─────────────────┴────────────────┴──────┐   │
│  │                      SHARED CORE LAYER                            │   │
│  │  - Selector execution (querySelector + trace)                     │   │
│  │  - Board detection (URL pattern matching)                         │   │
│  │  - Frame aggregation (multi-frame merge)                          │   │
│  │  - Confidence scoring (source → score mapping)                    │   │
│  │  - Correction recording (user edit → feedback event)              │   │
│  └──────┬──────────────────────────────────┬────────────────────────┘   │
│         │                                  │                            │
│  ┌──────┴──────────┐              ┌────────┴────────────┐               │
│  │  SCAN ENGINE    │              │  AUTOFILL ENGINE    │               │
│  │  (reads DOM)    │              │  (writes DOM)       │               │
│  │                 │              │                     │               │
│  │  Extract job    │              │  Detect form fields │               │
│  │  data from page │              │  Map to user data   │               │
│  │                 │              │  Fill + undo        │               │
│  │  → JobCard UI   │              │  Resume upload      │               │
│  └─────────────────┘              └─────────────────────┘               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ELEMENT PICKER (user-initiated, shared by scan + autofill)      │   │
│  │  - SVG overlay on active tab                                     │   │
│  │  - User clicks element → selector generated                      │   │
│  │  - Selector stored as correction → feeds learning                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Extraction Pipeline (ADR-REV-SE5 — Middleware Architecture)

Koa-style middleware pipeline with shared `DetectionContext` and inline confidence gates. Each middleware can short-circuit by not calling `next()`. Site configs can customize layer ordering via `pipelineHints`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  DetectionContext (shared, enriched by each middleware):             │
│  { url, dom, board, fields, confidence, completeness, trace,        │
│    siteConfig, frameId, metadata }                                  │
└─────────────────────────────────────────────────────────────────────┘

Pipeline (default ordering — site configs can customize):

  1. BoardDetectorMiddleware       → sets ctx.board, ctx.siteConfig
  │
  2. JsonLdMiddleware              → conf 0.95 per field
  │   Parse <script type="application/ld+json"> blocks
  │   Recursive search for @type: "JobPosting" (handles @graph)
  │   ~40% of job pages have JSON-LD (Indeed, Greenhouse usually)
  │
  3. ConfidenceGateMiddleware      → SKIP remaining if completeness >= 0.85
  │
  4. CssSelectorMiddleware         → conf 0.85 (board-specific) / 0.60 (generic)
  │   Board-specific selectors first, then generic fallback
  │   Registry-driven (ADR-REV-D1): only board-relevant selectors
  │
  5. ConfidenceGateMiddleware      → SKIP remaining if completeness >= 0.75
  │
  6. OgMetaMiddleware              → conf 0.40
  │   <meta property="og:title"> for title only
  │
  7. HeuristicMiddleware           → conf 0.30
  │   Expand <details>, read CSS-hidden content, extended selectors
  │
  8. ConfidenceGateMiddleware      → SKIP AI if completeness >= 0.70
  │
  9. AiFallbackMiddleware          → conf 0.90
  │   Cleaned HTML (8KB max) → fast model (Haiku)
  │   One AI call per scan maximum. 50/user/day rate limit.
  │   No credit cost (infrastructure, not user-facing AI feature)
  │   Prepares payload; actual API call relayed via port to background
  │
  10. PostProcessMiddleware        → normalize, validate, finalize trace
      Delayed verification if completeness < 0.8 (re-scan after 5s, rule-based only)
```

**Middleware Runner (packages/engine/src/pipeline/middleware.ts):**
```typescript
type Next = () => Promise<void>;
type ExtractionMiddleware = (ctx: DetectionContext, next: Next) => Promise<void>;

function createPipeline(...middlewares: ExtractionMiddleware[]) {
  return {
    async execute(ctx: DetectionContext): Promise<DetectionContext> {
      let prevIndex = -1;
      const runner = async (index: number): Promise<void> => {
        if (index === prevIndex) throw new Error('next() called multiple times');
        prevIndex = index;
        const mw = middlewares[index];
        if (mw) await mw(ctx, () => runner(index + 1));
      };
      await runner(0);
      return ctx;
    }
  };
}
```

**Confidence Gate (packages/engine/src/pipeline/confidence-gate.ts):**
```typescript
function confidenceGate(threshold: number): ExtractionMiddleware {
  return async (ctx, next) => {
    if (ctx.completeness >= threshold) {
      ctx.trace.addEvent({ type: 'gate_skip', threshold, completeness: ctx.completeness });
      return; // Short-circuit — don't call next()
    }
    await next();
  };
}
```

**Completeness Scoring Weights:**
- `title` (0.25), `company` (0.25), `description` (0.35), `location` (0.10), `salary` (0.05)

**Success Validation:** `title && company` required. Missing description triggers warning, not block.

## Key TypeScript Interfaces

**Selector Registry Entry (ADR-REV-D1, PATTERN-SE3):**

```typescript
interface SelectorEntry {
  id: string;                // e.g., "li-title-unified-v3"
  board: string;             // "linkedin" | "indeed" | ... | "generic"
  field: string;             // "title" | "company" | "description" | "location" | "salary" | "employmentType"
  selectors: string[];       // CSS selectors, tried in order
  priority: number;          // Lower = tried first (within same board+field)
  mode: "read" | "write" | "both";  // scan reads, autofill writes
  added: string;             // ISO date
  lastVerified?: string;
  status: "active" | "degraded" | "deprecated";
  notes?: string;
}
```

**Extraction Trace (ADR-REV-D2):**

```typescript
interface TraceAttempt {
  layer: "json-ld" | "css" | "og-meta" | "generic-fallback" | "heuristic";
  attempted: true;
  matched: boolean;
  selectorId?: string;       // From registry
  selector?: string;         // Actual CSS selector
  rawValue?: string;
  cleanedValue?: string;
  accepted: boolean;
  rejectionReason?: string;  // e.g., "failed_isValidJobTitle", "empty"
}

interface FieldTrace {
  field: string;
  finalValue: string;
  finalSource: string;
  finalSelectorId?: string;
  attempts: TraceAttempt[];
  attemptCount: number;
  matchCount: number;
  timeMs?: number;
}

interface ExtractionTrace {
  fields: FieldTrace[];
  board: string | null;
  url: string;
  timestamp: number;
  totalTimeMs: number;
  registryVersion?: string;
  frameCount: number;
  winningFrameId: number;
  aiTriggered: boolean;
  aiTimeMs?: number;
  completeness: number;
  confidence: Record<string, number>;
}
```

**Element Picker Result (ADR-REV-EX3):**

```typescript
interface ElementPickResult {
  value: string;
  rawValue: string;
  clickedSelector: string;
  clickedTag: string;
  stableSelector: string;       // Highest-stability ancestor
  stableScore: number;
  candidates: SelectorCandidate[];
  board: string | null;
  url: string;
  field: string;
  timestamp: number;
}

// Stability scoring: data-testid (+50), semantic class names (+30),
// IDs (+40), semantic tags (+15), ARIA attrs (+20),
// hash/generated classes (-20)
```

**Correction Event (ADR-REV-EX4):**

```typescript
interface CorrectionEvent {
  field: string;
  originalValue: string;
  originalSource: ExtractionSource;
  originalSelectorId?: string;
  correctedValue: string;
  correctionMethod: "inline-edit" | "element-picker";
  pickerResult?: ElementPickResult;
  board: string | null;
  url: string;
  domain: string;
  timestamp: number;
  traceId?: string;
}
```

## Backend Telemetry Schema

```sql
-- Telemetry events table (append-only)
CREATE TABLE scan_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,      -- "scan_complete", "field_correction", "autofill_complete"
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_telemetry_event_type ON scan_telemetry (event_type, created_at);
CREATE INDEX idx_telemetry_board ON scan_telemetry ((payload->>'board'), created_at);
```

**Telemetry Event Types:**
- `scan_complete` — board, domain, url_hash (SHA256), completeness, ai_triggered, field_sources, field_selector_ids
- `field_correction` — board, domain, field, original_source, original_selector_id, correction_method, stable_selector (NO field values — privacy)
- `autofill_complete` — domain, fields_detected, fields_mapped, fields_filled, fields_undone, fill_time_ms

**Aggregation Queries:**
```sql
-- Selector health: correction rate per selector
SELECT payload->>'original_selector_id' AS selector_id,
       payload->>'board' AS board, payload->>'field' AS field,
       COUNT(*) AS correction_count
FROM scan_telemetry
WHERE event_type = 'field_correction' AND created_at > now() - interval '7 days'
GROUP BY 1, 2, 3 ORDER BY correction_count DESC;

-- Board quality: avg completeness + AI fallback rate
SELECT payload->>'board' AS board,
       AVG((payload->>'completeness')::float) AS avg_completeness,
       AVG(CASE WHEN (payload->>'ai_triggered')::boolean THEN 1 ELSE 0 END) AS ai_fallback_rate
FROM scan_telemetry
WHERE event_type = 'scan_complete' AND created_at > now() - interval '7 days'
GROUP BY 1;
```

## Shared Core: Scan + Autofill

| Capability | Scan Engine | Autofill Engine |
|-----------|-------------|-----------------|
| **Direction** | Reads DOM → extracts data | Writes data → fills DOM |
| **Content Sentinel** | Detects when job content is ready | Detects when form fields are ready |
| **Board Detection** | `getJobBoard(url)` for selector filtering | Same — ATS forms have board-specific layouts |
| **Selector Registry** | CSS selectors for reading values | CSS selectors for finding inputs to fill |
| **Element Picker** | "That's the salary" (read mode) | "Put name here" (write mode) |
| **Confidence Scoring** | How sure about extracted value? | How sure this is the name field? |
| **Correction Feedback** | User edits wrong extraction | User unmaps a wrong mapping |
| **Telemetry** | Scan events | Autofill events |

**Package Structure (ADR-REV-D4 — `packages/engine/`):**
```
packages/engine/          ← Pure functional core (hexagonal, no Chrome APIs)
├── src/
│   ├── pipeline/              ← Middleware infrastructure (ADR-REV-SE5)
│   │   ├── middleware.ts      ← Pipeline runner (Koa-style)
│   │   ├── confidence-gate.ts ← Inline confidence gates
│   │   └── types.ts           ← DetectionContext, ExtractionMiddleware
│   ├── extraction/            ← Scan engine middleware layers
│   │   ├── json-ld.ts
│   │   ├── css-selector.ts
│   │   ├── og-meta.ts
│   │   ├── heuristic.ts
│   │   ├── ai-fallback.ts    ← Prepares payload; API call via port
│   │   └── board-detector.ts
│   ├── autofill/              ← Autofill engine core logic
│   │   ├── field-classifier.ts    ← Three-tier: Known/Inferrable/Unknown
│   │   ├── field-mapper.ts
│   │   ├── signal-aggregator.ts   ← Similo-inspired multi-signal scoring
│   │   └── fill-script-builder.ts ← Generates opid-based fill instructions
│   ├── registry/              ← Selector registry + health
│   │   ├── selector-registry.ts
│   │   ├── selector-health.ts
│   │   ├── heuristic-repair.ts
│   │   └── config-schema.ts  ← Zod schemas
│   ├── scoring/               ← Confidence scoring
│   │   ├── confidence-scorer.ts
│   │   ├── signal-weights.ts
│   │   └── constants.ts
│   ├── trace/
│   │   └── extraction-trace.ts
│   ├── types/
│   │   ├── detection-context.ts
│   │   ├── site-config.ts
│   │   ├── extraction.ts
│   │   ├── autofill.ts
│   │   └── telemetry.ts
│   └── index.ts
├── test/
│   ├── fixtures/              ← HTML snapshots per ATS
│   │   ├── greenhouse/
│   │   ├── lever/
│   │   ├── workday/
│   │   └── smartrecruiters/
│   └── setup.ts
├── package.json
├── tsup.config.ts
└── vitest.config.ts

apps/extension/src/features/  ← Chrome adapter layer (thin, DOM-touching)
├── scanning/                  ← DOM reader (uses @jobswyft/engine)
│   ├── dom-collector.ts       ← Shadow DOM traversal (ADR-REV-SE7)
│   ├── scanner.ts
│   ├── frame-aggregator.ts
│   ├── extraction-validator.ts
│   ├── html-cleaner.ts
│   └── job-detector.ts
├── autofill/                  ← DOM writer (uses @jobswyft/engine)
│   ├── field-detector.ts      ← opid assignment (ADR-REV-SE8)
│   ├── field-filler.ts        ← Native setter execution (ADR-REV-SE6)
│   ├── resume-uploader.ts     ← DataTransfer API for file inputs
│   ├── undo-manager.ts        ← Persistent undo (ADR-REV-AUTOFILL-FIX)
│   └── ats-detector.ts
```

## Autofill Engine Pipeline

```
1. COLLECTION (dom-collector.ts — extension adapter)
   Deep-scan DOM including Shadow DOM (ADR-REV-SE7)
   Use TreeWalker + browser-specific shadow root access
   Find: <input>, <textarea>, <select>, [contenteditable]
   Assign opid to each field via data-jf-opid attribute (ADR-REV-SE8)
   Extract 26+ attributes per field (Bitwarden-inspired):
     Core IDs: htmlID, htmlName, htmlClass, opid
     Labels: <label> text, placeholder, aria-label, data-label, positional labels
     Functional: type, autocomplete, maxLength, tabindex, title
   200-field limit with priority-based filtering

2. CLASSIFICATION (field-classifier.ts — packages/engine)
   Three-tier classification (research-aligned):
     Known (compile-time): firstName, email, resumeUpload → pre-registered handlers
     Inferrable (runtime): "Years of React experience" → fuzzy match to closest known type
     Unknown (fallback): "Why do you want this role?" → customQuestion, low confidence

3. MAPPING (field-mapper.ts — packages/engine)
   Map classified fields to user data using registry (mode: "write")
   Confidence: autocomplete (0.95), exact name match (0.90),
   placeholder (0.75), label (0.70), aria-label (0.65), heuristic (0.40)

4. REVIEW (Autofill UI in Side Panel)
   Detected fields grouped by category, low-confidence flagged
   Fields referenced by opid for stable sidebar ↔ DOM mapping
   Option to use element picker for unmapped fields

5. FILL (field-filler.ts — extension adapter, sequential 600ms stagger)
   Lookup field by opid: document.querySelector('[data-jf-opid="..."]')
   If null → field removed from DOM, skip + report in trace
   Snapshot current value for undo
   Apply native setter pattern (PATTERN-SE9 / ADR-REV-SE6):
     Native descriptor setter → input event → change event → blur event
   For <select>: set selectedIndex → change event
   Green border flash → report status per field
   File uploads: DataTransfer API on file input
   Cover letter: paste into textarea/contenteditable

6. UNDO (undo-manager.ts — persistent, ADR-REV-AUTOFILL-FIX)
   Snapshots stored in chrome.storage.session (auto-clears on extension disable)
   Restore all fields from snapshot by opid lookup, remove highlights
   Undo persists with NO timeout — removed only on:
     (a) Page refresh/navigation
     (b) External DOM mutation changing a filled field's value
     (c) User explicitly clicks "Undo"
   MutationObserver on filled fields detects external changes → removes from snapshot
   Record telemetry on undo action
```

## Performance Strategy

| Metric | Target | Strategy |
|--------|--------|----------|
| Scan → JobCard (rule-based) | < 1.5s | Sentinel signals readiness, registry filters by board |
| Scan → JobCard (with AI) | < 4s | AI only when completeness < 0.7, fast model |
| Element picker activation | < 200ms | Lightweight overlay, no React |
| Autofill detection | < 500ms | Sentinel detects forms alongside job content |
| Autofill fill execution | < 4s | 600ms stagger × ~6 fields |
| Telemetry send | 0ms (async) | Batched, background, best-effort |

**AI Call Minimization Target:**
- JSON-LD covers ~40% of pages
- Board-specific CSS covers ~35%
- Generic CSS + heuristics cover ~10%
- AI fallback handles remaining ~15%
- User corrections feed back → improve CSS layer → fewer AI calls over time
