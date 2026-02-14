# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**Critical Conflict Points Identified:** 8 new pattern areas for Smart Engine, plus confirmation of all existing conventions.

## Existing Patterns (Confirmed)

These patterns were established in the original architecture and remain unchanged:

| Domain | Convention | Example |
|--------|-----------|---------|
| DB tables/columns | `snake_case` | `selector_health`, `fail_count` |
| API JSON fields | `snake_case` | `health_score`, `last_verified` |
| TypeScript vars/props | `camelCase` | `healthScore`, `lastVerified` |
| Python files | `snake_case.py` | `config_sync.py`, `telemetry_worker.py` |
| TS files | `kebab-case.tsx` | `scan-store.ts`, `site-config.tsx` |
| API response | Envelope pattern | `{success: true, data: {...}}` |
| Error format | Code + message | `{code: "SELECTOR_NOT_FOUND", message: "..."}` |
| Components | ui/ + custom/ | `components/ui/button.tsx`, `components/custom/match-score.tsx` |
| Styling | Tokens → Tailwind | Semantic CSS tokens first, utility classes second |

## New Patterns for Smart Engine

**PATTERN-SE1: Site Config File Naming**
- Convention: Domain-based flat naming
- Location: `configs/sites/`
- Format: `{domain}.json` (e.g., `greenhouse.io.json`, `lever.co.json`)
- Rationale: Domain name is the natural lookup key matching URL-based detection; flat structure keeps discovery simple

**PATTERN-SE2: Extension Message Types**
- Convention: Dot-namespaced strings
- Format: `{domain}.{action}` (e.g., `scan.trigger`, `autofill.start`, `picker.open`, `config.sync`)
- Namespaces: `scan.*`, `autofill.*`, `picker.*`, `config.*`, `auth.*`, `telemetry.*`
- Implementation: TypeScript discriminated union with `type` field
- Rationale: Natural grouping, readable, common event system pattern

**PATTERN-SE3: Selector Registry Structure — Layered**
- Static config (shipped/synced from API):
  ```json
  {
    "selector": "h1.job-title",
    "priority": 1,
    "type": "css",
    "fallbacks": ["[data-job-title]", ".posting-headline h1"]
  }
  ```
- Runtime health (computed locally, stored in chrome.storage):
  ```json
  {
    "selectorId": "greenhouse.io:jobTitle:0",
    "healthScore": 0.95,
    "lastVerified": "2026-02-13T...",
    "failCount": 2,
    "totalAttempts": 40
  }
  ```
- Rationale: Separates synced data from local computation; keeps config payloads small; aligns with ADR-REV-D1

**PATTERN-SE4: Telemetry Event Envelope**
- Standard envelope for all telemetry events:
  ```json
  {
    "type": "extraction.field.success",
    "version": 1,
    "timestamp": "2026-02-13T12:00:00Z",
    "sessionId": "uuid",
    "payload": { "site": "greenhouse.io", "field": "jobTitle", "layer": "css", "confidence": 0.92, "duration_ms": 45 }
  }
  ```
- Event types: `extraction.field.success`, `extraction.field.failure`, `extraction.page.complete`, `correction.submitted`, `correction.accepted`, `config.sync.completed`, `selector.health.degraded`
- Rationale: Uniform batch processing; namespaced types easy to filter/aggregate; version field enables payload evolution

**PATTERN-SE5: Confidence Score Representation**
- Internal: 0-1 float (e.g., `0.92`)
- Display: 0-100 percentage (e.g., `92%`)
- Thresholds: Defined as floats (e.g., `CONFIDENCE_ACCEPT = 0.7`, `CONFIDENCE_ESCALATE = 0.4`)
- Conversion: Presentation layer only (`Math.round(score * 100)`)
- Rationale: Floats for computation/comparison; percentages for human readability; single conversion point prevents inconsistency

**PATTERN-SE6: Config Version Format**
- Format: Monotonic integer (e.g., `1`, `2`, `42`)
- Delta sync: `GET /v1/configs/sites?since_version=42`
- Increment: API increments on every config publish
- Storage: Extension stores `lastSyncedVersion: number` in chrome.storage
- Rationale: Simplest for delta sync ordering; unambiguous comparison; no parsing needed

**PATTERN-SE7: Extension Store Organization**
- Domain-sliced stores with shared core:
  - `useCoreStore` — cross-cutting: current page state, connection status, user auth, preferences
  - `useScanStore` — detection results, extraction data, confidence scores
  - `useAutofillStore` — autofill state, field mapping, progress
  - `useConfigStore` — site configs, sync status, config version
  - `useTelemetryStore` — event buffer, batch queue, flush status
- File location: `stores/{store-name}.ts`
- Naming: `use{Domain}Store` (camelCase, prefixed with `use`)
- Rationale: Domain boundaries prevent state coupling; core store eliminates duplication; each store independently testable

