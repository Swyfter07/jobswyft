# Story EXT.1: WXT Extension Setup, @jobswyft/ui Integration & Login Screen

Status: review

## Story

As a **job seeker installing the Jobswyft extension**,
I want **to see a polished login screen when I click the extension icon**,
so that **I can sign in with Google and start using Jobswyft**.

**FRs addressed:** FR1 (Google OAuth sign-in), FR67 (open sidebar), FR68 (close sidebar), FR69 (Logged Out state)

## Acceptance Criteria

### AC1: WXT Project Initialization

**Given** `apps/extension/` contains only a README.md
**When** the developer initializes WXT with React template
**Then** a working WXT React project exists in `apps/extension/`
**And** `wxt.config.ts` is configured with the project name "Jobswyft"
**And** the project builds without errors via `pnpm build`

### AC2: @jobswyft/ui Workspace Integration

**Given** the WXT project is initialized
**When** the developer adds `@jobswyft/ui` as a workspace dependency
**Then** `package.json` includes `"@jobswyft/ui": "workspace:*"`
**And** `@jobswyft/ui/styles` (globals.css) is importable
**And** all exported components from `@jobswyft/ui` are importable

### AC3: Chrome Side Panel with Style Isolation _(REVISED — was Shadow DOM Content Script)_

**Given** the extension uses Chrome Side Panel API for sidebar rendering
**When** the developer configures the sidepanel entrypoint
**Then** the sidebar renders inside a native Chrome Side Panel (not a content script)
**And** `@jobswyft/ui/styles` (globals.css including Tailwind v4, OKLCH tokens, font imports) is loaded via `app.css`
**And** Tailwind utility classes from `@jobswyft/ui` components resolve correctly via `@source` directive
**And** the `.dark` class is applied/removed on `<html>` based on `prefers-color-scheme` media query

### AC4: Sidebar Toggle via Browser Action

**Given** the side panel is registered in the manifest
**When** the user clicks the extension icon (browser action)
**Then** the `ExtensionSidebar` shell renders as a full-width panel inside Chrome's native side panel
**And** the `LoggedOutView` component renders inside the sidebar shell
**And** Chrome's native side panel close button handles closing (FR68)

### AC5: Google OAuth Sign-In Flow

