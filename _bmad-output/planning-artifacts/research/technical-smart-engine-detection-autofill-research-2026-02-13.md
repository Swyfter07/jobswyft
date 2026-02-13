---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/planning-artifacts/smart-engine-architecture.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Smart Engine Detection & Autofill Patterns — Competitive and Architectural Research'
research_goals: 'Identify how competitors solve detection/autofill, discover techniques and patterns for the open architecture questions, and refine the JobSwyft Smart Engine architecture'
user_name: 'jobswyft'
date: '2026-02-13'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical

**Date:** 2026-02-13
**Author:** jobswyft
**Research Type:** Technical

---

## Research Overview

[Research overview and methodology will be appended here]

---

## Technical Research Scope Confirmation

**Research Topic:** Smart Engine Detection & Autofill Patterns — Competitive and Architectural Research
**Research Goals:** Identify how competitors solve detection/autofill, discover techniques and patterns for the open architecture questions, and refine the JobSwyft Smart Engine architecture

**Technical Research Scope:**

- Architecture Analysis - how competitors architect detection engines; config-driven vs code-driven patterns; graceful degradation layers
- Implementation Approaches - DOM field detection techniques; heuristic/fuzzy matching; selector health and self-healing; snapshot-based testing
- Technology Stack - client-side DOM analysis; LLM-in-the-loop development; remote config sync for browser extensions
- Integration Patterns - user feedback/correction systems (Honey model); extension ↔ backend config sync; crowdsourced site support
- Performance Considerations - client-side detection latency; DOM snapshot serialization; AI fallback rate limiting and caching

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-02-13

---

## Technology Stack Analysis

### 1. Competitor Job Autofill Extensions

#### 1.1 Simplify Jobs (Simplify Copilot) — 1M+ users, closed-source

