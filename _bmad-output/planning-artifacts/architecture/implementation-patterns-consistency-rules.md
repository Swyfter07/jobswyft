# Implementation Patterns & Consistency Rules

## Naming Patterns

| Layer | Convention | Example |
|-------|------------|---------|
| Database | snake_case | `user_id`, `created_at`, `subscription_tier` |
| API Endpoints | kebab-case, plural | `/v1/resumes`, `/v1/jobs/{id}` |
| API JSON | snake_case | `{ "user_id": "...", "created_at": "..." }` |
| TypeScript | camelCase | `userId`, `createdAt` |
| React Components | PascalCase | `ResumeCard`, `JobList` |
| Files (TS) | kebab-case | `resume-card.tsx`, `use-auth.ts` |
| Files (Python) | snake_case | `resume_service.py`, `ai_provider.py` |

**Cross-boundary:** API returns snake_case → TypeScript client transforms to camelCase.

## Structure Patterns

```
apps/
├── api/
│   ├── app/
│   │   ├── routers/        # FastAPI routers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Pydantic models
│   │   └── core/           # Config, deps, utils
│   └── tests/              # pytest (mirrors app/)
├── web/
│   └── src/
│       ├── app/            # Next.js App Router
│       ├── components/     # UI components
│       ├── lib/            # Utilities, API client
│       └── hooks/          # Custom hooks
└── extension/
    └── src/
        ├── entrypoints/    # WXT entry points
        ├── components/     # UI components
        ├── stores/         # Zustand stores
        ├── lib/            # Utilities, API client
        └── hooks/          # Custom hooks
```

**Tests:** Python in `tests/` folder; TypeScript co-located `*.test.ts`

## Data Format Patterns

| Pattern | Rule |
|---------|------|
| Dates | ISO 8601: `"2026-01-30T12:00:00Z"` |
| IDs | UUIDs as strings |
| Null fields | Omit from response |
| Empty arrays | Return `[]`, not `null` |
| Pagination | `{ items, total, page, page_size }` |

## State Management (Extension)

- One Zustand store per domain: `auth-store`, `resume-store`, `job-store`
- State + actions in same store
- Persist to `chrome.storage.local`

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

## AI-Assisted Development Tooling

**MCP Tools to Leverage:**

| MCP | Purpose | When to Use |
|-----|---------|-------------|
| Sequential Thinking | Break down complex problems | Planning multi-step implementations |
| Serena | Code analysis, symbol navigation, refactoring | Understanding codebase, safe edits |
| Tavily | Web search for current information | Researching solutions, debugging |
| Context7 | Latest library documentation | Getting up-to-date API docs |
| Supabase MCP | Database operations | Schema changes, queries, migrations |

**CLI Tools:**

| CLI | Purpose | When to Use |
|-----|---------|-------------|
| Supabase CLI | Migrations, local dev, type generation | Database schema changes, `supabase gen types` |
| Railway CLI | API deployment | `railway up` for backend deploys |
| Vercel CLI | Dashboard deployment | `vercel` for frontend deploys |

**Developer Instructions:**

1. Before coding: Use Serena to understand existing code structure
2. For complex logic: Use Sequential Thinking to plan approach
3. For library usage: Use Context7 to get latest docs (not outdated training data)
4. For database work: Use Supabase MCP + CLI for migrations
5. For research: Use Tavily for current solutions/debugging help
6. For deployment: Use respective CLIs (Railway, Vercel, Supabase)

---