**Given** the `LoggedOutView` is rendered in the extension
**When** the user clicks "Sign in with Google"
**Then** the extension initiates Google OAuth via `chrome.identity.launchWebAuthFlow`
**And** a loading state is shown on the button during the auth flow
**And** on success, the auth token is stored in `chrome.storage.local`
**And** the sidebar re-renders (ready for next story's authenticated state)
**And** on failure (user cancels or network error), an error message is displayed inline

### AC6: Visual Fidelity Across Themes

**Given** the extension is loaded as unpacked in Chrome
**When** the developer clicks the extension icon on any webpage
**Then** the side panel renders with correct styling (fonts, colors, spacing match Storybook exactly)
**And** dark mode works when system preference is dark
**And** light mode works when system preference is light

### AC7: Storybook Component Verification

**Given** `LoggedOutView` already exists in `packages/ui/src/components/custom/logged-out-view.tsx`
**When** the developer reviews the component in Storybook
**Then** it renders correctly at 400x600 (Extension Popup viewport) in both dark and light themes
**And** the `onSignIn` callback fires when the Google sign-in button is clicked
**And** no hardcoded colors are used (all semantic tokens from `globals.css`)

## Tasks / Subtasks

- [x] **Task 1: Initialize WXT Project** (AC: #1)
  - [x] 1.1: Scaffold WXT React project manually in `apps/extension/` (interactive CLI not suitable for headless)
  - [x] 1.2: Configure `wxt.config.ts` — set `name: "Jobswyft"`, `srcDir: "src"`, `outDir: "_output"`, manifest with permissions
  - [x] 1.3: Verify `pnpm build` succeeds from `apps/extension/`
  - [x] 1.4: Verify extension loads as unpacked in Chrome

- [x] **Task 2: Integrate @jobswyft/ui** (AC: #2)
  - [x] 2.1: Add `"@jobswyft/ui": "workspace:*"` to `apps/extension/package.json`
  - [x] 2.2: Add shared peer deps: `react`, `react-dom`, `lucide-react`
  - [x] 2.3: Run `pnpm install` from monorepo root
  - [x] 2.4: Verify `import { Button } from '@jobswyft/ui'` resolves
  - [x] 2.5: Verify `import '@jobswyft/ui/styles'` resolves

- [x] **Task 3: Chrome Side Panel Setup** _(REVISED — was Shadow DOM Content Script)_ (AC: #3)
  - [x] 3.1: Create sidepanel entrypoint at `src/entrypoints/sidepanel/index.html` + `main.tsx`
  - [x] 3.2: Create `src/styles/app.css` with `@import "@jobswyft/ui/styles"` and `@source` directive for Tailwind v4
  - [x] 3.3: Add `side_panel.default_path: "sidepanel.html"` to manifest config
  - [x] 3.4: Add `sidePanel` permission to manifest
  - [x] 3.5: Implement dark/light theme detection via `prefers-color-scheme` + `.dark` class on `<html>`

- [x] **Task 4: Sidebar Shell & Toggle** (AC: #4)
  - [x] 4.1: Create `src/components/sidebar-app.tsx` — root component with auth state routing
  - [x] 4.2: Mount `ExtensionSidebar` with `LoggedOutView` for unauthenticated state
  - [x] 4.3: Override `ExtensionSidebar` positioning with `panelClassName` for side panel context
  - [x] 4.4: Create background service worker at `src/entrypoints/background/index.ts`
  - [x] 4.5: Implement `chrome.action.onClicked` → `chrome.sidePanel.open({ windowId })`

- [x] **Task 5: Google OAuth Flow** (AC: #5)
  - [x] 5.1: Create `src/lib/auth.ts` — `signInWithGoogle()` using `chrome.identity.launchWebAuthFlow`
  - [x] 5.2: Exchange Google ID token with Supabase via `signInWithIdToken()` with nonce
  - [x] 5.3: Create `src/lib/storage.ts` — helpers for `chrome.storage.local` (get/set/remove auth tokens)
  - [x] 5.4: Add loading state to LoggedOutView sign-in button (update component + Storybook)
  - [x] 5.5: Add error state for auth failure (inline message, not alert)
  - [x] 5.6: Store auth token on success, trigger sidebar re-render

- [x] **Task 6: Visual QA** (AC: #6, #7)
  - [x] 6.1: Load extension unpacked in Chrome, verify side panel renders on icon click
  - [x] 6.2: Compare Storybook rendering vs extension rendering (fonts, colors, spacing)
  - [x] 6.3: Test dark mode (system preference dark) and light mode
  - [x] 6.4: End-to-end OAuth verified: Google sign-in → Supabase session → authenticated state

## Dev Notes

### CRITICAL LEARNING: Shadow DOM → Chrome Side Panel Pivot

**Original plan:** Use WXT's `createShadowRootUi()` content script to inject a sidebar overlay with Shadow DOM style isolation.

**What happened:** The Shadow DOM content script approach had fundamental issues:
1. **CSS leaking** — Host page CSS leaked into the shadow host element (position, z-index, overflow from page styles)
2. **Layout conflicts** — The overlay mixed with website content, host page elements overrode positioning
3. **Fragile injection** — Content scripts may not be loaded on existing tabs, requiring fallback `chrome.scripting.executeScript()` injection
4. **Style isolation was incomplete** — While Shadow DOM isolates internal styles, the shadow host element itself is still subject to page CSS

**Solution:** Pivoted to **Chrome Side Panel API** (`chrome.sidePanel`). This gives us:
- A native browser-managed panel that is completely isolated from page content
- No CSS leaking, no z-index battles, no positioning hacks
- Simpler architecture: just an HTML page rendered in Chrome's panel frame
- Chrome handles open/close natively via panel toggle

**The content script + Shadow DOM approach should ONLY be used if you need to inject UI directly into a webpage (e.g., inline buttons on LinkedIn). For a sidebar panel, always use Chrome Side Panel API.**

### CRITICAL LEARNING: Google OAuth Client Types for Chrome Extensions

**The single most confusing part of this implementation.** There are two types of Google OAuth clients:

| Type | `chrome.identity.getAuthToken()` | `chrome.identity.launchWebAuthFlow()` |
|------|----------------------------------|--------------------------------------|
| **Chrome Extension** | Yes (designed for this) | **NO — redirect_uri_mismatch** |
| **Web Application** | No | **YES — this is what you need** |

**What we learned:**
1. `chrome.identity.launchWebAuthFlow()` uses redirect URI: `https://<extension-id>.chromiumapp.org`
2. This redirect URI must be registered as an **Authorized redirect URI** on a **Web Application** type OAuth client (NOT Chrome Extension type)
3. Chrome Extension type OAuth clients don't have a Client Secret — but Supabase's Google provider config **requires** a Client Secret
4. Therefore you MUST use a **Web Application** type OAuth client for the `launchWebAuthFlow` + Supabase pattern
5. The Web Application client ID goes in `manifest.oauth2.client_id` AND in Supabase Google provider settings
6. The Web Application client Secret goes in Supabase Google provider settings only

**Auth flow (final working pattern):**
```
User clicks "Sign in"
  → Build Google OAuth URL with response_type=id_token, nonce, redirect_uri
  → chrome.identity.launchWebAuthFlow({ url, interactive: true })
  → Google OAuth consent screen opens in popup
  → User consents → redirect to https://<ext-id>.chromiumapp.org#id_token=...
  → Extract id_token from URL hash fragment
  → supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce })
  → Supabase returns session (access_token, refresh_token)
  → Store in chrome.storage.local
```

### CRITICAL LEARNING: Tailwind v4 `@source` Directive for Workspace Dependencies

When consuming `@jobswyft/ui` as a workspace dependency, Tailwind v4's Vite plugin only scans the extension's own source files for utility class names. The UI package's compiled dist **does not include Tailwind classes** — they must be generated at the consumer's build time.

**Problem:** Side panel rendered with broken layout — CSS was only 13kB instead of expected ~88kB. All `@jobswyft/ui` component utility classes were missing.

**Solution:** In `apps/extension/src/styles/app.css`:
```css
@import "@jobswyft/ui/styles";

/* Tell Tailwind v4 to scan UI package source files for class names */
@source "../../../../packages/ui/src";
```

The `@source` directive tells Tailwind v4 to scan the UI package's **source files** (not dist) for utility class names during the extension's build.

### CRITICAL LEARNING: Lazy Supabase Client Initialization

**Problem:** Creating the Supabase client at module level (`const supabase = createClient(url, key)`) crashes if env vars are missing or empty, throwing `supabaseUrl is required` before any code runs. This killed the entire extension.

**Solution:** Lazy initialization pattern:
```typescript
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = import.meta.env.WXT_SUPABASE_URL;
  const key = import.meta.env.WXT_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase config...");
  _supabase = createClient(url, key);
  return _supabase;
}
```

### ExtensionSidebar Positioning Override for Side Panel

The `ExtensionSidebar` component has `fixed right-0 top-0 h-screen w-[400px]` baked in for content script injection context. In a Side Panel, the component should fill the panel naturally.

**Fix:** Pass override className via tailwind-merge:
```tsx
const panelClassName = "relative inset-auto h-screen w-full border-l-0 shadow-none z-auto";
<ExtensionSidebar header={header} className={panelClassName}>
```

### MV3 Manifest: `action` Key Required

`chrome.action.onClicked` API **does not exist** unless the manifest includes an `"action"` key. Without it, `chrome.action` is `undefined` and the service worker crashes with `Cannot read properties of undefined (reading 'onClicked')`.

Minimal fix: `action: { default_title: "Jobswyft" }`

**Also important:** `action.onClicked` and `default_popup` are mutually exclusive. If you define `default_popup`, the `onClicked` event never fires. We use `onClicked` to programmatically open the side panel.

### Existing Components — DO NOT Recreate

These components exist in `@jobswyft/ui` and must be imported, not recreated:

| Component | Import | Purpose |
|-----------|--------|---------|
| `ExtensionSidebar` | `@jobswyft/ui` | Shell: sidebar, children prop, tabs, CreditBar |
| `LoggedOutView` | `@jobswyft/ui` | Login screen: Google sign-in, feature highlights, CTA card |
| `IconBadge` | `@jobswyft/ui` | Used internally by LoggedOutView |
| `Button` | `@jobswyft/ui` | shadcn Button primitive |
| `Card` | `@jobswyft/ui` | shadcn Card primitive |
| `cn()` | `@jobswyft/ui` | Tailwind class merger utility |

### Design Token Rules

- **Zero hardcoded colors** — No `bg-gray-*`, `text-slate-*`, etc.
- **Semantic tokens only** — `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`
- **Card accents** — `border-2 border-card-accent-border`, `bg-card-accent-bg`
- **Text micro** — Use `.text-micro` CSS class for 10px text (not `text-[10px]`)
- **Size shorthand** — Use `size-8` not `h-8 w-8`
- **Font** — Figtree Variable via `@fontsource-variable/figtree` (already in globals.css)
- **Color space** — OKLCH (already configured in globals.css `:root` and `.dark` blocks)

### V1 Code Reference

A complete V1 vanilla JS extension exists at `/V1 Code/` in the repo root. Useful references:
- **`service-worker.js`** — Job board URL detection patterns (LinkedIn, Indeed, Greenhouse, etc.) — will be needed in future stories
- **`manifest.json`** — Permission model: `sidePanel, storage, activeTab, scripting, tabs, webNavigation`
- **`prompts.js`** — AI prompt templates for resume parsing, match analysis, cover letter generation
- **`sidepanel.js`** — 9 major modules (setupResumeTray, setupAIAnalysis, setupTabs, etc.)

For this story, only the manifest permissions list is relevant. Do NOT port V1 logic — we're building fresh with WXT + React + shadcn.

### Project Structure Notes

**Final file structure for `apps/extension/`:**

```
apps/extension/
├── package.json              # @jobswyft/ui workspace dep + Supabase client
├── wxt.config.ts             # WXT config: name, manifest, sidePanel, Tailwind vite plugin
├── tsconfig.json             # Extends .wxt/tsconfig.json with JSX support
├── .env                      # WXT_SUPABASE_URL, WXT_SUPABASE_ANON_KEY (git-ignored)
├── .env.example              # Template for env vars
├── src/
│   ├── entrypoints/
│   │   ├── sidepanel/
│   │   │   ├── index.html    # Side panel HTML shell
│   │   │   └── main.tsx      # React root, theme detection, render SidebarApp
│   │   └── background/
│   │       └── index.ts      # Service worker: action.onClicked → sidePanel.open()
│   ├── components/
│   │   └── sidebar-app.tsx   # Root app: auth state routing (LoggedOutView ↔ authenticated)
│   ├── lib/
│   │   ├── auth.ts           # Google OAuth via chrome.identity + Supabase signInWithIdToken
│   │   └── storage.ts        # chrome.storage.local helpers (get/set/remove session)
│   ├── styles/
│   │   └── app.css           # @import globals.css + @source directive for Tailwind v4
│   └── assets/
│       └── icon/             # Extension icons (16, 48, 128) — future
├── _output/                  # Build output (git-ignored)
└── .wxt/                     # WXT generated types (git-ignored)
```

**Key differences from original plan:**
- `src/entrypoints/sidepanel/` replaces `src/entrypoints/content/` (Side Panel API replaces Shadow DOM content script)
- `src/styles/app.css` added for Tailwind v4 `@source` directive
- No popup entrypoint (action.onClicked and popup are mutually exclusive)
- `_output/` instead of `.output/` for build output

### Architecture Compliance

| Requirement | How This Story Complies |
|-------------|------------------------|
| WXT + React (architecture.md) | WXT 0.20.13, React 19, TypeScript 5.7 |
| `@jobswyft/ui` shared components | All UI imported from workspace package |
| Chrome Side Panel (revised from Shadow DOM) | Native browser panel via `chrome.sidePanel` API |
| Supabase Auth JWT (architecture.md) | `signInWithIdToken()` after Chrome OAuth with Web Application client |
| `chrome.storage.local` persistence (architecture.md) | Auth tokens stored via storage helpers |
| OKLCH color tokens (globals.css) | All styling via semantic CSS variables |
| Dark + Light theme (cross-cutting rule) | `.dark` class on `<html>` via `prefers-color-scheme` media query |
| Zero hardcoded colors (cross-cutting rule) | All components use `globals.css` tokens |
| Figtree Variable font (globals.css) | Loaded via globals.css `@font-face` in side panel context |

### Library & Framework Versions

| Library | Version | Notes |
|---------|---------|-------|
| WXT | 0.20.13 | Latest stable at implementation time |
| @wxt-dev/module-react | 1.1.5 | WXT React integration module |
| React | ^19.0.0 | Matches `@jobswyft/ui` peer dep |
| React DOM | ^19.0.0 | Matches `@jobswyft/ui` peer dep |
| Tailwind CSS | ^4.1.18 | Matches `@jobswyft/ui` |
| @tailwindcss/vite | ^4.1.18 | Vite plugin for Tailwind v4 |
| Vite | ^7.3.1 | Via WXT (matches `@jobswyft/ui` build tooling) |
| TypeScript | ^5.7.0 | Matches monorepo |
| @supabase/supabase-js | ^2.49.4 | For `signInWithIdToken()` |
| lucide-react | ^0.562.0 | Matches `@jobswyft/ui` dep |

### Testing Requirements

**Manual QA (completed):**
1. Extension loads without console errors ✅
2. Side panel opens on browser action click ✅
3. LoggedOutView matches Storybook rendering (both themes) ✅
4. Google sign-in button triggers OAuth popup ✅
5. Auth success stores token, transitions to authenticated state ✅
6. Auth failure shows inline error (not alert/popup) ✅
7. Side Panel provides complete style isolation from host pages ✅

**No automated tests required for this story** — WXT extension requires browser context. Automated E2E testing is a future story concern.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#UI Package Architecture - Consumer Integration]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management (Extension)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Technical Constraints]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic EXT: Extension UI Build]
- [Source: packages/ui/src/components/custom/logged-out-view.tsx]
- [Source: packages/ui/src/components/custom/extension-sidebar.tsx]
- [Source: packages/ui/src/styles/globals.css]
- [Source: packages/ui/package.json — exports config]
- [Source: V1 Code/manifest.json — permission model reference]
- [WXT Content Script UI: https://wxt.dev/guide/content-script-ui.html]
- [Chrome Side Panel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel]
- [Supabase Auth in Chrome Extensions: https://supabase.com/docs/guides/auth/social-login/auth-google#chrome-extensions]

## Tech Debt for Backend API

| Item | Description | Priority |
|------|-------------|----------|
| **AUTH-01** | `POST /v1/auth/google` — Exchange Google OAuth token for Supabase session. Extension sends Google ID token, API validates and returns Supabase access + refresh tokens. | High |
| **AUTH-02** | `GET /v1/auth/me` — Return current user profile. Used by extension to verify auth state on sidebar open. | High |
| **AUTH-03** | `POST /v1/auth/logout` — Invalidate server-side session. Extension calls on sign-out. | Medium |
| **AUTH-04** | Profile auto-creation on first login (Supabase trigger or API-side). Set initial 5 free credits (FR60). | High |

## Out of Scope (Future Stories)

- Authenticated sidebar states (Non-Job Page, Job Page, Application Page)
- Resume tray and resume management
- Zustand state management stores (beyond simple auth state)
- Chrome Web Store publishing
- Auto-scan job page detection
- Offline/network error states beyond auth failure
- Content script injection for inline webpage UI (e.g., LinkedIn buttons)
- Backend API URL configuration (`https://api.jobswyft.com`)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

**Errors encountered and fixes (chronological):**

1. **`entrypoints directory not found`** — WXT defaults to `./entrypoints` at project root. Fixed by adding `srcDir: "src"` to wxt.config.ts.

2. **`Uncaught Error: supabaseUrl is required`** — Supabase client created at module level with empty env vars (no .env file existed). Crashed the entire extension before any code ran. Fixed by: (a) lazy-initializing Supabase client only when `signInWithGoogle()` is called, (b) creating `.env` with real credentials from `apps/api/.env`.

3. **`Service worker registration failed. Status code: 15`** + **`Cannot read properties of undefined (reading 'onClicked')`** — Missing `action` key in manifest. `chrome.action` API requires explicit `"action": {}` entry in manifest. Fixed by adding `action: { default_title: "Jobswyft" }`.

4. **`Could not establish connection. Receiving end does not exist`** — Background script sent message to content script that wasn't loaded on existing tabs. Fixed with try/catch + fallback `chrome.scripting.executeScript()` injection. (Later made moot by Side Panel pivot.)

5. **Extension UI mixed with website data, CSS leaking** _(MAJOR)_ — Content script + Shadow DOM overlay had fundamental style isolation issues. Host page CSS affected shadow host element positioning. **PIVOTED** from content script to Chrome Side Panel API entirely.

6. **No colors/themes rendering (CSS only 13kB)** — Tailwind v4's Vite plugin only scanned extension source files, not `@jobswyft/ui` components. Fixed by creating `app.css` with `@source "../../../../packages/ui/src"` directive to tell Tailwind to scan UI package sources.

7. **`ExtensionSidebar` positioning wrong in side panel** — Component has `fixed right-0 top-0 h-screen w-[400px]` for content script context. Fixed by passing `className="relative inset-auto h-screen w-full border-l-0 shadow-none z-auto"` override.

8. **`redirect_uri_mismatch` (Error 400)** — Initially used a Chrome Extension type OAuth client with `launchWebAuthFlow`. Chrome Extension type clients don't work with `launchWebAuthFlow` — that API needs a **Web Application** type client. Fixed by creating a Web Application OAuth client with `https://<extension-id>.chromiumapp.org` as authorized redirect URI.

9. **Supabase asking for Client Secret** — Chrome Extension OAuth clients don't have secrets. Supabase's Google provider config requires both Client ID and Secret. Fixed by using a Web Application OAuth client (which provides both).

10. **Invalid manifest `key`** — Attempted to add a stable manifest key for consistent extension ID but used an invalid format. Removed entirely — not needed for development.

### Completion Notes List

- **Task 1**: WXT React project scaffolded manually (interactive CLI not suitable for headless). WXT 0.20.13, React 19, TypeScript 5.7. Build verified. Manifest includes MV3, permissions, oauth2 config.
- **Task 2**: `@jobswyft/ui: workspace:*` linked via pnpm workspace. Both component imports and `@jobswyft/ui/styles` resolve in Vite builds. Tailwind v4 + `@tailwindcss/vite` plugin added for CSS processing.
- **Task 3**: **REVISED** — Pivoted from Shadow DOM content script to Chrome Side Panel API. Sidepanel entrypoint with `index.html` + `main.tsx`. `app.css` wraps globals.css import with `@source` directive for Tailwind v4 class scanning of UI package source files. Dark/light theme via `prefers-color-scheme` media query + `.dark` class on `<html>`.
- **Task 4**: `SidebarApp` root component routes between `LoggedOutView` (unauthenticated) and placeholder authenticated view. `ExtensionSidebar` mounted with `panelClassName` override for side panel context. Background service worker calls `chrome.sidePanel.open({ windowId })` on `chrome.action.onClicked`.
- **Task 5**: `signInWithGoogle()` implements full flow: Google OAuth URL construction (response_type=id_token) → `chrome.identity.launchWebAuthFlow` → ID token extraction from hash fragment → `supabase.auth.signInWithIdToken()` with nonce → session stored in `chrome.storage.local`. Requires **Web Application** type OAuth client (not Chrome Extension type). `LoggedOutView` updated with `isLoading` and `error` props (Storybook stories added). `signOut()` helper also implemented.
- **Task 6**: Full visual QA completed by user. Extension loads, side panel opens, themes render correctly, OAuth flow works end-to-end (Google → Supabase → authenticated state). User confirmed: "It worked end to end!"

### Key Decisions Made During Implementation

1. **Side Panel over Shadow DOM** — Chrome Side Panel API provides complete isolation, simpler architecture, and native browser UX. Shadow DOM content script should only be used for inline webpage UI injection.
2. **Web Application OAuth client** — `chrome.identity.launchWebAuthFlow()` requires Web Application type (not Chrome Extension type). This is the only way to get both Client ID and Secret for Supabase.
3. **`_output` directory** — User preference over WXT's default `.output`.
4. **Lazy Supabase initialization** — Prevents crash on missing env vars, only initializes when auth is actually attempted.
5. **No manifest `key`** — Stable extension ID not needed for development. Extension ID is determined by Chrome at load time.
6. **Backend API**: `https://api.jobswyft.com` — Production Railway deployment confirmed working for auth flow.

### Change Log

- 2026-02-05: Implemented Tasks 1-6. Pivoted from Shadow DOM content script to Chrome Side Panel API. Resolved 10 distinct issues (see Debug Log). Full end-to-end OAuth verified by user. Updated LoggedOutView with loading/error states + Storybook stories.

### File List

**New files:**
- `apps/extension/package.json` — WXT + React + @jobswyft/ui workspace dep + Supabase client
- `apps/extension/wxt.config.ts` — WXT config: name, manifest permissions, sidePanel, Tailwind vite plugin, srcDir, outDir
- `apps/extension/tsconfig.json` — Extends .wxt/tsconfig.json with JSX support
- `apps/extension/.env` — Supabase credentials (git-ignored)
- `apps/extension/.env.example` — Supabase env var template
- `apps/extension/src/entrypoints/sidepanel/index.html` — Side panel HTML shell
- `apps/extension/src/entrypoints/sidepanel/main.tsx` — React root, theme detection, render SidebarApp
- `apps/extension/src/entrypoints/background/index.ts` — Service worker: action.onClicked → sidePanel.open()
- `apps/extension/src/components/sidebar-app.tsx` — Root app: auth state routing (LoggedOutView ↔ authenticated)
- `apps/extension/src/lib/auth.ts` — Google OAuth via chrome.identity + Supabase signInWithIdToken (lazy client init)
- `apps/extension/src/lib/storage.ts` — chrome.storage.local helpers (get/set/remove session)
- `apps/extension/src/styles/app.css` — @import globals.css + @source directive for Tailwind v4 class scanning

**Modified files:**
- `packages/ui/src/components/custom/logged-out-view.tsx` — Added `isLoading` and `error` props with loading spinner and inline error message
- `packages/ui/src/components/custom/logged-out-view.stories.tsx` — Added Loading and Error story variants
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — EXT-1 status: ready-for-dev → in-progress → review
- `.gitignore` — Added `_output/` entry

**Deleted files:**
- `apps/extension/README.md` — Removed placeholder
- `apps/extension/src/entrypoints/content/` — Entire directory deleted (pivoted from content script to Side Panel)
- `apps/extension/src/entrypoints/popup/` — Deleted (action.onClicked and popup are mutually exclusive in MV3)
