# Non-Functional Requirements

## Performance

**Response Time Requirements:**

- **NFR1:** Page scan completes within 2 seconds on standard job boards
- **NFR2:** AI generation (cover letter, outreach, coach messages) completes within 5 seconds
- **NFR3a:** Auto match analysis completes within 2 seconds of successful scan
- **NFR3b:** Detailed match analysis completes within 5 seconds of user request
- **NFR4:** Autofill executes within 1 second
- **NFR5:** Sidebar opens within 500ms of user click
- **NFR6:** Resume parsing completes within 10 seconds of upload
- **NFR6a:** AI generation endpoints (cover letter, outreach, coach) deliver responses via streaming (Server-Sent Events) with progressive text reveal and a user-accessible cancel option
- **NFR6b:** Match analysis and resume parsing return complete JSON responses (non-streaming)

**Accuracy Requirements:**

- **NFR7:** Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- **NFR8:** Fallback AI scan succeeds on 85%+ of unknown job sites
- **NFR9:** Autofill correctly maps 90%+ of standard form fields

**Rate Limiting UX:**

- **NFR52:** API rate limiting returns clear error responses with rate limit status and retry timing information

## Security

**Data Protection:**

- **NFR10:** All data transmitted between extension and API is encrypted using industry-standard transport security protocols
- **NFR11:** All data stored in database is encrypted at rest
- **NFR12:** Resume files are stored in encrypted file storage
- **NFR13:** OAuth tokens are stored securely (not in plaintext)
- **NFR14:** AI-generated outputs are never persisted to backend storage

**Access Control:**

- **NFR15:** Users can only access their own data (row-level security)
- **NFR16:** API endpoints require valid authentication
- **NFR17:** Session tokens expire after reasonable inactivity period
- **NFR45:** Admin Dashboard requires Supabase admin role for access — separate auth gate from User Dashboard
- **NFR46:** Admin actions (tier config changes, role assignments) are logged with timestamp and admin user ID

**Privacy Compliance:**

- **NFR18:** System supports GDPR right-to-deletion requests
- **NFR19:** System supports CCPA data access requests
- **NFR20:** User consent is obtained before data collection

## Reliability

**Availability:**

- **NFR21:** Backend API maintains 99.9% uptime (excluding planned maintenance)
- **NFR22:** No offline mode; extension displays clear "no connection" state when network is unavailable. All AI and data features require an active network connection.
- **NFR23:** AI provider failures are handled gracefully with user notification

**Error Handling:**

- **NFR24:** AI generation failures do not decrement user's usage balance
- **NFR25:** Scan failures display partial results with clear error indication
- **NFR26:** Network errors provide clear, actionable user feedback

**Stability & Sync:**

- **NFR47:** Extension crash rate below 0.1% across supported Chrome versions
- **NFR48:** OAuth authentication success rate of 99.5%+
- **NFR49:** Local extension state and backend data maintain 99.9% synchronization reliability

## Scalability (Post-MVP)

**Capacity Planning (Post-MVP Targets):**

- **NFR27:** System supports 50,000 monthly active users at 3 months post-launch (Post-MVP)
- **NFR28:** System supports 150,000 monthly active users at 12 months post-launch (Post-MVP)
- **NFR29:** Architecture supports scaling to handle increased concurrent user load without code changes (Post-MVP)

## Integration

**External Services:**

- **NFR30:** System maintains compatibility with Chrome Manifest V3 requirements
- **NFR31:** AI provider abstraction allows switching between Claude and GPT
- **NFR32:** Backend service handles auth, database, and storage operations
- **NFR33:** Payment processing system handles subscription lifecycle events (Post-MVP)

**Browser Compatibility:**

- **NFR34:** Extension functions on Chrome version 88+ (Manifest V3 baseline)
- **NFR35:** User Dashboard and Admin Dashboard support modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)

**Configuration Propagation:**

- **NFR50:** Configuration changes made via Admin Dashboard propagate to all surfaces within 5 minutes without code deploys or restarts
- **NFR51:** AI provider abstraction supports user-selectable model per request; model switching adds no latency beyond model-specific inference time

## Maintainability

**Code Quality:**

- **NFR36:** Codebase supports LLM-assisted development with clear module boundaries
- **NFR37:** API contract enables independent frontend/backend development
- **NFR38:** Each surface (API, User Dashboard, Admin Dashboard, Extension) is independently deployable

**Testing (MVP):**

- **NFR39:** Minimal automated testing acceptable for MVP
- **NFR40:** Production code must be thorough with comprehensive error handling
- **NFR41:** Backend API must handle all edge cases and failure scenarios

## Accessibility

- **NFR44a:** Extension and dashboards target WCAG 2.1 AA compliance for color contrast (4.5:1 normal text, 3:1 large text/UI components), keyboard navigation, and screen reader support
- **NFR44b:** All interactive elements are reachable via keyboard (Tab, Arrow keys, Enter, Escape)
- **NFR44c:** All icon-only buttons include descriptive ARIA labels for screen readers
- **NFR44d:** Color is never the sole indicator of information — always paired with text, icons, or numeric values
- **NFR44e:** All animations respect the `prefers-reduced-motion` system preference; users who enable reduced motion see instant state changes instead of animated transitions

## Logging & Observability (MVP)

- **NFR42:** Backend API includes comprehensive application logging
- **NFR43:** Logs viewable directly on Railway dashboard (no streaming required for MVP)
- **NFR44:** Log levels: ERROR, WARN, INFO for key operations

**Totals:** 52 NFRs across 8 quality areas.
