# Story EXT.1: WXT Extension Setup & Login (COMPLETE)

**Status:** DONE (reviewed, verified end-to-end)

**Implementation artifact:** `_bmad-output/implementation-artifacts/EXT-1-wxt-extension-setup-ui-integration-login.md`

**FRs addressed:** FR1, FR67, FR68, FR69 (Logged Out state)

**Key learnings (inform all future stories):**
- Chrome Side Panel API, not Shadow DOM content script
- Web Application OAuth client type (not Chrome Extension type)
- Tailwind v4 `@source` directive in `app.css` to scan `@jobswyft/ui/src`
- Lazy Supabase client initialization (avoid module-level crash)
- `action` key required in manifest for `onClicked`
- `panelClassName` override for ExtensionSidebar in Side Panel context

**Tech debt identified:**
- AUTH-01: `POST /v1/auth/google` (exchange token) — API has `/v1/auth/login` + `/callback`
- AUTH-02: `GET /v1/auth/me` (verify auth) — API has this
- AUTH-03: `POST /v1/auth/logout` (invalidate session) — API has this
- AUTH-04: Profile auto-creation on first login — Needs verification

---