**PATTERN-SE8: Async State Type**
- Standard discriminated union for all async operations:
  ```typescript
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: AppError }
  ```
- Usage: All store fields representing async operations use `AsyncState<T>`
- AppError type:
  ```typescript
  type AppError = {
    code: string       // e.g., "EXTRACTION_FAILED"
    message: string    // human-readable
    details?: unknown  // optional debug context
  }
  ```
- Rationale: Exhaustive TypeScript matching catches missing states; composable across all stores; consistent error shape

## Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions from the table above — no exceptions for "temporary" code
2. Use `AsyncState<T>` for any new async operation in extension stores
3. Use the telemetry event envelope (PATTERN-SE4) for any new telemetry event type
4. Place site configs in `configs/sites/{domain}.json` format
5. Use dot-namespaced strings for any new extension message types
6. Keep selector static config separate from runtime health data
7. Represent confidence as 0-1 float internally, convert to percentage only at display

**Pattern Enforcement:**
- TypeScript compiler catches `AsyncState` exhaustiveness violations
- Zod schema validation catches config format violations at runtime
- CI linting for file naming conventions
- PR review checklist for new telemetry events and message types

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| `isLoading: boolean` + `error: string \| null` | `AsyncState<T>` discriminated union |
| `chrome.runtime.sendMessage({action: "scan"})` | Typed command: `{type: "scan.trigger", payload: {...}}` |
| Inline confidence thresholds (`if (score > 0.7)`) | Named constants: `if (score > CONFIDENCE_ACCEPT)` |
| Selector health fields in site config JSON | Separate runtime health store (PATTERN-SE3) |
| `config_v2.json` filename for versioning | Monotonic integer in config payload, domain-based filename |
| Single massive Zustand store | Domain-sliced stores (PATTERN-SE7) |

## Error Handling Patterns

**Three-Tier Error Escalation:**

| Tier | Scope | Trigger | UX Response |
|------|-------|---------|-------------|
| **Tier 1: Inline Retry** | Single action | API timeout, network blip | Inline error message + "Retry" button adjacent to error |
| **Tier 2: Section Degraded** | Dependent features | Match analysis fails → AI Studio can't unlock | Affected section shows "Analysis unavailable — retry match first" with link back to Scan tab |
| **Tier 3: Full Re-Auth** | Session-wide | Token expired, auth revoked | Slide transition to LoggedOutView with "Session expired — sign in again" |

**Error Format:** `<p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{message}</p>`

| Layer | Pattern |
|-------|---------|
| API | Catch → return envelope with error code (+ SSE `event: error` for streaming) |
| Frontend | Try/catch → set error state → inline message with retry action. **Never modal.** |
| Extension | Same + "Check your connection and try again" for network errors |

**Rules:**
- Never auto-retry — always require explicit user action
- Errors are inline, actionable, and honest — never dead ends
- Every error state has a next action ("Could not scan" → "Paste description")

## Loading State Patterns

**Never use generic spinners.** All loading states have purposeful visual feedback:

| Duration | Pattern | Example |
|----------|---------|---------|
| < 500ms | No indicator (perceived instant) | Tab switch, section expand |
| 500ms–2s | Skeleton shimmer (shadcn `<Skeleton>` composition) | Job scan, initial data load |
| 2s–10s | Animated progress (SVG ring fill, sequential autofill) | Match analysis, autofill run |
| > 10s | Streaming text reveal (word-by-word) + "Stop generating" cancel | Cover letter, outreach, coach |

**Skeleton Rules:**
- Use shadcn `<Skeleton>` via composition: `<Skeleton className="h-4 w-3/4 rounded" />`
- Compose skeletons to match loaded component layout shape — do NOT create separate `*Skeleton` components
- Apply `animate-pulse` (respects `prefers-reduced-motion` → static gray, no animation)
- Never show skeleton + real content simultaneously — hard cut transition

**Button Loading State:** `<Loader2 className="mr-2 size-4 animate-spin" />` replaces icon, text changes to gerund ("Signing in...", "Analyzing...")

## Button Hierarchy

**Three-Tier System:**

| Tier | shadcn Variant | When | Visual |
|------|---------------|------|--------|
| **Primary** | `default` | One per view — the #1 next action | Solid `bg-primary`, white text, `shadow-md` |
| **Secondary** | `outline` | Supporting actions (Edit, Reset, Cancel) | Border only, foreground text |
| **Ghost** | `ghost` | Tertiary / inline actions (settings gear, close X) | No border/bg, hover reveals bg |

**Functional Area CTA Buttons:**

| Action | Class | When |
|--------|-------|------|
| Dive Deeper / AI actions | `bg-ai-accent text-ai-accent-foreground` | AI Studio, generative actions |
| Autofill | `btn-gradient-depth-autofill` | Start autofill, apply fields |
| Coach send | `btn-gradient-depth-coach` | Send to coach, open coaching |
| Destructive | `variant="destructive"` | Delete resume, clear all |

