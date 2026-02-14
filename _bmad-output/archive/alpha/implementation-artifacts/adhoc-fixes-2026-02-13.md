# Ad-Hoc Fixes — 2026-02-13

## Session Context

- **Mode:** Quick-flow ad-hoc fix session
- **Backend API:** Running on `http://localhost:3001` (FastAPI/uvicorn)
- **Extension:** WXT Chrome extension, `WXT_API_URL=http://localhost:3001`
- **Started:** 2026-02-13 11:21 CST

## Fix Log

| #   | Issue                                                                                       | Status   | Notes                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Flood of `chrome-extension://invalid/` failed requests (5-10/sec), both authed and unauthed | ✅ Fixed | Supabase `createClient` defaulted to `autoRefreshToken`, `persistSession`, `detectSessionInUrl` — all poll/use `localStorage` which doesn't exist in extension contexts. Disabled all three in `auth.ts`. |
| 2   | `POST /v1/ai/extract-job` 422 on non-job pages                                              | ✅ Fixed | `performScan()` had no URL guard — fired on any tab. Added `detectJobPage` check inside `performScan` (defense-in-depth). Manual scan bypasses via `skipJobPageCheck: true`.                              |
