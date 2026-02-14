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

## Extraction Pipeline

Per-field, layers execute top-to-bottom. Stop on first accepted match per field.

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: JSON-LD                                  conf 0.95    │
│  Parse <script type="application/ld+json"> blocks               │
│  Recursive search for @type: "JobPosting" (handles @graph)      │
│  ~40% of job pages have JSON-LD (Indeed, Greenhouse usually)    │
└────────────────────────┬────────────────────────────────────────┘
                         │ fields still empty?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 2: CSS Selectors                       conf 0.85/0.60   │
│  Board-specific selectors first, then generic fallback          │
│  Registry-driven (ADR-REV-D1): only board-relevant selectors    │
│  Title: 17 selectors, Company: 10, Description: 27, etc.       │
└────────────────────────┬────────────────────────────────────────┘
                         │ fields still empty?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 3: OpenGraph Meta                           conf 0.40   │
│  <meta property="og:title"> for title only                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ fields still empty?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 4: Heuristic                                conf 0.30   │
│  Expand <details>, read CSS-hidden content, extended selectors  │
│  Only runs if title OR company OR description missing/short     │
└────────────────────────┬────────────────────────────────────────┘
                         │ completeness < 0.7?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 5: AI Backend (POST /v1/ai/extract-job)     conf 0.90   │
│  Cleaned HTML (8KB max) → fast model (Haiku)                    │
│  One AI call per scan maximum. 50/user/day rate limit.          │
│  No credit cost (infrastructure, not user-facing AI feature)    │
└─────────────────────────────────────────────────────────────────┘

Post-extraction: Delayed verification if completeness < 0.8 (re-scan after 5s, rule-based only)
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

**Shared Module Structure:**
```
features/engine/          ← Pure functional core (hexagonal, no Chrome APIs)
├── extraction-pipeline.ts
├── confidence-scorer.ts
├── selector-health.ts
├── heuristic-repair.ts
├── config-loader.ts
├── config-schema.ts
├── extraction-trace.ts
├── dom-readiness.ts
├── constants.ts
└── __tests__/

features/scanning/        ← DOM reader (uses engine functions)
├── scanner.ts
├── frame-aggregator.ts
├── extraction-validator.ts
├── html-cleaner.ts
└── job-detector.ts

features/autofill/        ← DOM writer (uses engine functions)
├── field-detector.ts
├── field-filler.ts
├── field-registry.ts
├── field-types.ts
├── resume-uploader.ts
├── signal-weights.ts
└── ats-detector.ts
```

## Autofill Engine Pipeline

```
1. DETECTION (field-detector.ts)
   Scan DOM for <input>, <textarea>, <select>, [contenteditable]
   Record: elementRef, fieldType, currentValue, confidence, label

2. MAPPING (field-mapper.ts)
   Map detected fields to user data using registry (mode: "write")
   Confidence: exact match (0.95), autocomplete (0.90),
   placeholder (0.75), label (0.70), aria-label (0.65), heuristic (0.40)

3. REVIEW (Autofill UI in Side Panel)
   Detected fields grouped by category, low-confidence flagged
   Option to use element picker for unmapped fields

4. FILL (field-filler.ts via content script, sequential 600ms stagger)
   Snapshot current value → set value → dispatch input/change/blur events
   → green border flash → report status
   File uploads: DataTransfer API on file input
   Cover letter: paste into textarea/contenteditable

5. UNDO (undo-manager.ts, 10s window)
   Restore all fields from snapshot, remove highlights, record telemetry
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