**Button Pair Ordering:**
- **Constructive pairs:** Primary left, Secondary right (e.g., "Analyze Job" | "Cancel")
- **Destructive pairs:** Cancel left, Destructive right (e.g., "Keep" | "Delete Resume")

**Rules:**
- Maximum 1 primary button per visible section
- Full-width (`w-full`) for CTAs inside cards
- Icon + label: icon `size-4` with `mr-2`, always left of text
- Disabled state: `opacity-50 cursor-not-allowed` (shadcn default)

## Extension Shell Layout Contract

The sidebar shell layout is defined once in `<ExtensionSidebar>` and never reinvented:

```
<aside className="flex flex-col h-full">       /* sidebar shell */
  <header><AppHeader className="shrink-0" /></header>  /* fixed top */
  <nav><TabBar className="shrink-0" /></nav>           /* fixed below header */
  <main className="flex-1 overflow-y-auto              /* scrollable content */
    scrollbar-hidden scroll-fade-y">
    {children}
  </main>
  <footer><CreditBar className="shrink-0" /></footer>  /* fixed bottom */
</aside>
```

- All composed views (`StateLoggedOut`, `StateJobDetected`, etc.) render inside the `flex-1` scroll region
- Header, tab bar, and credit bar NEVER scroll — they are `shrink-0` fixed regions
- Semantic HTML: `aside > header + nav + main + footer`
- Tab content: preserves state within a session (switching Scan → Coach → Scan doesn't re-scan)

**Tab Structure:**

| Level | Tabs | Component |
|-------|------|-----------|
| Main sidebar | Scan \| AI Studio \| Autofill \| Coach | shadcn `<Tabs>` |
| AI Studio sub-tabs | Match \| Cover Letter \| Chat \| Outreach | Nested shadcn `<Tabs>` |

Active tab indicator uses functional area accent color. Tab switch animation: `animate-tab-content` (slideInFromRight 200ms ease-out).

## Animation Strategy

**Dependency:** `framer-motion` (~30 kB gzip) — **dynamic import** via `<AnimatedMatchScore>` since it only renders in job-detected state.

**Boundary Rules:**

| Technology | Use For | Never For |
|-----------|---------|-----------|
| **Framer Motion** | State transitions (AnimatePresence), match score animation (motion.circle), count-up numbers, orchestrated multi-element sequences | Hover/focus states |
| **CSS animations** | Hover/focus states, tab content transitions, button glow effects, loading skeletons, single-element micro-interactions | N/A — CSS can be used for anything simple |

**Reduced Motion Support:**

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration: 0s;
    --motion-enabled: 0;
  }
  .animate-tab-content { animation: none; }
}
```

- `tw-animate-css` handles its own animations automatically
- Custom keyframes need explicit `animation: none`
- Framer Motion components read `--motion-enabled` or `useReducedMotion()` hook to skip orchestrated transitions
- Streaming text: shows full text immediately instead of word-by-word reveal

## Accessibility (WCAG 2.1 AA)

**Color & Contrast:**
- All text: 4.5:1 contrast ratio against background (OKLCH tokens tuned)
- UI components: 3:1 contrast ratio (borders, icons as sole indicators)
- Color never the sole indicator — always paired with text, icons, or numeric values
- Dark mode tokens independently verified

**Keyboard Navigation:**
- All interactive elements reachable via Tab key
- Tab bar: Arrow keys for tab switching (Radix Tabs built-in)
- Escape: close edit mode, dismiss overlays, cancel generation
- Enter: submit forms, activate buttons
- Focus ring: `outline-ring/50` (globals.css base layer)

**Screen Reader Support:**
- Semantic HTML: `<aside>`, `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`
- ARIA labels on icon-only buttons: `aria-label="Reset job data"`, `aria-label="Settings"`
- Live regions: `aria-live="polite"` on match score updates, error messages, autofill progress
- Match score: `role="img" aria-label="Match score: {n} percent"`
- Error messages: `role="alert"` (auto-announced)
- Loading states: `aria-busy="true"` on container

**ARIA Patterns by Component:**

| Component | ARIA Pattern |
|-----------|-------------|
| Tab bar | Radix handles `tablist/tab/tabpanel` automatically |
| Match score | `role="img" aria-label="Match score: {n} percent"` |
| Edit toggle | `aria-label="Edit job details"` / `aria-label="Cancel editing"` |
| Reset button | `aria-label="Reset job data"` |
| Credit bar | `aria-label="AI credits: {used} of {total} used"` |
| Error messages | `role="alert"` |

**Development Rules:**
1. Every icon-only button gets `aria-label` — no exceptions
2. Every dynamic content update gets `aria-live="polite"` or `role="alert"`
3. Never use `div`/`span` for interactive elements — use `button`, `a`, or Radix primitives
4. Never suppress focus outlines without visible alternative
5. Test with keyboard before marking any component story as complete