- Supports **100+ job boards and ATS portals** including Workday, Greenhouse, iCIMS, Taleo, Avature, Lever, SmartRecruiters
- Detection almost certainly URL-pattern-based combined with DOM fingerprinting
- Requires broad host permissions (tabs access for URL/page content inspection)
- AI-generated responses for open-ended questions (Simplify+ paid tier)
- Known issues: "incompatibility with some ATS or dropdown fields," "performance slowdowns"
- No open-source code; supporting 100+ platforms **strongly suggests remote config** approach
- _Source: [Simplify Copilot](https://simplify.jobs/copilot), [Chrome Web Store](https://chromewebstore.google.com/detail/simplify-copilot-autofill/pbanhockgagggenencehbnadejlgchfc), [Extpose Analysis](https://extpose.com/ext/pbanhockgagggenencehbnadejlgchfc)_

#### 1.2 LazyApply — Browser automation approach

- Primarily targets "Easy Apply" on LinkedIn, Indeed, ZipRecruiter (not arbitrary ATS)
- Uses **browser automation** (Selenium/Puppeteer-like) rather than content-script-based form injection
- Application window must remain visible/active for bot to function
- Platform-specific targeting suggests **hardcoded integrations**
- Cannot handle email verification codes, MFA, CAPTCHAs
- Users report: "silly mistakes while filling up forms," "inputting wrong information"
- _Source: [LazyApply](https://lazyapply.com/), [IESE MBA Review](https://iesemba.com/2023/11/i-tested-lazyapply-the-bot-that-applies-to-jobs-automatically/), [Wobo Review](https://www.wobo.ai/blog/lazyapply-review/)_

#### 1.3 JobFill — Smart autofill with privacy-first design

- **Dual approach**: basic heuristic autofill + user-configurable custom rules system
- **Auto-capture/learning**: saves user input first time, replays on matching fields later (form-field-to-answer cache keyed by question/label text)
- **Shadow DOM handling**: published blog post about SmartRecruiters' multi-layered Shadow DOM requiring custom traversal logic for nested shadow boundaries and `<slot>` elements
- **Auto-trigger**: runs autofill automatically when new fields appear (helps multi-step forms)
- _Source: [JobFill](https://jobfill.ai/), [JobFill Blog - SmartRecruiters Shadow DOM](https://jobfill.ai/docs/blog/)_

#### 1.4 job_app_filler (Open Source) — Most robust ATS-specific approach

- **XPath + MutationObserver architecture** targeting Workday, iCIMS specifically
- `BaseFormInput` class with static `XPATH` properties; subclasses override per field type
- `autoDiscover()` static method registers fields matching XPATH patterns
- `MutationObserver` continuously watches for DOM additions/removals
- Hierarchical answer storage: `page → section → field type → field name`
- _Source: [GitHub - berellevy/job_app_filler](https://github.com/berellevy/job_app_filler)_

#### 1.5 AI-Job-Autofill (Open Source) — Most config-driven approach

- Centralized **`ats-config.js`** managing 9 ATS platforms
- Config structure includes: iframe detection patterns (min 200×200px), ignored patterns (analytics/ad iframes), data extraction selectors, URL pattern matching (regex for company names from domain structures)
- Helper methods: `isATSDomain()`, `getATSPlatform()`, `sanitizeCompanyName()`, `isJobBoardName()`
- Uses **Google AI API (Gemini)** for intelligent form completion
- Supports: Greenhouse, Lever, Workday, Ashby, BambooHR, Workable, Jobvite, SmartRecruiters
- _Source: [GitHub - laynef/AI-Job-Autofill](https://github.com/laynef/AI-Job-Autofill)_

#### 1.6 ApplyEase (Open Source) — Most sophisticated architecture

- Full-stack: React + Chrome extension + **FastAPI backend** + PostgreSQL with **pgvector**
- LLM integration via local Ollama (`llama3.1:8b`) or LM Studio
- **Semantic matching**: SentenceTransformer `all-MiniLM-L6-v2` for vector embeddings
- Resume upload via `DataTransfer` objects with drag-and-drop fallback
- Custom question answering via `/custom-answer` endpoint (job description + question → contextual response)
- Uses **generic form detection** rather than site-specific parsers
- _Source: [GitHub - sainikhil1605/ApplyEase](https://github.com/sainikhil1605/ApplyEase)_

#### 1.7 Massive — Cloud-based "Apply as a Service"

- Autonomous agent on remote servers (headless execution), not primarily a browser extension
- Works well with **Lever and Greenhouse** (standard configs)
- **Struggles significantly with Workday** — account creation, CAPTCHAs, MFA loops cause failures
- 2.3/5 Trustpilot rating
- _Source: [Massive](https://usemassive.com/auto-apply-wizard), [Adzuna Review](https://www.adzuna.com/blog/usemassive-review-alternatives/)_

### 2. Password Manager Form Detection Patterns

#### 2.1 Bitwarden (Open Source) — Gold standard for field detection [High Confidence]

**DOM Collection Pipeline:**
```
getPageDetails() → scan DOM with selector:
  input:not([data-bwignore]), textarea:not([data-bwignore]),
  select:not([data-bwignore]), span[data-bwautofill]
```

**Attributes Extracted Per Field:**

| Category | Attributes |
|---|---|
| Core IDs | `htmlID`, `htmlName`, `htmlClass`, `opid` (assigned operation ID) |
| User-Facing Labels | `<label>` tag text, `placeholder`, `aria-label`, `data-label`, contextual labels (top/left/right positioning) |
| Functional | `type`, `autocomplete`, `autocompletetype`, `x-autocompletetype`, `maxLength`, `tabindex`, `title`, `rel` |
| Payment-Specific | `data-stripe`, `data-recurly` |

**Field Classification (`isFieldMatch()`):**
- Attribute priority order: `autoCompleteType → data-stripe → htmlName → htmlID → title → label-tag → placeholder → label-left → label-top → data-recurly`
- Case-insensitive matching against predefined constant arrays (e.g., `UsernameFieldNames`, `CardNumberFieldNames`, `AddressFieldNames`)
- Supports `regex=` prefix for flexible matching (e.g., `regex=^first.*name`)

**Fill Script Execution:** Click → Focus → Fill sequence via `opid`-based addressing (resilient to DOM changes between collection and fill time)

**Shadow DOM:** TreeWalker API with browser-specific shadow root access:
- Chrome: `chrome.dom.openOrClosedShadowRoot` (open + closed roots)
- Firefox: `Element.openOrClosedShadowRoot`
- Safari: `Element.shadowRoot` (open roots only)

**MutationObserver:** 100ms debounce for DOM mutations; targeted updates rather than full re-collection. 200-field limit with priority-based filtering.

_Source: [Bitwarden autofill-constants.ts](https://github.com/bitwarden/clients/blob/main/apps/browser/src/autofill/services/autofill-constants.ts), [Bitwarden Collecting Page Details](https://contributing.bitwarden.com/architecture/deep-dives/autofill/collecting-page-details/), [Bitwarden Shadow DOM](https://contributing.bitwarden.com/architecture/deep-dives/autofill/shadow-dom/)_

#### 2.2 1Password — Signal hierarchy with cross-origin iframe handling

- Checks: `id`, `name`, `autocomplete`, `<label>`, ARIA attributes, `placeholder`, `type="password"` with `passwordrules`
- **Cross-origin iframes**: Credit cards supported across origins; logins NOT autofilled if saved URL doesn't match iframe origin
- `data-1p-ignore` attribute to exclude fields
- Warns against: generated field names/IDs, dynamically adding/removing fields, overlays instead of `placeholder`
- _Source: [1Password Compatible Website Design](https://developer.1password.com/docs/web/compatible-website-design/), [1Password Autofill Security](https://support.1password.com/browser-autofill-security/)_

#### 2.3 KeePassXC (Open Source) — Multi-stage pipeline with site exception lists

**Detection Pipeline:**
```
kpxc.initCredentialFields()
  → kpxcFields.getAllPageInputs()      // Find all inputs
  → kpxc.identifyFormInputs()          // Filter invisible/search
  → kpxc.initCombinations()            // Pair username+password
  → kpxcIcons.initIcons()              // Show lock icons
  → kpxc.retrieveCredentials()         // Fetch stored passwords
```

**Visibility Checks (`isVisible`):** Position within viewport (x>0, y>0), min 2px width/height, CSS visibility not hidden, opacity 0.1–1.0, must be **topmost element** via `elementFromPoint()` at three horizontal positions.

**Site-Specific Exception Lists:** `PREDEFINED_SITELIST` (single-input-field mode), `IMPROVED_DETECTION_PREDEFINED_SITELIST`, `siteMatch()` for URL pattern matching.

_Source: [KeePassXC Browser Wiki](https://github.com/keepassxreboot/keepassxc-browser/wiki/Extension-details)_

### 3. Honey / PayPal Honey — Server-Driven Config Architecture [High Confidence]

**Tiered server-driven configuration:**
1. **Domain whitelist**: Extension queries server for supported domains (~30,000+ merchants)
2. **Store detection**: When visiting supported domain, fetches per-merchant config
3. **CSS selectors**: Server returns `pns_siteSelCartCodeBox` with selectors (e.g., `"#coupon-code, [name='coupon']"`)
4. **Sub-ID selectors**: `pns_siteSelSubId1` through `pns_siteSelSubId3` extract page element text

**Code application:** Direct JavaScript injection + sandboxed AST execution ("DAC") with AES encryption

**Key insight:** Selector configurations maintained **centrally on servers**. When sites change DOM, Honey's team updates server-side config. Extension contains **no hardcoded per-site selectors**.

**Scale:** Node.js, Express, GraphQL, React stack. Migrated from MySQL to Spanner at ~10M users. Billions of requests/day via resolver-first GraphQL microservice layer.

_Source: [Wladimir Palant: What Would You Risk For Free Honey?](https://palant.info/2020/10/28/what-would-you-risk-for-free-honey/), [Honey Engineering Blog](https://medium.com/paypal-tech/problems-scale-and-video-games-welcome-to-the-honey-tech-blog-12fa45620c2d)_

### 4. DOM Detection Techniques

#### 4.1 Browser Autofill Engines — Multi-Signal Classification [High Confidence]

**Chromium's pipeline** (production, billions of users):
1. `autocomplete` attribute (highest priority)
2. `name`/`id` attribute regex matching (language-specific patterns, 10+ locales)
3. Label text analysis (traverses 10 DOM levels up)
4. Placeholder text (fallback)
5. Server-side field type prediction

**Firefox FormAutofill** (three-tier):
1. `autocomplete` attribute
2. **Fathom ML system** — weighted rules on DOM features for credit card fields
3. Regex matching against `id`, `name`, `placeholder`, label text
4. Post-classification heuristics for sequential/contextual refinement

_Source: [Chromium Form Autofill Design](https://www.chromium.org/developers/design-documents/form-autofill/), [Firefox FormAutofill Heuristics](https://searchfox.org/firefox-main/source/toolkit/components/formautofill/shared/HeuristicsRegExp.sys.mjs)_

#### 4.2 Fuzzy Matching Algorithms

| Category | Algorithms | Use Case |
|---|---|---|
| Character-based | Levenshtein, Jaro-Winkler | `firstName` vs `first_name` |
| Token-based | Jaccard, Cosine similarity | Multi-word labels |
| Semantic | TF-IDF, embeddings | Understanding field intent |
| Hybrid | Fellegi-Sunter probabilistic | Combining multiple signals |

**Fuse.js** — leading JS fuzzy matching library (modified Bitap algorithm), supports weighted search across multiple object keys.

_Source: [Fuse.js](https://www.fusejs.io/)_

#### 4.3 Similo Algorithm — Academic Gold Standard for Element Relocation [High Confidence]

14-parameter weighted similarity scoring:

| Property | Weight | Similarity Function |
|---|---|---|
| Tag, ID, Name, Visible Text, Neighbor Texts | 1.5 each | Equality / Levenshtein / Word set |
| Class, HRef, Alt, XPath, ID-XPath, Is Button, Location, Area, Shape | 0.5 each | Levenshtein / Euclidean distance |

`score = SUM(weight_i × similarity_function_i(target_i, candidate_i))`

_Source: [Similo Paper (ACM TOSEM 2022)](https://dl.acm.org/doi/10.1145/3571855), [Similo2 GitHub](https://github.com/michelnass/Similo2)_

### 5. Self-Healing / Resilient Selectors

#### 5.1 Healenium (Open Source) — DOM Tree Comparison with LCS

1. Snapshot storage: captures DOM state as tree on each successful run (PostgreSQL)
2. When `NoSuchElementException` occurs: compares stored tree vs current DOM via **Longest Common Subsequence (LCS)** algorithm
3. Gradient-boosted attribute weights (tag, ID, class, value, etc.)
4. Score-cap parameter (default 0.5) — minimum acceptable match score
- _Source: [Healenium](https://healenium.io/), [GitHub](https://github.com/healenium/healenium-web)_

#### 5.2 Scrapling (Python) — Adaptive Element Fingerprinting

```python
products = page.css('.product', auto_save=True)   # First run: save fingerprint
products = page.css('.product', adaptive=True)     # Later: relocate if selector breaks
```
Stores element fingerprints in SQLite. Performance: **2.46ms per adaptive lookup**.
- _Source: [Scrapling GitHub](https://github.com/D4Vinci/Scrapling)_

#### 5.3 Selector Priority Hierarchy

| Priority | Selector Type | Rationale |
|---|---|---|
| 1 (highest) | `data-testid` | Immune to styling changes |
| 2 | `aria-label`, `role` | Stable semantic meaning |
| 3 | `id` | Fast lookup; can be dynamic in SPAs |
| 4 | `name` | Stable for form elements |
| 5 | Visible text | May change with i18n |
| 6 | CSS class | Changes with UI redesigns |
| 7 | XPath / position | Most brittle |

### 6. Browser Extension Testing Without Chrome

#### 6.1 Snapshot-Based Testing with jsdom/happy-dom

```typescript
// Load saved ATS HTML as fixture
const html = readFileSync('fixtures/greenhouse-application.html', 'utf-8');
const dom = new JSDOM(html);
const fields = detectFields(dom.window.document);
expect(fields).toContainEqual(
  expect.objectContaining({ type: 'firstName', confidence: expect.any(Number) })
);
```

**Performance:** happy-dom is **5-10x faster** than jsdom, lower memory. jsdom has more complete API surface.

**Best practice:** jsdom/happy-dom for unit tests + Playwright persistent context for E2E extension integration tests.

_Source: [jsdom](https://github.com/jsdom/jsdom), [happy-dom](https://github.com/capricorn86/happy-dom), [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions)_

#### 6.2 Playwright Extension Testing

```typescript
const context = await chromium.launchPersistentContext('', {
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});
```
Chromium-only, persistent context mandatory.

### 7. Config-Driven Extension Architectures

#### 7.1 Remote Config Sync Pattern (Manifest V3 Compatible)

```typescript
// Fetch JSON config from API (allowed under MV3 — no remotely-hosted code restriction)
chrome.alarms.create('config-sync', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const response = await fetch('https://api.example.com/extension/config');
  const config = await response.json();
  await chrome.storage.local.set({ config, configVersion: config.version, lastSync: Date.now() });
});
```

#### 7.2 Delta Update Mechanism

```typescript
interface ConfigDelta {
  version: number;
  baseVersion: number;
  additions: Record<string, ATSConfig>;
  removals: string[];
  modifications: Record<string, Partial<ATSConfig>>;
}
```

### 8. LLM-in-the-Loop Development

#### 8.1 llm-scraper — Generate Reusable Code

```typescript
const scraper = new LLMScraper(openai('gpt-4o'));
// Generate reusable code (no LLM needed for subsequent runs)
const { code } = await scraper.generate(page, Output.object({ schema }));
```
Key feature: `.generate()` creates pure Playwright code runnable without LLM calls.
- _Source: [llm-scraper GitHub](https://github.com/mishushakov/llm-scraper)_

#### 8.2 LLM-Enhanced Similo (Hybrid Approach) [High Confidence]

1. VON Similo algorithm ranks all page elements by similarity score
2. Top 10 candidates converted to JSON
3. GPT-4 receives target element description + 10 candidates → returns best match
4. **Better accuracy than either approach alone** — but has reproducibility limitations
- _Source: [LLM-Enhanced Similo (Wiley)](https://onlinelibrary.wiley.com/doi/10.1002/stvr.1893)_

#### 8.3 DOM Preprocessing for LLM Extraction

**NEXT-EVAL study finding**: Flat JSON gives LLMs the best extraction accuracy compared to raw HTML or hierarchical structures. Clean Markdown works better for RAG.

Best practices: Strip `<script>`, `<style>`, unnecessary attributes before sending. Use temperature 0 for deterministic output. Few-shot examples dramatically improve accuracy.

_Source: [Crawl4AI LLM Strategies](https://docs.crawl4ai.com/extraction/llm-strategies/), [WebScraping.AI Prompt Engineering](https://webscraping.ai/faq/scraping-with-gpt/how-do-i-implement-prompt-engineering-for-web-scraping-tasks)_

### 9. Crowdsourced Site Support Systems

#### 9.1 Honey's Server-Driven Model

- Per-merchant configs maintained centrally on Honey's servers
- Extension fetches config on domain match → receives CSS selectors for that merchant
- When site changes DOM, team updates server config → all users get fix immediately
- No extension update required for new site support

#### 9.2 uBlock Origin Community Filter Lists [High Confidence]

- Hierarchical subscription system with automatic updates
- **Differential updates** (Diff-Expires directive) since v1.54.0 — no full list re-download
- Update cycle: initial 105s after startup, then every 15s during sessions, 1h between sessions
- Third-party lists via Manual Import (paste URLs), approved website subscriptions, right-click subscription
- **"Badlists" infrastructure** — blocks harmful/incompatible lists for security/stability
- Quality control: active maintenance by dedicated list maintainers (EasyList, AdGuard)

_Source: [uBlock Origin Filter Lists Wiki](https://github.com/gorhill/ublock/wiki/Dashboard:-Filter-lists)_

#### 9.3 User Correction Patterns Across Tools

| Tool | Approach |
|---|---|
| **Bitwarden** | Users create Linked Custom Fields with `regex=` prefix for flexible matching |
| **1Password** | Auto-detects additional fields beyond username/password |
| **KeePassXC** | "Choose Custom Login Fields" banner for per-site field designation |
| **JobFill** | Auto-capture: saves user input, replays on matching questions |
| **Honey** | Team manually creates merchant configs; no user-facing fallback |

### 10. ATS Platform Landscape

#### 10.0 ATS Market Share (2024-2025) [High Confidence]

| ATS Platform | Market Share | Segment |
|---|---|---|
| iCIMS | 10.7% (overall leader) | Enterprise |
| Workday | 37.1% of Fortune 500 | Large enterprise |
| Oracle (Taleo/SuccessFactors) | 13.4% of Fortune 500 | Legacy enterprise |
| Greenhouse | Growing (~5pt gain since 2019) | Mid-market / Tech |
| Lever | Growing | Mid-market / Startups |
| SmartRecruiters | Top 10 | Mid-market |
| BambooHR | SMB focused | Small business |
| JazzHR | SMB focused | Small business |

Top 10 vendors hold 51.1% of total market. Global ATS market: $3.28B (2025), projected $4.88B by 2030 (8.2% CAGR).

_Source: [AppsRunTheWorld Top 10 ATS](https://www.appsruntheworld.com/top-10-hcm-software-vendors-in-applicant-tracking-market-segment/), [Jobscan Fortune 500 ATS Report](https://www.jobscan.co/blog/fortune-500-use-applicant-tracking-systems/)_

#### 10.1 Platform Form Structures

| Platform | DOM Characteristics | Autofill Difficulty |
|---|---|---|
| **Greenhouse** | `data-gh="..."` attributes, `question_{id}` naming for custom fields, Job Board API available | Medium — consistent structure, React-controlled |
| **Lever** | `div.lever` container, hosted forms with customizable required/URL fields | Low-Medium — relatively standard |
| **Workday** | React + custom web components, unique accounts per employer, CAPTCHAs, MFA | **Very High** — most tools fail here |
| **SmartRecruiters** | **Multi-layered nested Shadow DOM**, `<slot>` elements separating labels from inputs, Application API with `GET /postings/:uuid/configuration` | High — Shadow DOM requires custom traversal |
| **iCIMS** | Variable structure across implementations | Medium-High |

#### 10.2 Workday-Specific Challenges [High Confidence]

Every company's Workday form looks similar but **doesn't share data**. Standard fields (name, contact, address, education, work experience) are consistent, but employers add unlimited custom fields. Workday requires:
- Unique account creation per employer application
- CAPTCHAs and MFA loops
- Full-screen resolution for some elements to render
- Native setter bypass for React controlled forms + proper event dispatching

_Source: [JobWizard - Workday Applications](https://www.jobwizard.ai/post/workday-job-applications-made-simple)_

#### 10.3 React Controlled Form Bypass (Critical Technique) [High Confidence]

```javascript
// Standard element.value = 'X' does NOT work with React
const nativeSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, 'value'
).set;
nativeSetter.call(input, newValue);
input.dispatchEvent(new Event('change', { bubbles: true }));
```
Required for Greenhouse, Workday, and most modern ATS platforms.

_Source: [React Issue #10135](https://github.com/facebook/react/issues/10135), [Cory Rylan](https://coryrylan.com/blog/trigger-input-updates-with-react-controlled-inputs)_

### 11. Cross-Cutting Technology Adoption Trends

#### 11.1 Three Tiers of Form Detection (Industry Evolution)

| Tier | Approach | Examples | Trend |
|---|---|---|---|
| **Tier 1** | Hardcoded CSS selectors per ATS | workpls, job-autofiller | Legacy — breaks on site changes |
| **Tier 2** | XPath + MutationObserver + centralized config | job_app_filler, AI-Job-Autofill, Honey | Current mainstream — config-driven |
| **Tier 3** | LLM-based semantic analysis (no fixed selectors) | ApplyEase, job.ki (MVST), VeloFill | **Emerging dominant approach** |

#### 11.2 Config-Driven vs Hardcoded (Industry Split)

| Approach | Tools | Trade-off |
|---|---|---|
| Fully hardcoded per ATS | workpls, job-autofiller | Fast/reliable but breaks with site changes |
| Centralized config file | AI-Job-Autofill (9 ATS in one config) | Maintainable, single point of truth |
| User-configurable rules | JobFill | Pushes edge-case handling to users |
| Auto-learning/capture | JobFill, SpeedyApply | Builds config from user behavior |
| LLM-adaptive (no fixed config) | job.ki, ApplyEase | Most resilient but API-cost dependent |
| **Server-pushed remote config** | Honey (confirmed), Simplify (inferred) | **Best for scale** — update without extension release |

#### 11.3 Key Finding: No Tool Has Full Solution

**No tool was found to publicly document a combined system** with:
- Multi-layer graceful degradation (URL → structured data → selectors → heuristics → AI)
- User correction feedback loop flowing into shared config
- Crowdsourced site support with voting/priority
- LLM-in-the-loop development with snapshot regression tests
- Config sync with delta updates

JobSwyft's Smart Engine architecture vision is **more comprehensive** than any single competitor's approach found in this research.

### 12. Structured Data Standards & Unified ATS APIs

#### 12.1 HR Open Standards (formerly HR-XML Consortium)

- Non-profit, volunteer-led, founded 1999
- Publishes open data exchange standards (JSON and XML) for HR data
- **JobPosting schema**: structured job opening information (title, description, contact, how to apply)
- Moving from XML to JSON/APIs as of 2024
- _Source: [HR Open Standards](https://www.hropenstandards.org/)_

#### 12.2 Unified ATS APIs (Emerging Standard)

| Provider | Coverage | Normalized Objects |
|---|---|---|
| **Merge.dev** | 40+ ATS integrations | Application, Candidate, Job, Offer |
| **Unified.to** | 60+ ATS platforms | Standardized CRUD operations |
| **Kombo.dev** | European/global markets | Unified ATS API |

These normalize the fragmented ATS landscape into standard object models — potentially useful for backend-side job data extraction as a complement to client-side DOM parsing.

_Source: [Merge.dev ATS API](https://www.merge.dev/categories/ats-recruiting-api), [Unified.to](https://docs.unified.to/ats/overview)_

### 13. Open-Source Reference Implementations

| Project | Architecture | ATS Coverage | Key Pattern |
|---|---|---|---|
| [job_app_filler](https://github.com/berellevy/job_app_filler) | XPath + MutationObserver + class hierarchy | Workday, iCIMS | Per-ATS module with `autoDiscover()` |
| [AI-Job-Autofill](https://github.com/laynef/AI-Job-Autofill) | Centralized `ats-config.js` + Gemini AI | 9 ATS platforms | Config-driven + LLM fallback |
| [ApplyEase](https://github.com/sainikhil1605/ApplyEase) | FastAPI + pgvector + local LLM | Generic form detection | Semantic matching for custom questions |
| [workpls](https://github.com/jeffistyping/workpls) | Provider-based modules | Lever, Greenhouse | Per-provider directory structure |
| [Bitwarden](https://github.com/bitwarden/clients) | Multi-signal field classification pipeline | Universal form detection | `opid` addressing + TreeWalker shadow DOM |
| [KeePassXC Browser](https://github.com/keepassxreboot/keepassxc-browser) | Multi-stage pipeline + site exception lists | Universal form detection | Visibility checks + `elementFromPoint()` |
| [Syrup](https://github.com/Abdallah-Alwarawreh/Syrup) | Open-source Honey alternative | E-commerce coupon fields | Server-driven per-store config |
| [Firefox FormAutofill](https://searchfox.org/firefox-main/source/toolkit/components/formautofill/shared/HeuristicsRegExp.sys.mjs) | ML (Fathom) + regex heuristics | Universal form detection | Three-tier classification (autocomplete → ML → regex) |

---

## Integration Patterns Analysis

### 1. Extension Internal Communication (Content Script ↔ Service Worker)

#### 1.1 One-Time Message Passing (`chrome.runtime.sendMessage`)

The simplest pattern for request-response communication. Content scripts send a message and await a response.

```javascript
// Content script
const response = await chrome.runtime.sendMessage({ type: "FETCH_CONFIG", key: "autofill_settings" });

// Service worker (background.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_CONFIG") {
    chrome.storage.local.get(message.key).then(data => {
      sendResponse({ success: true, data });
    });
    return true; // Keep channel open for async sendResponse
  }
});
```

Key details:
- Return `true` from the listener to keep the channel open for async responses
- As of Chrome 144+, you can return a `Promise` instead of using `sendResponse`
- Maximum message size is 64 MiB
- Chrome uses JSON serialization (not structured clone), so `undefined` values become `null`

_Source: [Message passing - Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)_

#### 1.2 Port-Based Long-Lived Connections (`chrome.runtime.connect`)

For continuous bidirectional communication (e.g., streaming AI responses, real-time field-fill status):

**Port lifecycle in MV3 (critical):**
- Each message sent through a port resets the 30-second idle timer (Chrome 114+)
- Opening a port alone does NOT reset the timer — only sending messages does
- Ports disconnect after approximately 5 minutes of inactivity in MV3 (unlike MV2 where connections were stable indefinitely)
- The `onDisconnect` event fires when a port is closed by either end or when the service worker terminates

_Source: [Message passing - Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/messaging), [Port disconnect in MV3 - GitHub Issue](https://github.com/GoogleChrome/developer.chrome.com/issues/504)_

#### 1.3 Content Script ↔ Injected Script Communication (DOM Events)

Content scripts run in an **isolated world** — they share the DOM with the page but not JavaScript variables. Two patterns:

**Pattern A: `CustomEvent` on `document` (recommended — more targeted)**
```javascript
// Injected script (main world)
document.dispatchEvent(new CustomEvent("jobswyft-ats-data", {
  detail: { system: "lever", fields: [...] }
}));

// Content script (isolated world)
document.addEventListener("jobswyft-ats-data", (event) => {
  chrome.runtime.sendMessage({ type: "ATS_DATA", ...event.detail });
});
```

**Pattern B: `window.postMessage` (simpler but less secure)**
- Always validate `event.source === window` and check `event.data.type`
- Malicious pages can spoof `postMessage` — never trust incoming data without validation

**In MV3:** Use `world: "MAIN"` in the manifest or `chrome.scripting.executeScript({ world: "MAIN" })` instead of DOM injection.

_Source: [Content scripts - Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)_

#### 1.4 Service Worker Lifecycle and Keepalive Patterns [High Confidence]

The MV3 service worker is **ephemeral** — it can be killed at any time and must be designed for resilience.

**Termination rules:**
- **30-second idle timeout**: Terminates after 30 seconds with no events or API calls
- **5-minute execution limit**: Any single request/event processing cannot exceed 5 minutes
- **30-second fetch timeout**: A `fetch()` call exceeding 30 seconds triggers termination

**What resets the 30-second idle timer (Chrome 110+):**
- Any incoming extension event
- Calling any Chrome extension API
- Sending/receiving WebSocket messages (Chrome 116+)
- Sending messages through ports (Chrome 114+)
- Messages from offscreen documents (Chrome 109+)
- Native messaging connections (Chrome 105+)

**Keepalive strategies (ranked by reliability):**

| Strategy | Mechanism | Reliability |
|---|---|---|
| Offscreen Document + Periodic Ping (Chrome 109+) | Persistent offscreen doc pings service worker every 20s | Most reliable for persistent tasks |
| Port-Based Self-Connect ("Highlander" Method) | Service worker connects to itself, reconnects on disconnect | Good, but complex |
| Alarm-Based Wakeup (Chrome 120+) | `chrome.alarms.create` with 30s minimum interval | Simple, reliable for periodic work |
| WebSocket Heartbeat (Chrome 116+) | 20s heartbeat keeps connection alive | Good for bidirectional real-time |

**Robust content-script reconnection pattern:**
```javascript
let port = null;
function connect() {
  port = chrome.runtime.connect({ name: "main-channel" });
  port.onMessage.addListener(handleMessage);
  port.onDisconnect.addListener(() => {
    port = null;
    if (chrome.runtime.lastError) {
      console.warn("Extension context invalidated, stop reconnecting");
      return;
    }
    setTimeout(connect, 1000); // Exponential backoff in production
  });
}
connect();
```

_Source: [Extension service worker lifecycle - Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [Longer extension service worker lifetimes - Chrome Blog](https://developer.chrome.com/blog/longer-esw-lifetimes)_

---

### 2. Extension ↔ Backend API Communication

#### 2.1 Storage API Comparison

| Property | `storage.local` | `storage.sync` | `storage.session` |
|---|---|---|---|
| **Quota** | 10 MB (unlimitedStorage available) | ~100 KB total, 8 KB/item, 512 items max | 10 MB |
| **Persistence** | Until extension removal | Syncs across Chrome instances | In-memory only; cleared on extension disable/restart |
| **Write limits** | None | 120/min, 1800/hour | None |
| **Encryption** | Not encrypted on disk | Not encrypted on disk | In-memory (not persisted) |
| **Content script access** | Exposed by default | Exposed by default | Not exposed by default |

**Recommended usage for JobSwyft:**
- **`storage.local`**: User resumes, job history, cached config from backend, telemetry event queue
- **`storage.sync`**: User preferences that follow across devices (theme, autofill toggles, notification settings)
- **`storage.session`**: Auth tokens, temporary session state, in-flight form data. Ideal for JWT access tokens since they auto-clear

**Reactive updates with `onChanged`:**
```javascript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.config) {
    applyConfig(changes.config.newValue);
  }
});
```

_Source: [chrome.storage API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/storage)_

#### 2.2 Periodic Background Sync via `chrome.alarms`

The `chrome.alarms` API is the **only reliable** way to schedule periodic tasks in MV3. `setTimeout`/`setInterval` are unreliable because they are killed when the service worker terminates.

```javascript
chrome.alarms.create("sync-config", { periodInMinutes: 5 });
chrome.alarms.create("flush-telemetry", { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case "sync-config": await syncConfigFromBackend(); break;
    case "flush-telemetry": await flushTelemetryBatch(); break;
  }
});
```

Key specs:
- Minimum interval: **30 seconds** (Chrome 120+, previously 1 minute)
- Maximum active alarms: **500** (Chrome 117+)
- Alarms generally persist across extension updates but should be re-created on startup as safety measure
- Alarms that fire during device sleep will fire upon wakeup

_Source: [chrome.alarms API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/alarms)_

#### 2.3 Fetch API with Retry and Exponential Backoff

**Critical**: `fetch()` responses that take more than 30 seconds to arrive can trigger service worker termination. Always use timeouts shorter than 30 seconds.

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      if (response.ok) return response;
      // Don't retry 4xx errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429)
        throw new Error(`Client error: ${response.status}`);
      // Retry on 429 (rate limit) and 5xx with exponential backoff
      const retryAfter = response.headers.get("Retry-After");
      await delay(retryAfter ? parseInt(retryAfter) * 1000 : 1000 * Math.pow(2, attempt));
    } catch (error) {
      if (error.name !== "AbortError") throw error;
      await delay(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error("Max retries exceeded");
}
```

_Source: [Cross-origin network requests - Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)_

#### 2.4 CORS and Cross-Origin Patterns

| Context | CORS Behavior | Solution |
|---|---|---|
| Service worker / extension pages | Bypass CORS with `host_permissions` in manifest | Declare API domains in `host_permissions` |
| Content scripts | Subject to **host page's** same-origin policy | Relay requests through service worker via message passing |

```json
{
  "host_permissions": [
    "https://api.jobswyft.com/*",
    "https://*.supabase.co/*"
  ]
}
```

Content scripts cannot make cross-origin requests even with `host_permissions` — the standard pattern is to relay through the service worker.

_Source: [Cross-origin network requests - Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests), [Extension Content Script Fetches - Chromium](https://www.chromium.org/Home/chromium-security/extension-content-script-fetches/)_

---

### 3. ATS Platform API Integration

#### 3.1 Greenhouse Job Board API [High Confidence]

Greenhouse provides the most complete public-facing API for external application integration.

**Key Endpoints:**

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /boards/{board_token}/jobs` | GET | List all published jobs |
| `GET /boards/{board_token}/jobs/{id}?questions=true` | GET | Get job details + application questions |
| `POST /boards/{board_token}/jobs/{id}` | POST | Submit an application |

**Form Configuration (`?questions=true`):** Returns a `questions` array with each question containing:
```json
{
  "required": true,
  "label": "Resume/CV",
  "fields": [
    { "name": "resume", "type": "input_file", "values": [] },
    { "name": "resume_text", "type": "textarea", "values": [] }
  ]
}
```

**Supported Field Types:** `input_text`, `input_file`, `input_hidden`, `textarea`, `multi_value_single_select`, `multi_value_multi_select`

**Application Submission:** Accepts both `multipart/form-data` (for resume uploads) and `application/json`. Requires Base64-encoded Job Board API Key for Basic Auth. Custom questions submitted as `question_{id}` fields.

_Source: [Greenhouse Job Board API Documentation](https://developers.greenhouse.io/job-board.html), [Greenhouse API Overview](https://support.greenhouse.io/hc/en-us/articles/10568627186203-Greenhouse-API-overview)_

#### 3.2 Lever Postings API

**Base URLs:** Global: `https://api.lever.co/v0/postings/` | EU: `https://api.eu.lever.co/v0/postings/`

**Application submission fields:**
- Required: `name`, `email` (must contain "@")
- Optional: `resume` (multipart), `phone`, `org`, `urls`, `comments`, `source`, `consent.marketing`, `consent.store` (GDPR)

**Rate Limiting:** Max 2 POST requests per second. Returns HTTP 429 on excess.

**Deduplication:** Candidates matched by email; duplicate emails link to existing contacts.

_Source: [Lever Postings API](https://github.com/lever/postings-api), [Lever Developer Documentation](https://hire.lever.co/developer/documentation)_

#### 3.3 SmartRecruiters Application API

**Key Endpoints:**

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /postings/:uuid/configuration` | GET | Get screening questions, privacy policies |
| `POST /postings/:uuid/candidates` | POST | Submit application |
| `GET /postings/:uuid/candidates/:id/status` | GET | Check application status |

**Configuration details:**
- `conditionalsIncluded` query parameter enables conditional screening questions
- Questions marked with compliance type `"DIVERSITY"` must be displayed separately with specific instructional text
- Privacy policy links must be presented with consent checkbox
- Authentication via `X-SmartToken` HTTP header

**Rate Limiting:** Max 8 concurrent requests, 128-second timeout recommended.

_Source: [SmartRecruiters Application API](https://developers.smartrecruiters.com/docs/application-api-1), [SmartRecruiters Posting API](https://developers.smartrecruiters.com/docs/posting-api)_

#### 3.4 Workday — No Public API, DOM is Primary Option [High Confidence]

Workday does **not** have a public-facing API for external job applications:
- The Workday Staffing REST API exists but requires authenticated ISU (Integrated System User) with partner-level access
- SOAP-based endpoints (`Get_Candidates`, `Put_Candidates`) require enterprise authorization
- **For external autofill, DOM scraping is the only practical option**

**Workday DOM Challenges:**
- React controlled form fields require `onChange` events; fields with frontend validation need `onBlur` triggers
- `MutationObserver` essential since fields are dynamically injected based on user interactions
- Field correlation uses hierarchical path: `page > section > fieldType > fieldName`

_Source: [Workday API Integration Guide](https://www.getknit.dev/blog/workday-api-integration-in-depth), [Job App Filler (Workday extension)](https://github.com/berellevy/job_app_filler)_

#### 3.5 iCIMS Talent Cloud API

- Application Submission: `POST https://api.icims.com/customers/{customerId}/applicantworkflows`
- Job Portal API for listing jobs and retrieving posting details
- Requires partner-level authentication — DOM scraping likely needed for autofill

_Source: [iCIMS Workflows API](https://developer-community.icims.com/applications/applicant-tracking/workflows-api)_

#### 3.6 Cross-ATS API Strategy

| ATS | Strategy | Confidence |
|---|---|---|
| **Greenhouse** | Use Job Board API for form config + submission | High — well-documented public API |
| **Lever** | Use Postings API for job data + submission | High — good public API |
| **SmartRecruiters** | Use Application API for screening questions + submission | High — structured API |
| **Workday** | DOM scraping only (MutationObserver + React event triggers) | Medium — fragile but proven |
| **iCIMS** | DOM scraping preferred (API requires partner access) | Medium |

**Cross-ATS Standards:** No widely-adopted single standard, but HR Open Standards Consortium (formerly HR-XML) publishes JSON/XML schemas. Practical interoperability achieved through middleware/mapping. All major ATS APIs use REST + JSON and share a similar conceptual model: `posting/job → questions/configuration → application submission`.

_Source: [HR Open Standards Consortium](https://www.hropenstandards.org/)_

---

### 4. User Feedback & Correction Data Pipeline

#### 4.1 Element Picker / Selector Capture Implementation [High Confidence]

**uBlock Origin Element Picker** provides the best reference architecture:
1. User activates picker via toolbar icon → enters hover-to-highlight mode
2. On click, system generates multiple possible selectors (network filters by URL, cosmetic filters by CSS)
3. **Depth slider** controls how broad/narrow the selection (lower depth = larger area)
4. **Specificity slider** controls CSS selector precision (higher = fewer matches)
5. Real-time preview of what the filter would affect
6. Domain-scoped persistence

**JavaScript Libraries for Selector Generation:**

| Library | NPM Package | Key Feature |
|---|---|---|
| **css-selector-generator** | `css-selector-generator` | Generates shortest unique CSS selectors, supports Shadow DOM, configurable strategy |
| css-path | `css-path` | Gets unique CSS path to DOM element |
| unique-selector | `unique-selector` | Generates unique CSS selector for analytics |

**`css-selector-generator` is recommended** — supports 6 selector strategies (`id`, `class`, `tag`, `attribute`, `nthchild`, `nthoftype`), Shadow DOM, JSDOM server-side validation, blacklist/whitelist patterns.

_Source: [uBlock Origin Element Picker](https://github.com/gorhill/ublock/wiki/Element-picker), [css-selector-generator (GitHub)](https://github.com/fczbkk/css-selector-generator)_

#### 4.2 User Correction Data Model

```typescript
interface ElementCorrection {
  // Identity
  id: string;                    // UUID
  userId: string;                // Submitting user
  timestamp: string;             // ISO 8601

  // URL context
  urlPattern: string;            // Regex or glob matching the page
  exactUrl: string;              // Full URL where correction was made
  atsType: string;               // "greenhouse" | "lever" | "workday" | "unknown"

  // Element identification (multiple strategies for resilience)
  cssSelector: string;           // Primary: ".job-title > h1"
  xpath: string;                 // Fallback: "/html/body/div[2]/h1"
  textContent: string;           // Visible text for validation
  ariaLabel?: string;            // Accessibility label if present
  nearbyText?: string;           // Surrounding text context for fuzzy matching

  // Correction details
  expectedFieldType: string;     // "job_title" | "company" | "location" | "salary" etc.
  currentMappedAs?: string;      // What the system currently maps it as
  correctedValue?: string;       // What the correct value should be

  // Metadata
  confidence: number;            // 0-1, how confident the user is
  pageStructureHash: string;     // Hash of key structural elements for change detection
  browserInfo: string;           // User agent for debugging
}
```

**Best practice:** Store multiple selector strategies per element. CSS selectors are more readable; XPaths are more precise for deeply nested structures. Text content provides a validation fallback when selectors break.

_Source: [BugHerd Extension](https://chromewebstore.google.com/detail/bugherd-visual-feedback-b/popigpemobhbfkhnnkllkjgkaabedgpb), [Page Feedback Annotator](https://chromewebstore.google.com/detail/page-feedback-annotator/cgmgndbmhjnbfiajfbdkndnbjhkfpmcd)_

---

### 5. Crowdsourced Config Aggregation

#### 5.1 Threshold-Based Rule Creation

**Pattern: N reports from M distinct users triggers new rule**

```
Confidence Score = (agreeing_reports / total_reports) × log(distinct_users + 1)

If confidence_score > THRESHOLD and distinct_users >= MIN_USERS:
    promote_to_candidate_rule()
```

**Practical implementation:**
```typescript
interface CrowdsourcedRule {
  urlPattern: string;
  fieldType: string;
  selectors: SelectorReport[];
  agreementCount: number;
  totalReports: number;
  distinctUsers: number;
  status: "pending" | "candidate" | "approved" | "rejected";
}

function shouldPromote(rule: CrowdsourcedRule): boolean {
  const MIN_USERS = 3;
  const AGREEMENT_RATIO = 0.7;
  return rule.distinctUsers >= MIN_USERS
    && (rule.agreementCount / rule.totalReports) >= AGREEMENT_RATIO;
}
```

_Source: [Majority Voting in Crowdsourcing (arXiv)](https://arxiv.org/abs/2111.06390)_

#### 5.2 Community Filter List Model (uBlock Origin Pattern)

Adapted for JobSwyft:

| uBlock Concept | JobSwyft Equivalent |
|---|---|
| Cosmetic filter | ATS field selector mapping |
| Filter list | ATS config bundle (per-site) |
| Element picker | Field correction picker |
| Filter list maintainer | Admin reviewer |
| Auto-update lists | Config sync on extension load |
| Differential updates | Delta config (additions/removals/modifications) |

_Source: [uBlock Origin Filter Lists](https://github.com/gorhill/uBlock/wiki/Dashboard:-Filter-lists), [FilterLists.com](https://filterlists.com/)_

#### 5.3 A/B Testing New Configs

**Feature flag approach** (adapted from GrowthBook/Unleash patterns):
- Assign users to cohorts based on user ID hash (sticky assignment)
- Roll out new selector configs to a percentage (e.g., 10% of users)
- Measure success rate (did autofill correctly populate the field?)
- Gradually increase rollout; full rollout when confidence threshold met

```typescript
interface ConfigRollout {
  configId: string;
  urlPattern: string;
  targetPercentage: number;     // 0-100
  stickyByUserId: boolean;
  metrics: {
    totalAttempts: number;
    successfulFills: number;
    userCorrectionRate: number;  // Lower is better
  };
  status: "testing" | "rolling_out" | "stable" | "rolled_back";
}
```

_Source: [Unleash A/B Testing with Feature Flags](https://docs.getunleash.io/guides/a-b-testing), [GrowthBook DevTools Extension](https://docs.growthbook.io/tools/chrome-extension)_

---

### 6. Extension Telemetry & Analytics

#### 6.1 Safe vs Prohibited Data Collection

**Safe to collect (anonymous, aggregated):**
- DAU/MAU via anonymous installation IDs
- Feature usage counts (autofill triggered, job saved, resume uploaded)
- Error rates and types (error code, stack trace hash — not full stack)
- ATS detection results (e.g., "greenhouse detected", "lever detected")
- Autofill completion rate, scan success rate
- Extension version, browser version, OS type

**Never collect:**
- URLs of pages visited (PII risk)
- Form field values or content
- Personal information (name, email, resume content)
- Browsing history beyond extension-relevant pages

#### 6.2 Event Batching Pattern [High Confidence]

Recommended production pattern: **collect in `storage.local`, flush on alarm**.

```javascript
async function trackEvent(eventName, properties = {}) {
  const event = {
    event: eventName,
    properties: { ...properties, timestamp: Date.now(),
      extension_version: chrome.runtime.getManifest().version }
  };
  const { telemetryQueue = [] } = await chrome.storage.local.get("telemetryQueue");
  telemetryQueue.push(event);
  await chrome.storage.local.set({ telemetryQueue });
  if (telemetryQueue.length >= 50) await flushTelemetryBatch(); // Immediate flush on threshold
}

// Periodic flush every 2 minutes
chrome.alarms.create("flush-telemetry", { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flush-telemetry") flushTelemetryBatch();
});
```

**On failure:** Re-queue events to `storage.local` for next flush attempt.

Production analytics platforms commonly used: PostHog, Mixpanel, Amplitude (all via HTTP API from service worker), Google Analytics (via Measurement Protocol).

_Source: [Chrome Extension Telemetry - Extension.Ninja](https://www.extension.ninja/blog/post/chrome-extension-telemetry-google-analytics/), [Chrome Web Store Privacy Requirements](https://developer.chrome.com/docs/webstore/user_data/)_

---

### 7. Real-Time Config Push vs Polling

#### 7.1 Approach Comparison

| Approach | Mechanism | Can Wake Service Worker? | Complexity | Best For |
|---|---|---|---|---|
| **Alarm-based polling** | `chrome.alarms` every 5 min | Yes (alarm is an event) | Low | Config sync (recommended default) |
| **Web Push API** | Server pushes to extension | Yes (Chrome 121+ silent push) | Medium | Critical real-time updates |
| **WebSocket** | Persistent connection | No (dies with service worker) | High | Bidirectional real-time (AI chat) |
| **SSE** | Server-sent events | No | Medium | Not well-suited for MV3 |
| **Chrome auto-update** | Extension package update | N/A (slow, hours between checks) | Low | Last resort for bundled config |

#### 7.2 Web Push API — Silent Push (Chrome 121+)

The Web Push API is the most robust way to push config updates to an extension. It wakes the service worker even if suspended.

```javascript
// Subscribe on install
chrome.runtime.onInstalled.addListener(async () => {
  const subscription = await self.registration.pushManager.subscribe({
    userVisibleOnly: false, // Silent push (Chrome 121+)
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  await fetch("https://api.jobswyft.com/v1/extension/push-subscribe", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription })
  });
});

// Handle incoming push
self.addEventListener("push", (event) => {
  const data = event.data.json();
  if (data.type === "CONFIG_UPDATE") {
    event.waitUntil(chrome.storage.local.set({ extensionConfig: data.config }));
  }
});
```

**Key advantage:** `userVisibleOnly: false` means config updates without showing a notification. Ideal for feature flags, rate limits, and scanner rules.

_Source: [Use Web Push - Chrome for Developers](https://developer.chrome.com/docs/extensions/how-to/integrate/web-push), [Real-time updates in Extensions](https://developer.chrome.com/docs/extensions/develop/concepts/real-time)_

#### 7.3 WebSocket for Bidirectional Real-Time (Chrome 116+)

Service worker stays alive as long as WebSocket messages are exchanged within the 30-second idle window. Requires a 20-second heartbeat. **Cannot wake a suspended service worker** — connection lost on termination. Best for bidirectional use cases (e.g., real-time coaching chat).

_Source: [Use WebSockets in service workers - Chrome for Developers](https://developer.chrome.com/docs/extensions/how-to/web-platform/websockets)_

---

### 8. Privacy & Security in Extension Data Collection

#### 8.1 Safe DOM Data to Send to Backend

**Safe to send:**
- Page URL (after stripping query parameters with tokens)
- CSS selectors / XPaths of form fields
- Form field labels and placeholder text
- DOM structure (tag hierarchy, class names, IDs)
- ATS platform identifier
- Field types (input, select, textarea)

**Must be sanitized or excluded:**
- Form field **values** (contain user-entered PII)
- Cookie data, authentication tokens
- Hidden input values (CSRF tokens, session IDs)
- User-specific URLs (containing user IDs, application IDs)
- File upload field content

**Best practice:** Send only the structural DOM "skeleton" — tags, attributes, classes, labels — never field values.

#### 8.2 PII Stripping from HTML Snapshots

**Recommended libraries:**

| Library | Feature |
|---|---|
| **redact-pii** (NPM) | Detects names, emails, phones, SSNs, credit cards, addresses, IPs. TypeScript. Custom patterns supported. |
| **@redactpii/node** | Zero-dependency alternative, works offline, no API keys |
| **DOMPurify** | HTML sanitization to prevent XSS when processing DOM snapshots |
| **HTML Sanitizer API** | Browser-native HTML sanitization (Web standard) |

**DOM snapshot sanitization pipeline:**
```typescript
function sanitizeDOMSnapshot(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // 1. Remove all form field values
  doc.querySelectorAll('input, textarea, select').forEach(el => {
    el.removeAttribute('value'); el.textContent = '';
  });
  // 2. Remove hidden inputs (may contain tokens)
  doc.querySelectorAll('input[type="hidden"]').forEach(el => el.remove());
  // 3. Remove scripts
  doc.querySelectorAll('script').forEach(el => el.remove());
  // 4. Strip data-* attributes (may contain PII)
  doc.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).filter(a => a.name.startsWith('data-'))
      .forEach(a => el.removeAttribute(a.name));
  });
  // 5. Run PII redaction on remaining text
  return doc.documentElement.outerHTML;
}
```

_Source: [redact-pii (GitHub)](https://github.com/solvvy/redact-pii), [DOMPurify (GitHub)](https://github.com/cure53/DOMPurify), [PII Sanitizer Extension](https://github.com/dneverson/PII_Sanitizer_Extension)_

#### 8.3 GDPR/CCPA Compliance Requirements

| Requirement | GDPR | CCPA/CPRA |
|---|---|---|
| Consent model | **Opt-in** (prior consent required) | **Opt-out** (permitted by default, user can stop) |
| Right to access/delete | Yes | Yes |
| Data minimization | Core principle | Required under CPRA |
| Penalties | Up to EUR 20M or 4% of annual revenue | Expanding under CPRA |

**Extension-specific obligations:**
- Chrome Web Store requires a privacy policy if collecting any data about resources or website content
- Only collect structural DOM data needed for selector matching
- Provide opt-out mechanism for telemetry
- Honor Global Privacy Control (GPC)
- No data collection from incognito windows

_Source: [Chrome Web Store Privacy Requirements](https://developer.chrome.com/docs/webstore/user_data/), [Chrome Extension User Privacy](https://developer.chrome.com/docs/extensions/develop/security-privacy/user-privacy)_

#### 8.4 Dynamic Host Permissions (MV3 Best Practice)

```json
{
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "https://boards.greenhouse.io/*",
    "https://api.lever.co/*"
  ],
  "optional_host_permissions": ["https://*/*"]
}
```

**Pattern:** Pre-declare known ATS domains for zero-friction access. Use `optional_host_permissions` with `"https://*/*"` for runtime discovery of new ATS sites. Request via user gesture (`chrome.permissions.request`). Use `activeTab` for minimal initial permissions.

_Source: [Chrome Declare Permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions), [chrome.permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions)_

---

### 9. Integration Patterns Summary — Recommended Stack for JobSwyft

| Concern | Recommended Pattern | Fallback |
|---|---|---|
| Content script → Service worker requests | `chrome.runtime.sendMessage` for one-shot; `chrome.runtime.connect` for streaming | — |
| Content script → Page context | `CustomEvent` on `document` with unique event names | `window.postMessage` with origin validation |
| Config sync from backend | Alarm-based polling every 5 min via `chrome.alarms` | Web Push for critical real-time updates |
| Auth token storage | `chrome.storage.session` (in-memory, auto-clears) | — |
| Persistent data (resumes, job history) | `chrome.storage.local` (10 MB, extensible) | IndexedDB for large datasets |
| User preferences across devices | `chrome.storage.sync` (100 KB limit) | — |
| Telemetry collection | Batch in `storage.local`, flush every 2 min via alarm | Flush on queue size threshold (50 events) |
| Real-time bidirectional (AI chat) | WebSocket with 20s heartbeat (Chrome 116+) | Port-based message relay |
| Server-to-extension push | Web Push API with silent push (Chrome 121+) | Polling via alarms |
| Service worker keepalive | Offscreen document ping or port self-connect | Alarm-based wakeup (30s minimum) |
| Cross-origin API calls from content script | Relay through service worker via message passing | — |
| Element selection / correction | `css-selector-generator` + uBlock element picker pattern | — |
| PII stripping | `redact-pii` + custom DOM sanitizer | — |
| ATS with public API | API-first (Greenhouse, Lever, SmartRecruiters) | DOM scraping fallback |
| ATS without public API | DOM scraping (Workday, iCIMS) | — |

---

## Architectural Patterns and Design

### 1. Detection Pipeline Architecture (Chain of Responsibility + Middleware)

#### 1.1 Pipeline Pattern with Confidence-Gated Early Exit [High Confidence]

The Chain of Responsibility pattern models the Smart Engine's multi-layer graceful degradation. Each handler (layer) processes the request and decides whether to pass it to the next handler based on accumulated confidence. The middleware variant adds a shared `DetectionContext` that all layers enrich.

**Architecture:**

```
DetectionContext {
  url: string;
  dom: Document;
  signals: Signal[];        // accumulated evidence
  fields: DetectedField[];  // detected form fields
  confidence: number;       // 0.0 to 1.0
  atsType?: string;         // identified ATS
  auditTrail: DetectionEvent[];
}

Pipeline:
  1. URLMatcherMiddleware     -> sets atsType, adds URL signal, confidence += 0.3
  2. StructuredDataMiddleware -> extracts JSON-LD/meta, adds signals, confidence += 0.2
  3. ConfidenceGateMiddleware -> if confidence >= 0.8, skip remaining (don't call next())
  4. CSSSelectorMiddleware    -> runs site-specific selectors, adds fields
  5. HeuristicMiddleware      -> label scanning, proximity analysis
  6. ConfidenceGateMiddleware -> second gate check
  7. AIFallbackMiddleware     -> sends to LLM for classification (expensive, last resort)
```

The `ConfidenceGateMiddleware` acts as a **circuit breaker** — if accumulated confidence from previous stages is sufficient, it does not call `next()`, preventing expensive downstream processing.

**TypeScript middleware implementation:**
```typescript
type Next = () => Promise<void> | void;
type DetectionMiddleware = (ctx: DetectionContext, next: Next) => Promise<void> | void;

function Pipeline(...middlewares: DetectionMiddleware[]) {
  const stack = [...middlewares];
  const execute = async (ctx: DetectionContext) => {
    let prevIndex = -1;
    const runner = async (index: number) => {
      if (index === prevIndex) throw new Error('next() called multiple times');
      prevIndex = index;
      const mw = stack[index];
      if (mw) await mw(ctx, () => runner(index + 1));
    };
    await runner(0);
  };
  return { push: (...mw) => stack.push(...mw), execute };
}
```

The Koa.js "onion" model enables post-processing in the same middleware (e.g., measuring total detection time, final confidence normalization).

**Real-world examples:**
- **uBlock Origin**: Requests flow through `StaticNetFilteringEngine` → dynamic filtering rules. Each stage can short-circuit via block/allow. Token-based bucketing + trie lookups achieve microsecond-level evaluation.
- **Scrapy**: Nine-step data flow through Engine → Scheduler → Downloader Middlewares → Spider Middlewares → Item Pipelines. Each middleware can intercept, modify, or drop requests/responses.
- **Extend.ai confidence scoring**: "Ensemble approaches combine outputs from multiple detection systems before applying thresholds. When confidence crosses your defined threshold, extraction passes to downstream systems; low-confidence fields get flagged for human validation."

_Source: [Refactoring Guru - Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility), [Pipeline Architecture](https://umairsaeed.com/pipeline-architecture/), [Evert Pot - Generic Middleware in TypeScript](https://evertpot.com/generic-middleware/), [Munif Tanjim - Middleware Pattern in JS](https://muniftanjim.dev/blog/basic-middleware-pattern-in-javascript/), [Extend - Confidence Scoring](https://www.extend.ai/resources/best-confidence-scoring-systems-document-processing)_

#### 1.2 Trade-offs

| Aspect | Benefit | Cost |
|---|---|---|
| **Performance** | Early exit via confidence gates avoids expensive AI calls | Pipeline setup overhead for simple cases |
| **Complexity** | Each middleware independently testable | Stage ordering matters; reordering can break assumptions |
| **Maintainability** | New stages inserted without modifying existing ones (Open/Closed) | Debugging full pipeline flow requires context tracing |
| **Flexibility** | Onion model allows pre- and post-processing in same middleware | Shared mutable context requires careful state management |

---

### 2. Plugin / Strategy Pattern for Per-ATS Adapters

#### 2.1 Architecture

The core engine defines an `ATSAdapter` interface. Each ATS provides a plugin implementing site-specific extraction logic. A `SiteAdapterRegistry` maps URL patterns to adapters, selected at L0 (URL match).

```
Core Engine
├── AdapterRegistry (maps URL patterns → adapters)
├── BaseAdapter (default/fallback heuristic behavior)
├── GreenhouseAdapter implements ATSAdapter
├── LeverAdapter implements ATSAdapter
├── WorkdayAdapter implements ATSAdapter
└── GenericAdapter (heuristic fallback for unknown ATS)
```

New ATS support = new adapter file + registration. No existing code changes required.

#### 2.2 Real-World Examples

- **Bitwarden**: Cipher-type-specific strategies (Login, Card, Identity) with predefined constant arrays (`CardHolderFieldNames`, `UsernameFieldNames`). Each cipher type is a strategy for field classification. The `CollectAutofillContentService` creates `AutofillPageDetails` containing arrays of `AutofillField` and `AutofillForm` objects.
- **uBlock Origin**: Static filters (pre-compiled from filter lists) + dynamic filters (runtime per-site rules). Per-site rules act like site-specific plugins. Static engine uses **token-indexed hash buckets** with **trie-based hostname matching** (`HNTrieContainer`, `BidiTrieContainer`) for efficient per-site lookup.
- **Scrapy**: Each `Spider` subclass defines `start_urls`, parsing logic, and item extraction. Engine dispatches to the appropriate spider by URL.

_Source: [Bitwarden Collecting Page Details](https://contributing.bitwarden.com/architecture/deep-dives/autofill/collecting-page-details/), [Bitwarden Generating Fill Scripts](https://contributing.bitwarden.com/architecture/deep-dives/autofill/generating-fill-scripts/), [uBlock DeepWiki](https://deepwiki.com/gorhill/uBlock), [Plugin Architecture - DevLeader](https://www.devleader.ca/2023/09/07/plugin-architecture-design-pattern-a-beginners-guide-to-modularity/)_

---

### 3. Registry Pattern for Extensible Field Types

#### 3.1 Three-Tier Classification Registry

| Tier | Example | Registry Action |
|---|---|---|
| **Known** (compile-time) | `firstName`, `email`, `resumeUpload` | Pre-registered handlers with `canHandle` predicates |
| **Inferrable** (runtime classification) | "Years of React experience" | Fuzzy matching / AI classification → mapped to closest known type |
| **Unknown** (fallback) | "Why do you want this role?" | Default handler marks as `customQuestion` with low confidence |

**Function registry with `canHandle` (iO Digital pattern):**
```typescript
interface FieldTransformer {
  name: string;
  canHandle: (field: DOMField) => boolean;
  classify: (field: DOMField, registry: Registry) => FieldClassification;
}

// First-match-wins lookup
const classify = (field) => registry.find(t => t.canHandle(field))?.classify(field);
```

#### 3.2 Real-World Examples

- **Slash Financial** (1M+ lines TypeScript): `createRegistry` with `$discriminator` symbol and `loadModules` file scanner. Replaced "if-else hell" and discriminated union explosions. Significant type-checking speedup over large unions.
- **Bitwarden**: Predefined constant arrays (`IdentityAutoFillConstants.FirstnameFieldNames`) as implicit registry. For each field, system iterates arrays using `isFieldMatch()`.
- **TypeScript Module Declaration Merging**: Open interfaces allow different modules to add types to a central registry without modifying the registry itself.

_Source: [Scaling 1M Lines of TypeScript: Registries - Slash Engineering](https://puzzles.slash.com/blog/scaling-1m-lines-of-typescript-registries), [Function Registry Pattern - iO Digital](https://techhub.iodigital.com/articles/function-registry-pattern-react), [Type Registry Pattern - Frontend Masters](https://frontendmasters.com/courses/typescript-v4/type-registry-pattern/)_

---

### 4. Confidence Scoring and Signal Aggregation [High Confidence]

#### 4.1 Multi-Signal Weighted Scoring (Similo-Inspired)

For form field detection, signals from multiple sources are weighted and aggregated:

```
Signal Sources (suggested weights):
  autocomplete attribute  -> weight: 3.0 (most reliable when present)
  input type attribute    -> weight: 2.5
  label text match        -> weight: 2.0
  name/id attribute       -> weight: 1.5
  aria-label              -> weight: 1.5
  placeholder text        -> weight: 1.0
  position relative to other fields -> weight: 0.5
  CSS class names         -> weight: 0.5

Aggregation:
  confidence = SUM(signal_weight × signal_match_score) / SUM(all_weights)
```

#### 4.2 Conflict Resolution Strategies

When signals disagree (e.g., label says "email" but autocomplete says "username"):

| Strategy | Used By | Mechanism |
|---|---|---|
| **Priority chain** | Bitwarden | autocomplete always wins over label (deterministic order) |
| **Weighted scoring** | Similo | Higher-stability signals dominate (14 parameters, weights 0.5-1.5) |
| **Explicit override** | Firefox | autocomplete attribute treated as authoritative when present |
| **Threshold fallback** | Recommended | confidence > 0.8 → accept; 0.5-0.8 → low-confidence flag; < 0.5 → unknown |

#### 4.3 ML vs Rule-Based Trade-offs

| Dimension | Rule-Based | Machine Learning | Hybrid |
|---|---|---|---|
| Accuracy | ~95-97% standard forms | 99.6% (NordPass claims) | Best of both |
| Explainability | Fully traceable | Black box | Rules provide fallback explanations |
| Maintenance | Manual rule updates | Periodic model retraining | Dual maintenance |
| Latency | Sub-millisecond | Model inference overhead | Depends on architecture |
| Startup cost | Low | High (training data needed) | Medium |

Capital One's research: "Rules engines execute discrete logic needing 100% precision, while ML focuses on prediction. Machine learning detects patterns from the past; rules help stop actively evolving adversarial patterns."

A 2023 audit of 1,247 login pages found 38% triggered incorrect autofill in major password managers despite valid autocomplete attributes, rising to 67% on custom UI library sites.

_Source: [Similo Paper (ACM TOSEM 2022)](https://dl.acm.org/doi/10.1145/3571855), [Bitwarden Generating Fill Scripts](https://contributing.bitwarden.com/architecture/deep-dives/autofill/generating-fill-scripts/), [Firefox Form Autofill Heuristics](https://firefox-source-docs.mozilla.org/browser/extensions/formautofill/docs/index.html), [Capital One: Rules vs ML](https://www.capitalone.com/tech/machine-learning/rules-vs-machine-learning/), [NordPass ML-Enhanced Autofill](https://nordpass.com/blog/machine-learning-enhanced-autofill/)_

---

### 5. Separation of Concerns: Functional Core, Imperative Shell [High Confidence]

#### 5.1 Hexagonal Architecture Applied to Extensions

The "Ports and Adapters" pattern separates the extension into:

- **Core (Pure Functions)**: Detection algorithms, scoring, field classification — no Chrome API dependency. Testable in Node.js with Jest/Vitest.
- **Ports (Interfaces)**: Contracts for DOM access, storage, messaging.
- **Adapters (Chrome-specific)**: `chrome.storage`, `chrome.runtime`, content script DOM access.

```
CORE (Pure Functions — tested with Jest/Vitest):
  detectFieldType(attributes, signals) -> FieldClassification
  scoreSignals(signals, weights)       -> ConfidenceScore
  resolveConflicts(signals[])          -> ResolvedClassification
  matchATSPlatform(url, patterns)      -> ATSDetection

PORTS (Interfaces):
  DOMReader:       { queryElements, getAttributes, getLabels }
  ConfigProvider:  { getWeights, getPatterns, getSiteConfig }
  StorageAdapter:  { get, set, remove }

ADAPTERS (Chrome-specific):
  ChromeDOMReader:       content script DOM access
  ChromeConfigProvider:  chrome.storage + remote config
  ChromeStorageAdapter:  chrome.storage.local/sync
```

Chrome's official unit testing documentation confirms: "Code written without using extension APIs can be tested as normal, using a framework such as Jest." They recommend "dependency injection techniques to remove dependencies on the chrome namespace."

**Key rule (Kenneth Lange)**: "When in doubt whether a piece of functionality belongs in the core or shell, make it functional and put it in the core."

_Source: [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture), [Chrome: Unit Testing Extensions](https://developer.chrome.com/docs/extensions/how-to/test/unit-testing), [Kenneth Lange: Functional Core, Imperative Shell](https://kennethlange.com/functional-core-imperative-shell/), [Google Testing Blog](https://testing.googleblog.com/2025/10/simplify-your-code-functional-core.html)_

---

### 6. Config-Driven vs Code-Driven Architecture

#### 6.1 Hybrid Approach (Recommended)

Martin Fowler cautions that rules engines often disappoint: "it was easy to set up a rules system, but very hard to maintain it because nobody can understand this implicit program flow." He recommends limiting rule count and considering hand-rolled, context-limited engines.

**Recommended split for detection engine:**

| Config-Driven (JSON, server-updatable) | Code-Driven (TypeScript, extension releases) |
|---|---|
| CSS selectors per ATS | Scoring algorithms |
| Field name/pattern lists | Signal aggregation logic |
| Weight values per signal type | Conflict resolution strategies |
| ATS URL pattern signatures | Pipeline/middleware infrastructure |
| Classification thresholds | DOM traversal utilities |
| Field type mappings | Fill script execution |

**Production references:**

| System | Config Format | Update Mechanism | Security Model |
|---|---|---|---|
| **Honey/PayPal** | JSON + sandboxed JS via Acorn AST | Server-pushed per merchant | DAC sandbox (but vulnerability: AST exec = arbitrary code potential) |
| **uBlock Origin** | Text-based declarative rules | Differential updates from filter lists | No code execution — pure matching rules |
| **AdGuard tsurlfilter** | Binary serialized rules with lookup tables | Factory pattern with auto-format conversion | Rule engine, no arbitrary code |
| **Brave adblock-rust** | FlatBuffers (zero-copy binary) with token index | Pre-compiled at build time | Compiled Rust, no runtime eval |

**Key lesson from Honey**: Allowing JavaScript in config creates Universal XSS risk. The Smart Engine should use **pure data configs** (selectors, patterns, weights) — never executable code in configs.

_Source: [Martin Fowler: Rules Engine](https://martinfowler.com/bliki/RulesEngine.html), [Martin Fowler: Refactoring to an Adaptive Model](https://martinfowler.com/articles/refactoring-adaptive-model.html), [Palant: What Would You Risk For Free Honey?](https://palant.info/2020/10/28/what-would-you-risk-for-free-honey/), [Brave: Improved Ad-Blocker Performance](https://brave.com/blog/improved-ad-blocker-performance/)_

---

### 7. Immutable Data Flow with Audit Trail

#### 7.1 Architecture

Each pipeline stage produces a new result object and never mutates input. This enables debugging, testing, caching, and a complete audit trail.

```
URL + DOM Snapshot (immutable input)
  │
  ▼ [Platform Detector]
  { platform: 'greenhouse', confidence: 0.95, signals: [...] }
  │
  ▼ [Field Scanner]
  [{ element: <ref>, attributes: {...}, position: {...} }, ...]
  │
  ▼ [Signal Extractor] (per field)
  { autocomplete: 'email', label: 'Email Address', name: 'email', ... }
  │
  ▼ [Confidence Scorer]
  { fieldType: 'email', confidence: 0.92, signals: [...with weights...] }
  │
  ▼ [Conflict Resolver]
  { fieldType: 'email', confidence: 0.92, resolution: 'unanimous' }
  │
  ▼ [Audit Trail Assembler]
  Complete DetectionReport with full signal chain
```

**Event sourcing for detection auditing:**
```typescript
interface DetectionEvent {
  readonly type: 'SIGNAL_EXTRACTED' | 'SCORE_COMPUTED' | 'CONFLICT_RESOLVED' | 'FIELD_CLASSIFIED';
  readonly timestamp: number;
  readonly fieldId: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly source: string; // which detector produced this
}
```

Each function is pure: `(input, config) -> output`. No function reads from DOM directly — the shell extracts DOM data once and passes it as an immutable snapshot.

_Source: [Immutable Architecture Pattern (GeeksforGeeks)](https://www.geeksforgeeks.org/system-design/immutable-architecture-pattern-system-design/), [Event Sourcing in TypeScript](https://event-driven.io/en/type_script_node_js_event_sourcing/), [Data Pipeline Architecture (Dagster)](https://dagster.io/guides/data-pipeline-architecture-5-design-patterns-with-examples)_

---

### 8. DOM Mutation Handling (MutationObserver Architecture)

#### 8.1 Debounced Re-Scan Strategy

The `MutationObserver` API batches mutations per microtask, but high-frequency mutations (React reconciliation, animations) require application-level debouncing:

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => summary.added.push(node));
    m.removedNodes.forEach(node => summary.removed.push(node));
  });
  clearTimeout(timer);
  timer = setTimeout(processMutations, DEBOUNCE_MS);
});
observer.observe(document.body, { childList: true, subtree: true });
```

#### 8.2 When to Re-Scan vs Patch

| Trigger | Action | Rationale |
|---|---|---|
| URL change (popstate/hashchange) | Full re-scan | SPA navigation; entire form context may differ |
| Large subtree replacement (>50 nodes) | Full re-scan | Likely a view transition |
| Single input field added | Patch (add to tracked fields) | Incremental form rendering |
| Attribute change on tracked field | Update metadata | Field state changed |
| Modal/overlay appeared | Scan modal subtree only | Scoped detection |

**Real-world:** Bitwarden collects page details through multiple triggers: DOM mutations, "Autofill on Page Load," context menu, keyboard shortcuts, and extension UI requests. PostHog throttles MutationObserver callbacks with smart detection to distinguish animation-driven mutations from meaningful content changes.

_Source: [MutationObserver - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver), [Addy Osmani - Mutation Observers](https://addyosmani.com/blog/mutation-observers/), [uBlock Origin DOMWatcher - DeepWiki](https://deepwiki.com/gorhill/uBlock)_

---

### 9. Snapshot-Based Regression Testing Architecture

#### 9.1 Test Fixture Design

**Format:** Full HTML snapshots (`document.documentElement.outerHTML`). Directly loadable into JSDOM/happy-dom for testing. Small (50-500KB), human-inspectable, version-controllable.

**Directory structure:**
```
test-fixtures/
  greenhouse/
    greenhouse-application-form.html
    greenhouse-application-form.expected.json
    greenhouse-application-form.meta.json    # source URL, capture date, notes
  lever/
    lever-job-posting.html
    lever-job-posting.expected.json
  workday/
    ...
```

**Expected results schema:**
```json
{
  "page_detection": {
    "is_job_page": true,
    "is_application_form": true,
    "detected_ats": "greenhouse",
    "confidence": 0.95
  },
  "fields": [
    { "type": "firstName", "selector": "#first_name", "confidence": 0.99, "detection_layer": "registry" },
    { "type": "email", "selector": "input[name='email']", "confidence": 0.95, "detection_layer": "heuristic" }
  ],
  "minimum_field_count": 8,
  "required_field_types": ["firstName", "lastName", "email", "resume"]
}
```

Assertions layered: **hard** (field types that MUST be detected), **soft** (confidence thresholds), **count** (minimum fields).

#### 9.2 Bitwarden's Approach (Reference Implementation)

Bitwarden's autofill system uses:
- **Mock factories** in `autofill-mocks.ts` creating `AutofillField`, `AutofillForm`, and `AutofillPageDetails` (~25 properties per field mock)
- **Jest with jest-mock-extended** for mocking
- Separate **[test-the-web](https://github.com/bitwarden/test-the-web)** project with mock web interfaces for browser-level E2E
- Page detail collection via `CollectAutofillContentService` → structured `AutofillPageDetails`

_Source: [Bitwarden Collecting Page Details](https://contributing.bitwarden.com/architecture/deep-dives/autofill/collecting-page-details/), [Bitwarden test-the-web](https://github.com/bitwarden/test-the-web), [Chrome Unit Testing Extensions](https://developer.chrome.com/docs/extensions/how-to/test/unit-testing)_

---

### 10. LLM-in-the-Loop Development Architecture

#### 10.1 Build-Test-Inspect-Modify Loop

```
┌─────────────────────────────────────────────────┐
│  LLM Agent (Claude via MCP)                     │
│                                                 │
│  1. Navigate to live page (Playwright MCP)      │
│  2. Capture DOM snapshot (browser_evaluate →     │
│     document.outerHTML)                          │
│  3. Run engine against snapshot (Node.js script) │
│  4. Inspect structured JSON results              │
│  5. Diagnose issues (expected vs actual)         │
│  6. Modify config/heuristics                     │
│  7. Re-run engine against same snapshot          │
│  8. If passing: save snapshot + expected as       │
│     regression test fixture                      │
│  9. Run full regression suite                    │
│  10. If regressions: go to step 5               │
└─────────────────────────────────────────────────┘
```

#### 10.2 Vercel's Ralph Wiggum Loop (Closest Existing Pattern)

The agent builds/modifies code, launches a browser to test, confirms behavior, fixes and retests on failure. The **Snapshot + Refs** system in [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) provides compact page representations (280 chars vs 8,247 for Playwright MCP's full output).

**Key insight:** "Fewer tools meant the model could think more freely about how to accomplish tasks," reducing both confusion and token waste.

_Source: [Ralph Wiggum Loop (Pulumi)](https://www.pulumi.com/blog/self-verifying-ai-agents-vercels-agent-browser-in-the-ralph-wiggum-loop/), [Vercel agent-browser](https://github.com/vercel-labs/agent-browser), [Datagrid - Self-Improving AI Agents](https://datagrid.com/blog/7-tips-build-self-improving-ai-agents-feedback-loops)_

---

### 11. Selector Health Monitoring

#### 11.1 Dual Monitoring Strategy

| Approach | Mechanism | Detection Speed | Infrastructure |
|---|---|---|---|
| **Proactive** (scheduled probes) | Nightly CI job: navigate to one known URL per ATS, capture HTML, run engine, compare vs baseline | Catches breakage within hours | Playwright + CI runner |
| **Passive** (user telemetry) | Track `fields_detected`, `user_corrections`, `fill_success_rate` per URL pattern | Real-time from user base | Telemetry aggregation |

**Alert thresholds:**
- Average `fields_detected` for a URL pattern drops 30%+ over 7 days → degradation alert
- `user_corrections` rate exceeds 10% of scans → selector quality alert
- `fields_filled / fields_detected` ratio drops below 70% → fill accuracy alert

#### 11.2 Healenium Self-Healing Pattern

When primary selector fails: use stored DOM context (parent chain, sibling elements, text landmarks) to find the field by structural similarity. LCS (Longest Common Subsequence) algorithm with gradient-boosted attribute weights. Score-cap parameter (default 0.5) sets minimum acceptable match score.

**Kadoa's alternative:** Rather than patching at runtime, uses AI agents to regenerate extraction scripts entirely. Compares new results against historical data and confidence-scores differences.

_Source: [Healenium](https://healenium.io/), [Kadoa Self-Healing Scrapers](https://www.kadoa.com/blog/autogenerate-self-healing-web-scrapers), [ScrapeOps Monitoring](https://scrapeops.io/monitoring-scheduling/)_

---

### 12. Feedback Loop State Machine

#### 12.1 Correction Lifecycle

```
User reports issue → LOCAL → SYNCED → CANDIDATE → VERIFIED → APPROVED → DEPLOYED
                                                                          ↑
                                                              (auto-approve if
                                                               confidence > 90%)
```

**State transitions:**
- `LOCAL → SYNCED`: User opts in to sharing; extension POSTs to backend
- `SYNCED → CANDIDATE`: Backend detects 3+ corrections for same `(url_pattern, element_hash, field_type)` triple
- `CANDIDATE → VERIFIED`: Automated probe visits URL, runs engine with proposed correction, confirms selector works
- `VERIFIED → APPROVED`: Auto-approve if confidence > 90% and no conflicts; else human review
- `APPROVED → DEPLOYED`: Include in next config version bump, push via delta update

#### 12.2 Data Flywheel

```
More users → More corrections → Better detection →
Fewer failures → Better UX → More users
```

**Critical:** Close the loop visually. When a user's correction gets deployed, notify them: "Your feedback improved detection on Greenhouse. Thanks!" This drives continued engagement.

_Source: [Data Flywheel - Medium](https://mrmaheshrajput.medium.com/the-data-flywheel-why-ai-products-live-or-die-by-user-feedback-4ae7aab32d4d), [RLHF from Heterogeneous Feedback (arXiv)](https://arxiv.org/abs/2405.00254)_

---

### 13. Versioned Config Schema Evolution

#### 13.1 Migration Chain Pattern

```typescript
interface DetectionConfig {
  version: number;
  weights: Record<string, number>;
  patterns: Record<string, string[]>;
  platformOverrides?: Record<string, Partial<DetectionConfig>>; // v2
  confidenceThreshold?: number; // v3, default: 0.7
}

function migrateConfig(raw: unknown): DetectionConfig {
  let config = raw as any;
  if (!config.version) config = migrateV0toV1(config);
  if (config.version === 1) config = migrateV1toV2(config);
  if (config.version === 2) config = migrateV2toV3(config);
  return validateConfig(config);
}
```

**Compatibility rules:**
- **Backward compatible**: New extension reads old config. Only add optional fields with defaults. Never remove/rename fields.
- **Forward compatible**: Old extension reads new config. Ignore unknown fields rather than failing. Validate only known fields.
- **Validate at edge**: Extension validates config before applying (parse → version check → migrate → validate → default → freeze).

_Source: [Schema Versioning Strategies](https://app.studyraid.com/en/read/12384/399934/schema-versioning-strategies), [JSON Schema Evolution (Creek Service)](https://www.creekservice.org/articles/2024/01/08/json-schema-evolution-part-1.html), [Confluent Schema Evolution](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)_

---

### 14. Feature Flag / Gradual Rollout for Detection Configs

#### 14.1 Built-In Rollout (Recommended Over External SDKs)

Build rollout logic into the existing config sync system. Requires only a deterministic hash + `rollout.percentage` field:

```typescript
function evaluateRollout(entry: ConfigEntry, userId: string): boolean {
  if (!entry.rollout) return true; // no rollout = 100%
  const hash = murmurhash(userId + entry.id) % 100;
  return hash < entry.rollout.percentage;
}
```

**MurmurHash3** ensures sticky assignment without storing state — same user always gets the same hash for the same config entry.

#### 14.2 External SDK Comparison

| Solution | Size | Complexity | Metrics | Fit for Smart Engine |
|---|---|---|---|---|
| **Custom (built into config sync)** | 0KB | Low | Custom | Best — already have sync |
| GrowthBook SDK | ~3KB | Medium | Built-in | Good alternative |
| Unleash | ~10KB | High | Built-in | Overkill |
| LaunchDarkly | ~15KB | Medium | Built-in | Expensive, vendor lock-in |

**Unleash's 11 Principles applied:**
1. Enable runtime control (config changes without extension update)
2. Make flags short-lived (promote to permanent or remove)
3. Prioritize availability over consistency (work with stale config if backend unreachable)
4. Evaluate close to user (local evaluation, no server round-trip)
5. Limit payload (delta updates only)
6. Consistent user experience (deterministic hashing)

_Source: [GrowthBook Client-Side Flagging](https://blog.growthbook.io/client-side-feature-flagging/), [Unleash Architecture](https://docs.getunleash.io/get-started/unleash-overview), [11 Principles for Feature Flags (Unleash)](https://docs.getunleash.io/guides/feature-flag-best-practices)_

---

### 15. Architectural Patterns Summary — Composite Architecture for Smart Engine

| Concern | Recommended Pattern | Reference System |
|---|---|---|
| **Detection pipeline** | Middleware pipeline with confidence-gated early exit | Express.js / Scrapy / uBlock Origin |
| **Per-ATS modules** | Plugin/Strategy pattern with adapter registry | Bitwarden cipher types / Scrapy spiders |
| **Field type system** | Function registry with `canHandle` + three-tier classification | Slash Engineering / iO Digital |
| **Confidence scoring** | Weighted multi-signal aggregation (Similo-inspired) | Similo / Bitwarden / Firefox FormAutofill |
| **Code organization** | Functional Core, Imperative Shell (Hexagonal Architecture) | Bitwarden / Chrome docs |
| **Rule storage** | Hybrid: config for selectors/patterns, code for algorithms | Honey (config) + uBlock (declarative rules) |
| **Data flow** | Immutable pipeline with event-sourced audit trail | Brave adblock-rust / Event Sourcing patterns |
| **DOM reactivity** | MutationObserver with debounced classify-then-act | Bitwarden / uBlock DOMWatcher |
| **Testing** | HTML snapshot fixtures + JSDOM/happy-dom + Vitest | Bitwarden autofill-mocks |
| **LLM development** | Build-Test-Inspect-Modify loop via Playwright MCP | Vercel Ralph Wiggum Loop |
| **Selector health** | Proactive CI probes + passive user telemetry | ScrapeOps / Healenium |
| **Feedback loop** | Local-first → sync → aggregate → verify → deploy state machine | Honey model + uBlock filter lists |
| **Config evolution** | Explicit version + migration chain + edge validation | WordPress theme.json / Confluent schemas |
| **Gradual rollout** | Deterministic hash rollout built into config sync | GrowthBook / Unleash principles |

---

## Implementation Approaches and Technology Adoption

### 1. Incremental Migration Strategy (Strangler Fig Pattern) [High Confidence]

#### 1.1 Three-Stage Migration with Shadow Mode

Rather than a "big bang" rewrite, migrate incrementally using the Strangler Fig pattern with a 3-stage migration flag stored in `chrome.storage.local`:

| Stage | Reads From | Writes To | Authoritative | Purpose |
|---|---|---|---|---|
| `old` | Old engine | Old engine | Old | Baseline — no changes |
| `shadow` | Both engines | Both engines | Old | Compare results, build confidence |
| `new` | New engine | New engine | New | Full cutover |

```typescript
const DETECTION_ENGINE_STAGE: 'old' | 'shadow' | 'new' =
  await chrome.storage.local.get('detectionEngineStage');

async function detectFields(dom: Document) {
  const oldResult = oldEngine.detect(dom);
  if (DETECTION_ENGINE_STAGE === 'old') return oldResult;

  const newResult = await newEngine.detect(dom);
  if (DETECTION_ENGINE_STAGE === 'shadow') {
    logComparison(oldResult, newResult); // Compare but use old
    return oldResult;
  }
  return newResult; // 'new' stage
}
```

**Switch per-ATS:** Once the new engine matches the old for a specific ATS (e.g., Greenhouse), switch that ATS to the new engine while others remain on the old. This limits blast radius.

**Shopify's 7-step implementation** validates this approach: define the new interface → redirect calls incrementally → dual-write → backfill → switch readers → remove legacy. "The old system remains in place until we're confident the new system operates as expected."

**Zalando's parallel run** adds consistency checking across three dimensions: **matched** (identical results), **unmatched** (differing), and **failed** (errors). Per-operation metrics with dashboards. After migration, they removed ~700 lines of production code and ~1,300 lines of parallel-run scaffolding.

_Source: [Shopify - Strangler Fig Pattern](https://shopify.engineering/refactoring-legacy-code-strangler-fig-pattern), [Zalando - Parallel Run Pattern](https://engineering.zalando.com/posts/2021/11/parallel-run.html), [LaunchDarkly - Migration Flags](https://launchdarkly.com/docs/guides/flags/migrations)_

---

### 2. Monorepo Package Extraction

#### 2.1 Extract `@jobswyft/engine` as Standalone Package

Create a new package in the existing monorepo containing pure detection/autofill logic with zero Chrome API dependencies:

```
jobswyft/
├── apps/
│   ├── web/           # Next.js
│   ├── api/           # FastAPI
│   └── extension/     # WXT (consumes @jobswyft/engine)
├── packages/
│   ├── ui/            # Existing shared UI
│   └── engine/        # NEW: Detection/autofill engine
│       ├── src/
│       │   ├── pipeline/      # Middleware pipeline infrastructure
│       │   ├── detectors/     # URL matcher, structured data, CSS, heuristic, AI
│       │   ├── adapters/      # Per-ATS adapter implementations
│       │   ├── registry/      # Field type registry
│       │   ├── scoring/       # Confidence scoring and signal aggregation
│       │   └── index.ts
│       ├── test/
│       │   ├── fixtures/      # HTML snapshots + expected results
│       │   └── setup.ts       # Mock Chrome APIs
│       ├── package.json
│       ├── tsup.config.ts
│       └── vitest.config.ts
```

**Package configuration:**
```json
// packages/engine/package.json
{
  "name": "@jobswyft/engine",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

**WXT alias configuration** (required instead of tsconfig paths):
```typescript
// apps/extension/wxt.config.ts
export default defineConfig({
  alias: {
    "@jobswyft/engine": resolve("../../packages/engine/src"),
  }
});
```

**Turborepo integration:**
```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

_Source: [Dominik Weber - Monorepo Setup with WXT + Next.js](https://weberdominik.com/blog/monorepo-wxt-nextjs/), [Turborepo - Structuring a Repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)_

---

### 3. CI/CD Pipeline

#### 3.1 Three-Workflow GitHub Actions Setup

**Workflow 1: Test on Pull Requests**
```yaml
name: Test Extension
on:
  pull_request:
    paths: ['apps/extension/**', 'packages/engine/**', 'packages/ui/**']
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo test --filter=@jobswyft/engine
      - run: pnpm turbo build --filter=extension
```

**Workflow 2: Automated Chrome Web Store Publish on Tag**
- Build extension → zip `.output/chrome-mv3` → upload via `chrome-webstore-upload-cli`
- Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` in GitHub Secrets
- Initial draft must be uploaded manually to get extension ID

**Workflow 3: E2E Tests with Playwright**
```typescript
const context = await chromium.launchPersistentContext('', {
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});
```
Extensions run in headless mode using `--headless=new` with Playwright's bundled Chromium.

_Source: [Jam.dev - Chrome Extension Publishing with GitHub Actions](https://jam.dev/blog/automating-chrome-extension-publishing/), [Playwright - Chrome Extensions](https://playwright.dev/docs/chrome-extensions)_

---

### 4. Content Script Performance Budgets

#### 4.1 Industry Benchmarks [High Confidence]

DebugBear's 2024 study of 5,000 Chrome extensions:
- **86% of extensions** have < 50ms CPU impact (the "good citizen" threshold)
- Only 1.7% exceed 500ms CPU time
- Worst offenders: Monica AI (1.3s), MaxAI (2.3s), Honey (1.5s on shopping sites)

**Recommended budgets for Smart Engine:**

| Operation | Budget | Measurement |
|---|---|---|
| Full page scan (URL + structured data) | < 50ms | `performance.measure()` |
| Field detection (all layers) | < 100ms | `performance.measure()` |
| Individual field classification | < 5ms | `performance.measure()` |
| MutationObserver callback | < 20ms | Debounce to 100ms minimum |

#### 4.2 Measurement in Code

```typescript
performance.mark('detection-start');
const result = await detectFields(dom);
performance.mark('detection-end');
performance.measure('field-detection', 'detection-start', 'detection-end');

const measure = performance.getEntriesByName('field-detection')[0];
if (measure.duration > 100) {
  console.warn(`Detection took ${measure.duration}ms (budget: 100ms)`);
}
```

**CI enforcement:**
```typescript
test('field detection completes within 100ms budget', async () => {
  const dom = createMockDOM(/* realistic form */);
  const start = performance.now();
  await detectFields(dom);
  expect(performance.now() - start).toBeLessThan(100);
});
```

#### 4.3 Optimization Techniques

| Technique | Impact | Implementation |
|---|---|---|
| `document_idle` injection | Avoids blocking page load | Default in WXT manifest |
| Restrict URL match patterns | Only inject on known ATS domains | Specific patterns, not `<all_urls>` |
| Lazy-load heavy logic | Defers detection until needed | `import()` dynamic imports |
| Debounce MutationObserver | Reduces processing frequency | 100ms `setTimeout` after mutations |
| Disconnect observers when done | Prevents memory leaks | `observer.disconnect()` |
| Async `chrome.storage` | Avoids main thread blocking | Already default in MV3 |

_Source: [DebugBear - Chrome Extension Performance 2024](https://www.debugbear.com/blog/chrome-extensions-website-performance), [Microsoft - Minimize Extension Impact](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/minimize-page-load-time-impact), [Exthouse](https://github.com/treosh/exthouse)_

---

### 5. Recommended Library Stack

#### 5.1 Content Script Libraries (Bundle Size Critical)

| Category | Library | Version | Min+Gzip | Rationale |
|---|---|---|---|---|
| **Fuzzy matching** | `string-similarity` | 4.0.4 | ~1.5 kB | Dice's Coefficient; smallest option; perfect for label matching |
| **CSS selector gen** | `css-selector-generator` | 3.8.0 | ~6-8 kB | Shadow DOM support via `root` + `useScope`; critical for Workday/SmartRecruiters |
| **HTML sanitization** | `dompurify` | 3.3.1 | ~7-8 kB | Browser-native DOM parser; Mozilla-recommended for extensions |
| **PII redaction** | Custom regex (~15 patterns) | — | ~2-3 kB | Extract from `@redactpii/node` reference; libraries too heavy |
| **Hashing** | `@sindresorhus/fnv1a` | 3.1.0 | <1 kB | FNV-1a standard for feature flag bucketing; tiny |
| **Config validation** | `valibot` | 1.2.0 | ~1-2 kB | 90% smaller than Zod with tree-shaking; TypeScript-first |
| **DOM diffing** | `diff-dom` | 5.2.1 | ~5-6 kB | Non-destructive structural diff with relocation detection |

**Total estimated content script overhead: ~19-23 kB min+gzip** — well within acceptable limits.

#### 5.2 Development/Test Libraries (Not in Content Script)

| Category | Library | Version | Rationale |
|---|---|---|---|
| **Test environment** | `happy-dom` (primary) | 20.6.1 | 2-3x faster than jsdom; native Vitest support |
| **Test fallback** | `jsdom` (per-file override) | 28.0.0 | Fuller API for Shadow DOM edge cases; `// @vitest-environment jsdom` |
| **Test framework** | `vitest` | latest | Fast, TypeScript native, monorepo-friendly |
| **Build tool** | `tsup` | latest | Fast TypeScript bundling for `@jobswyft/engine` package |
| **E2E testing** | `playwright` | latest | Extension testing via persistent context |

#### 5.3 Library Alternatives Considered and Rejected

| Library | Rejected Because |
|---|---|
| **Fuse.js** (fuzzy) | 456 kB unpacked; search engine overkill for pairwise label matching |
| **@medv/finder** (selectors) | No Shadow DOM support; smaller but wrong feature set |
| **sanitize-html** | Node.js only (depends on htmlparser2); doesn't work in content scripts |
| **redact-pii** | 462 kB; Node.js oriented; US-English only; 3 years unmaintained |
| **Zod** (validation) | 15-17 kB min+gzip (v3); no tree-shaking; 8-10x larger than Valibot |
| **AJV** (validation) | ~30 kB; JSON Schema format; doesn't infer TypeScript types |
| **xxhash-wasm** (hashing) | Requires WebAssembly; CSP restrictions in some extension configs |
| **linkedom** (test env) | Not officially supported by Vitest; divergent querySelector behavior |

_Source: [npm trends comparisons](https://npmtrends.com/), [Valibot comparison guide](https://valibot.dev/guides/comparison/), [DOMPurify vs alternatives](https://dompurify.com/what-are-the-key-differences-between-dompurify-and-other-html-sanitization-libraries/)_

---

## Technical Research Recommendations

### Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-2)
- Extract `@jobswyft/engine` package with tsup + vitest + happy-dom
- Define `DetectionContext`, `ATSAdapter`, `FieldTransformer` interfaces
- Implement middleware pipeline infrastructure with confidence gates
- Port existing `field-types.ts` audit trail types to the engine package
- Set up HTML fixture test infrastructure (5 fixtures: Greenhouse, Lever, Workday, SmartRecruiters, generic)

#### Phase 2: Detection Pipeline (Weeks 3-4)
- Implement L0 URL matcher middleware (port from existing `job-detector.ts` + `ats-detector.ts`)
- Implement L1 structured data middleware (port from `scanner.ts` JSON-LD parser)
- Implement L2 CSS selector middleware (port from `selector-registry.ts`)
- Implement L3 heuristic middleware (port from `field-detector.ts` with `string-similarity` for fuzzy matching)
- Add confidence scoring with Similo-inspired weighted signals
- Run shadow mode comparing new pipeline vs existing engine

#### Phase 3: Config Infrastructure (Weeks 5-6)
- Design versioned config schema with `valibot` validation
- Implement config sync endpoint (`GET /v1/config?since={version}`)
- Add deterministic hash rollout (`@sindresorhus/fnv1a`)
- Implement delta update mechanism (additions/removals/modifications)
- Set up `chrome.alarms`-based periodic sync (every 5 minutes)

#### Phase 4: Feedback Loop (Weeks 7-8)
- Implement element picker UI (uBlock Origin pattern) with `css-selector-generator`
- Build `ElementCorrection` data model and local storage
- Add opt-in backend sync for corrections
- Implement crowdsourced aggregation (majority voting, 3-user threshold)
- Build PII stripping pipeline for DOM snapshots (custom regex + `dompurify`)

#### Phase 5: Testing & Monitoring (Weeks 9-10)
- Build LLM-in-the-loop test harness (Node.js script for engine execution + JSON output)
- Set up nightly CI probes for selector health monitoring
- Add passive telemetry (event batching, 2-minute alarm flush)
- Implement `diff-dom`-based structural comparison for selector degradation detection
- Performance budget enforcement in CI (50ms page scan, 100ms field detection)

#### Phase 6: Refinement (Ongoing)
- Stress-test across 10+ ATS platforms using LLM development loop
- Implement L4 AI fallback middleware (backend LLM extraction)
- Build user correction → config deployment pipeline
- Add unknown-field surfacing and AI-assisted filling for custom questions
- Gradually switch from old engine to new per-ATS

### Success Metrics and KPIs

| Metric | Target | Measurement |
|---|---|---|
| **Detection accuracy** | >95% of known field types correctly classified | Regression test suite pass rate |
| **Page scan latency** | <50ms (p95) | `performance.measure()` telemetry |
| **Field detection latency** | <100ms (p95) | `performance.measure()` telemetry |
| **ATS coverage** | Top 8 platforms (Greenhouse, Lever, Workday, SmartRecruiters, iCIMS, Taleo, BambooHR, JazzHR) | Fixture test suite |
| **AI fallback rate** | <10% of scans require L4 | Telemetry events |
| **Autofill success rate** | >80% of detected fields filled correctly | `fields_filled / fields_detected` ratio |
| **User correction rate** | <5% of scans | Correction submissions / total scans |
| **Config sync freshness** | <5 minutes behind latest | Version lag tracking |
| **Regression test count** | >50 fixtures across ATS platforms | CI suite size |
| **Content script budget** | <50ms CPU impact (DebugBear "good citizen") | Exthouse periodic checks |

### Risk Assessment and Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| ATS site changes break selectors | High | Medium | Selector health monitoring + crowdsourced corrections + config-as-data updates |
| Shadow DOM complexity (Workday/SmartRecruiters) | Medium | High | `css-selector-generator` Shadow DOM support + per-ATS adapter pattern |
| Config sync conflicts (remote vs local corrections) | Medium | Low | Explicit version numbering + "remote wins" merge strategy with local override preservation |
| MV3 service worker termination during config sync | Medium | Low | `chrome.alarms` periodic retry + `storage.local` persistence |
| Performance budget exceeded as detection grows | Low | Medium | CI enforcement + lazy loading + confidence-gated early exit |
| PII leakage in DOM snapshots | Low | High | Custom PII stripping pipeline + structural-only snapshots (no field values) + GDPR opt-in |
| LLM API costs for L4 fallback | Medium | Medium | Rate limit (50/user/day) + aggressive L1-L3 optimization to minimize L4 invocations |

---

## Research Conclusion

This technical research covered the complete landscape needed to refine the JobSwyft Smart Engine architecture:

**Steps completed:**
1. **Technology Stack Analysis** — Competitor autofill extensions (7 tools), password manager detection patterns (Bitwarden, 1Password, KeePassXC), Honey's server-driven config, DOM detection techniques, self-healing selectors, browser extension testing, config-driven architectures, LLM-in-the-loop development, crowdsourced site support, ATS platform landscape
2. **Integration Patterns** — MV3 service worker communication, storage API comparison, ATS platform APIs (Greenhouse, Lever, SmartRecruiters, Workday), user feedback pipelines, crowdsourced config aggregation, telemetry batching, Web Push for config push, privacy/security compliance
3. **Architectural Patterns** — Middleware pipeline with confidence gates, plugin/strategy per-ATS adapters, field type registry, Similo-inspired confidence scoring, hexagonal architecture (functional core/imperative shell), config-driven vs code-driven hybrid, immutable data flow with audit trails, MutationObserver patterns, snapshot-based testing, LLM development loops, selector health monitoring, feedback state machine, versioned config schema, gradual rollout
4. **Implementation Research** — Strangler fig migration strategy, monorepo package extraction, CI/CD pipelines, content script performance budgets, specific library recommendations with bundle sizes

**Key validation:** The Smart Engine architecture vision is **more comprehensive than any single competitor's approach** found in this research. No tool publicly documents a combined system with multi-layer graceful degradation, user correction feedback flowing into shared config, crowdsourced site support, LLM-in-the-loop development with snapshot regression tests, and delta config sync. The research confirms the architecture is sound and provides concrete implementation guidance for each layer.
