/**
 * Pure injectable form field detection function for chrome.scripting.executeScript().
 *
 * IMPORTANT: This function is serialized by Chrome and injected into the page.
 * It MUST NOT use any imports, closures, or external references.
 * All helpers, regex patterns, weights, and type logic are inlined.
 *
 * Follows the same pattern as scanner.ts:scrapeJobPage().
 */
export function detectFormFields(
  board: string | null,
  registry: Array<{
    id: string;
    board: string;
    fieldType: string;
    selectors: string[];
    priority: number;
    status: string;
  }>
) {
  const startTime = performance.now();

  // ─── Inlined Type Constants ───────────────────────────────────────────

  // Signal weights (mirroring signal-weights.ts)
  const WEIGHTS: Record<string, number> = {
    "autocomplete": 0.95,
    "name-id-regex": 0.85,
    "board-selector": 0.85,
    "input-type": 0.80,
    "label-for": 0.75,
    "aria-label": 0.75,
    "parent-label": 0.70,
    "placeholder": 0.65,
    "sibling-text": 0.50,
    "css-data-attr": 0.50,
    "heading-context": 0.40,
    "section-context": 0.30,
  };

  // Autocomplete attribute → fieldType map
  const AUTOCOMPLETE_MAP: Record<string, string> = {
    "given-name": "firstName",
    "family-name": "lastName",
    "name": "fullName",
    "email": "email",
    "tel": "phone",
    "tel-national": "phone",
    "street-address": "address",
    "address-line1": "address",
    "address-level2": "city",
    "address-level1": "state",
    "postal-code": "zipCode",
    "country": "country",
    "country-name": "country",
    "url": "websiteUrl",
    "organization": "currentCompany",
    "organization-title": "currentTitle",
  };

  // Name/ID regex patterns → fieldType
  const NAME_ID_PATTERNS: Array<{ pattern: RegExp; fieldType: string }> = [
    { pattern: /first[_-]?name|fname|given[_-]?name/i, fieldType: "firstName" },
    { pattern: /last[_-]?name|lname|family[_-]?name|surname/i, fieldType: "lastName" },
    { pattern: /^name$|full[_-]?name|your[_-]?name/i, fieldType: "fullName" },
    { pattern: /e[_-]?mail/i, fieldType: "email" },
    { pattern: /phone|mobile|tel(?:ephone)?/i, fieldType: "phone" },
    { pattern: /linkedin/i, fieldType: "linkedinUrl" },
    { pattern: /portfolio/i, fieldType: "portfolioUrl" },
    { pattern: /website|personal[_-]?url|home[_-]?page/i, fieldType: "websiteUrl" },
    { pattern: /resume|cv/i, fieldType: "resumeUpload" },
    { pattern: /cover[_-]?letter/i, fieldType: "coverLetterText" },
    { pattern: /^location$|^city$|address[_-]?line/i, fieldType: "location" },
    { pattern: /^city$/i, fieldType: "city" },
    { pattern: /^state$|^province$|^region$/i, fieldType: "state" },
    { pattern: /zip[_-]?code|postal[_-]?code/i, fieldType: "zipCode" },
    { pattern: /^country$/i, fieldType: "country" },
    { pattern: /salary|compensation|pay[_-]?rate/i, fieldType: "salary" },
    { pattern: /years?[_-]?(of[_-]?)?experience|yoe/i, fieldType: "yearsExperience" },
    { pattern: /education|degree|university|school/i, fieldType: "education" },
    { pattern: /start[_-]?date|available|availability/i, fieldType: "startDate" },
    { pattern: /current[_-]?company|employer/i, fieldType: "currentCompany" },
    { pattern: /current[_-]?title|job[_-]?title|position/i, fieldType: "currentTitle" },
    { pattern: /work[_-]?auth|authorized/i, fieldType: "workAuthorization" },
    { pattern: /sponsor/i, fieldType: "sponsorshipRequired" },
    { pattern: /gender|sex\b/i, fieldType: "eeoGender" },
    { pattern: /race|ethnic/i, fieldType: "eeoRaceEthnicity" },
    { pattern: /veteran/i, fieldType: "eeoVeteranStatus" },
    { pattern: /disabilit/i, fieldType: "eeoDisabilityStatus" },
  ];

  // Label text patterns (same as NAME_ID but for prose text in labels)
  const LABEL_PATTERNS: Array<{ pattern: RegExp; fieldType: string }> = [
    { pattern: /first\s*name/i, fieldType: "firstName" },
    { pattern: /last\s*name|family\s*name|surname/i, fieldType: "lastName" },
    { pattern: /^name\s*\*?$|full\s*name/i, fieldType: "fullName" },
    { pattern: /e-?mail/i, fieldType: "email" },
    { pattern: /phone|mobile|telephone/i, fieldType: "phone" },
    { pattern: /linkedin/i, fieldType: "linkedinUrl" },
    { pattern: /portfolio/i, fieldType: "portfolioUrl" },
    { pattern: /website|personal.*url|home\s*page/i, fieldType: "websiteUrl" },
    { pattern: /resume|cv\b/i, fieldType: "resumeUpload" },
    { pattern: /cover\s*letter/i, fieldType: "coverLetterText" },
    { pattern: /^location|^city|address/i, fieldType: "location" },
    { pattern: /^city\s*\*?$/i, fieldType: "city" },
    { pattern: /^state\s*\*?$|^province/i, fieldType: "state" },
    { pattern: /zip\s*code|postal\s*code/i, fieldType: "zipCode" },
    { pattern: /^country\s*\*?$/i, fieldType: "country" },
    { pattern: /salary|compensation|desired\s*pay/i, fieldType: "salary" },
    { pattern: /years?\s*(of\s*)?experience/i, fieldType: "yearsExperience" },
    { pattern: /education|degree|university|school/i, fieldType: "education" },
    { pattern: /start\s*date|earliest.*start|available|when.*start/i, fieldType: "startDate" },
    { pattern: /current\s*(company|employer)/i, fieldType: "currentCompany" },
    { pattern: /current\s*title|job\s*title/i, fieldType: "currentTitle" },
    { pattern: /authorized.*work|work.*authori[sz]/i, fieldType: "workAuthorization" },
    { pattern: /sponsor/i, fieldType: "sponsorshipRequired" },
    { pattern: /gender|sex\b/i, fieldType: "eeoGender" },
    { pattern: /race|ethnic/i, fieldType: "eeoRaceEthnicity" },
    { pattern: /veteran/i, fieldType: "eeoVeteranStatus" },
    { pattern: /disabilit/i, fieldType: "eeoDisabilityStatus" },
  ];

  // Input type → fieldType map
  const INPUT_TYPE_MAP: Record<string, string> = {
    "email": "email",
    "tel": "phone",
    "url": "websiteUrl",
    "file": "resumeUpload",
  };

  // Category derivation
  function getCategory(ft: string): string {
    const personal = ["firstName", "lastName", "fullName", "email", "phone", "location", "address", "city", "state", "zipCode", "country", "linkedinUrl", "portfolioUrl", "websiteUrl"];
    const resume = ["resumeUpload", "coverLetterUpload", "coverLetterText"];
    const professional = ["yearsExperience", "education", "salary", "startDate", "currentCompany", "currentTitle"];
    const authorization = ["workAuthorization", "sponsorshipRequired"];
    const eeo = ["eeoGender", "eeoRaceEthnicity", "eeoVeteranStatus", "eeoDisabilityStatus"];
    if (personal.includes(ft)) return "personal";
    if (resume.includes(ft)) return "resume";
    if (professional.includes(ft)) return "professional";
    if (authorization.includes(ft)) return "authorization";
    if (eeo.includes(ft)) return "eeo";
    return "custom";
  }

  // ─── Inlined Signal Resolution ────────────────────────────────────────

  function resolveFieldType(signals: Array<{ signal: string; rawValue: string; suggestedType: string; weight: number; matched: boolean; reason: string }>) {
    const matched = signals.filter(s => s.matched);
    if (matched.length === 0) return { fieldType: "unknown", confidence: 0 };

    // Weighted voting
    const votes = new Map<string, number>();
    for (const s of matched) {
      votes.set(s.suggestedType, (votes.get(s.suggestedType) ?? 0) + s.weight);
    }

    let bestType = "unknown";
    let bestScore = 0;
    for (const [type, score] of votes) {
      if (score > bestScore) { bestType = type; bestScore = score; }
    }

    // Confidence: highest matching signal for the winning type + diminishing bonuses
    const typeSignals = matched.filter(s => s.suggestedType === bestType).sort((a, b) => b.weight - a.weight);
    let confidence = typeSignals[0].weight;
    for (let i = 1; i < typeSignals.length; i++) {
      confidence += typeSignals[i].weight * 0.1 * Math.pow(0.5, i - 1);
    }

    return { fieldType: bestType, confidence: Math.min(confidence, 0.99) };
  }

  // ─── Helper: Get label text for an element ────────────────────────────

  function getLabelText(el: HTMLElement): string {
    // 1. label[for=id]
    if (el.id) {
      const lbl = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl?.textContent?.trim()) return lbl.textContent.trim();
    }
    // 2. Parent <label>
    const parentLabel = el.closest("label");
    if (parentLabel?.textContent?.trim()) return parentLabel.textContent.trim();
    // 3. Ashby data-ui container
    const ashbyContainer = el.closest("[data-ui]");
    if (ashbyContainer) {
      const lbl = ashbyContainer.querySelector("label");
      if (lbl?.textContent?.trim()) return lbl.textContent.trim();
    }
    // 4. Workday data-automation-id container
    const wdContainer = el.closest("[data-automation-id]");
    if (wdContainer) {
      const lbl = wdContainer.querySelector("label");
      if (lbl?.textContent?.trim()) return lbl.textContent.trim();
    }
    // 5. aria-label
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel?.trim()) return ariaLabel.trim();
    // 6. placeholder
    const placeholder = el.getAttribute("placeholder");
    if (placeholder?.trim()) return placeholder.trim();
    // 7. name attribute (fallback)
    const name = el.getAttribute("name");
    if (name) return name.replace(/[-_[\]]/g, " ").trim();
    return "Unknown field";
  }

  // ─── Helper: Generate CSS selector for an element ─────────────────────

  function generateSelector(el: HTMLElement): string {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const name = el.getAttribute("name");
    if (name) return `[name="${CSS.escape(name)}"]`;
    // data-automation-id (Workday)
    const autoId = el.getAttribute("data-automation-id");
    if (autoId) return `[data-automation-id="${CSS.escape(autoId)}"]`;
    // data-ui (Ashby)
    const dataUi = el.getAttribute("data-ui");
    if (dataUi) return `[data-ui="${CSS.escape(dataUi)}"]`;
    // Fall back to tag + nth-of-type
    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.querySelectorAll(`:scope > ${tag}`));
      const idx = siblings.indexOf(el);
      if (idx >= 0) return `${tag}:nth-of-type(${idx + 1})`;
    }
    return tag;
  }

  // ─── Helper: Check element visibility ─────────────────────────────────

  function isElementVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    // Check if inside <template>
    if (el.closest("template")) return false;
    return true;
  }

  // ─── Helper: Match text against patterns ──────────────────────────────

  function matchPatterns(
    text: string,
    patterns: Array<{ pattern: RegExp; fieldType: string }>
  ): { fieldType: string; pattern: string } | null {
    const cleaned = text.replace(/[*:]/g, "").trim();
    if (!cleaned) return null;
    for (const p of patterns) {
      if (p.pattern.test(cleaned)) {
        return { fieldType: p.fieldType, pattern: p.pattern.source };
      }
    }
    return null;
  }

  // ─── Helper: Find heading/section context ─────────────────────────────

  function findSectionContext(el: HTMLElement): string | null {
    let node: HTMLElement | null = el;
    for (let i = 0; i < 10 && node; i++) {
      node = node.parentElement;
      if (!node) break;

      // Check fieldset > legend
      if (node.tagName === "FIELDSET") {
        const legend = node.querySelector("legend");
        if (legend?.textContent?.trim()) return legend.textContent.trim();
      }

      // Check section headings
      const heading = node.querySelector("h2, h3, h4, [role='heading']");
      if (heading?.textContent?.trim()) return heading.textContent.trim();
    }
    return null;
  }

  // ─── Element Discovery ────────────────────────────────────────────────

  const elementSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"], input[type="file"]';

  const allElements = document.querySelectorAll<HTMLElement>(elementSelector);
  const totalElementsScanned = allElements.length;

  // Filter registry: active entries for detected board + generic
  const activeRegistry = registry
    .filter(r => r.status !== "deprecated" && (r.board === board || r.board === "generic"))
    .sort((a, b) => a.priority - b.priority);

  const fields: Array<{
    stableId: string;
    selector: string;
    label: string;
    fieldType: string;
    confidence: number;
    category: string;
    isRequired: boolean;
    isVisible: boolean;
    isDisabled: boolean;
    currentValue: string;
    inputType: string;
    signals: Array<{ signal: string; rawValue: string; suggestedType: string; weight: number; matched: boolean; reason: string }>;
    registryEntryId: string | null;
    board: string | null;
    frameId: number;
  }> = [];

  const seen = new Set<string>();

  for (let idx = 0; idx < allElements.length; idx++) {
    const el = allElements[idx];
    const inputEl = el as HTMLInputElement;

    // Skip disabled
    if (inputEl.disabled) continue;

    // Check visibility
    const visible = isElementVisible(el);

    // Skip elements in <template>
    if (el.closest("template")) continue;

    // Get basic properties
    const elName = el.getAttribute("name") ?? "";
    const elId = el.id ?? "";
    const inputType = el.getAttribute("type") ?? el.tagName.toLowerCase();
    const autocomplete = el.getAttribute("autocomplete") ?? "";
    const placeholder = el.getAttribute("placeholder") ?? "";
    const ariaLabel = el.getAttribute("aria-label") ?? "";
    const label = getLabelText(el);
    const selector = generateSelector(el);
    const isRequired = inputEl.required || el.getAttribute("aria-required") === "true";
    const currentValue = inputEl.value ?? "";

    // De-duplicate by selector
    if (seen.has(selector)) continue;
    seen.add(selector);

    // Stable ID
    const idFragment = elName || elId || label.slice(0, 20).replace(/\s+/g, "_").toLowerCase();
    const stableId = `af-${idx}-${idFragment}`;

    // Collect all signal evaluations (the audit trail)
    const signals: Array<{ signal: string; rawValue: string; suggestedType: string; weight: number; matched: boolean; reason: string }> = [];
    let registryEntryId: string | null = null;

    // ── Layer 1: Board-specific registry ──────────────────────────────
    for (const entry of activeRegistry) {
      let matched = false;
      for (const sel of entry.selectors) {
        try {
          if (el.matches(sel)) {
            matched = true;
            break;
          }
        } catch {
          // Invalid selector — skip
        }
      }
      if (matched) {
        signals.push({
          signal: "board-selector",
          rawValue: `registry:${entry.id}`,
          suggestedType: entry.fieldType,
          weight: WEIGHTS["board-selector"],
          matched: true,
          reason: `Matched registry entry "${entry.id}" (board=${entry.board})`,
        });
        registryEntryId = entry.id;
        break; // First matching registry entry wins
      }
    }

    // ── Layer 2: autocomplete attribute ───────────────────────────────
    if (autocomplete) {
      // Handle compound values like "shipping email"
      const tokens = autocomplete.trim().toLowerCase().split(/\s+/);
      const lastToken = tokens[tokens.length - 1];
      const mappedType = AUTOCOMPLETE_MAP[lastToken];
      signals.push({
        signal: "autocomplete",
        rawValue: autocomplete,
        suggestedType: mappedType ?? "unknown",
        weight: WEIGHTS["autocomplete"],
        matched: !!mappedType,
        reason: mappedType
          ? `autocomplete="${autocomplete}" → ${mappedType}`
          : `autocomplete="${autocomplete}" not in map`,
      });
    }

    // ── Layer 3: name/id regex ────────────────────────────────────────
    const nameIdText = `${elName} ${elId}`;
    const nameIdMatch = matchPatterns(nameIdText, NAME_ID_PATTERNS);
    signals.push({
      signal: "name-id-regex",
      rawValue: nameIdText.trim(),
      suggestedType: nameIdMatch?.fieldType ?? "unknown",
      weight: WEIGHTS["name-id-regex"],
      matched: !!nameIdMatch,
      reason: nameIdMatch
        ? `name/id matched /${nameIdMatch.pattern}/`
        : `name="${elName}" id="${elId}" — no pattern match`,
    });

    // ── Layer 4: input type ───────────────────────────────────────────
    const typeMatch = INPUT_TYPE_MAP[inputType];
    signals.push({
      signal: "input-type",
      rawValue: inputType,
      suggestedType: typeMatch ?? "unknown",
      weight: WEIGHTS["input-type"],
      matched: !!typeMatch,
      reason: typeMatch
        ? `type="${inputType}" → ${typeMatch}`
        : `type="${inputType}" not in type map`,
    });

    // ── Layer 5: placeholder ──────────────────────────────────────────
    if (placeholder) {
      const phMatch = matchPatterns(placeholder, LABEL_PATTERNS);
      signals.push({
        signal: "placeholder",
        rawValue: placeholder,
        suggestedType: phMatch?.fieldType ?? "unknown",
        weight: WEIGHTS["placeholder"],
        matched: !!phMatch,
        reason: phMatch
          ? `placeholder matched /${phMatch.pattern}/`
          : `placeholder="${placeholder}" — no match`,
      });
    }

    // ── Layer 6: aria-label ───────────────────────────────────────────
    if (ariaLabel) {
      const ariaMatch = matchPatterns(ariaLabel, LABEL_PATTERNS);
      signals.push({
        signal: "aria-label",
        rawValue: ariaLabel,
        suggestedType: ariaMatch?.fieldType ?? "unknown",
        weight: WEIGHTS["aria-label"],
        matched: !!ariaMatch,
        reason: ariaMatch
          ? `aria-label matched /${ariaMatch.pattern}/`
          : `aria-label="${ariaLabel}" — no match`,
      });
    }

    // ── Layer 7: Label proximity ──────────────────────────────────────

    // 7a: label[for=id]
    if (elId) {
      const forLabel = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(elId)}"]`);
      if (forLabel?.textContent?.trim()) {
        const labelText = forLabel.textContent.trim();
        const labelMatch = matchPatterns(labelText, LABEL_PATTERNS);
        signals.push({
          signal: "label-for",
          rawValue: labelText,
          suggestedType: labelMatch?.fieldType ?? "unknown",
          weight: WEIGHTS["label-for"],
          matched: !!labelMatch,
          reason: labelMatch
            ? `label[for] text matched /${labelMatch.pattern}/`
            : `label[for] text "${labelText}" — no match`,
        });
      }
    }

    // 7b: parent <label>
    const parentLabelEl = el.closest("label");
    if (parentLabelEl) {
      const pLabelText = parentLabelEl.textContent?.trim() ?? "";
      if (pLabelText) {
        const pMatch = matchPatterns(pLabelText, LABEL_PATTERNS);
        signals.push({
          signal: "parent-label",
          rawValue: pLabelText,
          suggestedType: pMatch?.fieldType ?? "unknown",
          weight: WEIGHTS["parent-label"],
          matched: !!pMatch,
          reason: pMatch
            ? `parent label matched /${pMatch.pattern}/`
            : `parent label "${pLabelText.slice(0, 50)}" — no match`,
        });
      }
    }

    // 7c: Ashby [data-ui] container label
    const ashbyContainer = el.closest("[data-ui]");
    if (ashbyContainer) {
      const ashbyLabel = ashbyContainer.querySelector("label");
      if (ashbyLabel?.textContent?.trim()) {
        const aText = ashbyLabel.textContent.trim();
        const aMatch = matchPatterns(aText, LABEL_PATTERNS);
        if (aMatch) {
          signals.push({
            signal: "parent-label",
            rawValue: `[data-ui] → ${aText}`,
            suggestedType: aMatch.fieldType,
            weight: WEIGHTS["parent-label"],
            matched: true,
            reason: `Ashby data-ui label matched /${aMatch.pattern}/`,
          });
        }
      }
    }

    // 7d: Workday [data-automation-id] container label
    const wdContainer = el.closest("[data-automation-id]");
    if (wdContainer) {
      const wdLabel = wdContainer.querySelector("label");
      if (wdLabel?.textContent?.trim()) {
        const wText = wdLabel.textContent.trim();
        const wMatch = matchPatterns(wText, LABEL_PATTERNS);
        if (wMatch) {
          signals.push({
            signal: "parent-label",
            rawValue: `[data-automation-id] → ${wText}`,
            suggestedType: wMatch.fieldType,
            weight: WEIGHTS["parent-label"],
            matched: true,
            reason: `Workday data-automation-id label matched /${wMatch.pattern}/`,
          });
        }
      }
    }

    // ── Layer 8: CSS class/data-attr ──────────────────────────────────
    const classText = el.className ?? "";
    const dataAttrs = Array.from(el.attributes)
      .filter(a => a.name.startsWith("data-"))
      .map(a => `${a.name}=${a.value}`)
      .join(" ");
    const cssText = `${classText} ${dataAttrs}`;
    if (cssText.trim()) {
      const cssMatch = matchPatterns(cssText, NAME_ID_PATTERNS);
      signals.push({
        signal: "css-data-attr",
        rawValue: cssText.trim().slice(0, 100),
        suggestedType: cssMatch?.fieldType ?? "unknown",
        weight: WEIGHTS["css-data-attr"],
        matched: !!cssMatch,
        reason: cssMatch
          ? `CSS/data-attr matched /${cssMatch.pattern}/`
          : "No CSS class/data-attr pattern match",
      });
    }

    // ── Layer 9: Heading/section context ──────────────────────────────
    const sectionCtx = findSectionContext(el);
    if (sectionCtx) {
      // Section context signals boost category inference rather than specific type
      const sectionLower = sectionCtx.toLowerCase();
      let sectionType = "unknown";
      let sectionMatched = false;

      if (/personal\s*info|contact\s*info|your\s*info/i.test(sectionLower)) {
        sectionType = "firstName"; // Boosts personal fields
        sectionMatched = true;
      } else if (/equal\s*opportunity|eeo|voluntary|self[_-]?id/i.test(sectionLower)) {
        sectionType = "eeoGender"; // Boosts EEO fields
        sectionMatched = true;
      } else if (/education|academic/i.test(sectionLower)) {
        sectionType = "education";
        sectionMatched = true;
      } else if (/work\s*experience|employment|professional/i.test(sectionLower)) {
        sectionType = "currentCompany";
        sectionMatched = true;
      }

      signals.push({
        signal: "section-context",
        rawValue: sectionCtx.slice(0, 80),
        suggestedType: sectionType,
        weight: WEIGHTS["section-context"],
        matched: sectionMatched,
        reason: sectionMatched
          ? `Section heading "${sectionCtx.slice(0, 40)}" indicates ${sectionType}`
          : `Section heading "${sectionCtx.slice(0, 40)}" — no category match`,
      });
    }

    // ── Resolve field type via weighted voting ────────────────────────
    const resolution = resolveFieldType(signals);

    fields.push({
      stableId,
      selector,
      label,
      fieldType: resolution.fieldType,
      confidence: resolution.confidence,
      category: getCategory(resolution.fieldType),
      isRequired,
      isVisible: visible,
      isDisabled: false, // Already filtered out disabled
      currentValue,
      inputType,
      signals,
      registryEntryId,
      board: board ?? null,
      frameId: 0, // Set by caller after aggregation
    });
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    fields,
    board: board ?? null,
    url: window.location.href,
    timestamp: Date.now(),
    durationMs,
    totalElementsScanned,
  };
}
