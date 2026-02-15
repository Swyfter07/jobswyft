/**
 * Signal Evaluators — Per-signal evaluation functions for form field classification.
 *
 * Each evaluator extracts a raw value from the DOM element, attempts pattern matching
 * against known field type patterns, and returns a SignalEvaluation with audit trail.
 *
 * Architecture reference: ADR-REV-SE8 (Field Detection System)
 */

import type { SignalEvaluation, AutofillFieldType, SignalType } from "../types/field-types";
import { SIGNAL_WEIGHTS } from "../scoring/signal-weights";
import { SELECTOR_REGISTRY } from "../registry/selector-registry";

// ─── Field Type Pattern Registry ─────────────────────────────────────────────

type PatternEntry = { type: AutofillFieldType; pattern: RegExp };

const FIELD_PATTERNS: PatternEntry[] = [
  // Personal
  { type: "firstName", pattern: /first.?name|given.?name|fname|first_name|vorname/i },
  { type: "lastName", pattern: /last.?name|family.?name|lname|surname|last_name|nachname/i },
  { type: "fullName", pattern: /full.?name|your.?name|^name$|applicant.?name|candidate.?name/i },
  { type: "email", pattern: /e.?mail|email.?address|email_address/i },
  { type: "phone", pattern: /phone|tel(?:ephone)?|mobile|cell|contact.?number/i },
  { type: "location", pattern: /^location$|current.?location|your.?location/i },
  { type: "address", pattern: /address|street|mailing/i },
  { type: "city", pattern: /^city$|^town$/i },
  { type: "state", pattern: /^state$|^province$|^region$/i },
  { type: "zipCode", pattern: /zip|postal|postcode|zip.?code/i },
  { type: "country", pattern: /^country$|country.?of.?residence/i },
  { type: "linkedinUrl", pattern: /linkedin|linked.?in/i },
  { type: "portfolioUrl", pattern: /portfolio|personal.?site|github|website.?url|portfolio.?url/i },
  { type: "websiteUrl", pattern: /website|homepage|blog|url/i },

  // Resume
  { type: "resumeUpload", pattern: /resume|cv|curriculum/i },
  { type: "coverLetterUpload", pattern: /cover.?letter.?upload|cover.?letter.?file/i },
  { type: "coverLetterText", pattern: /cover.?letter|covering.?letter/i },

  // Professional
  { type: "yearsExperience", pattern: /years?.?(?:of)?.?experience|experience.?years/i },
  { type: "education", pattern: /education|degree|school|university|qualification/i },
  { type: "salary", pattern: /salary|compensation|pay|wage|desired.?pay/i },
  { type: "startDate", pattern: /start.?date|available|earliest.?start|begin/i },
  { type: "currentCompany", pattern: /current.?company|current.?employer|present.?company/i },
  { type: "currentTitle", pattern: /current.?title|current.?position|job.?title|current.?role/i },

  // Authorization
  { type: "workAuthorization", pattern: /work.?auth|authorized|legally.?authorized|right.?to.?work|eligible.?to.?work/i },
  { type: "sponsorshipRequired", pattern: /sponsor|visa.?sponsor|immigration.?sponsor/i },

  // EEO
  { type: "eeoGender", pattern: /gender|sex(?:$|\s)/i },
  { type: "eeoRaceEthnicity", pattern: /race|ethnicity|ethnic/i },
  { type: "eeoVeteranStatus", pattern: /veteran|military|armed.?forces/i },
  { type: "eeoDisabilityStatus", pattern: /disability|disabled|handicap/i },
];

// ─── Autocomplete Attribute Mapping ──────────────────────────────────────────

const AUTOCOMPLETE_MAP: Record<string, AutofillFieldType> = {
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
  "sex": "eeoGender",
};

// ─── Input Type Mapping ──────────────────────────────────────────────────────

const INPUT_TYPE_MAP: Record<string, AutofillFieldType> = {
  "email": "email",
  "tel": "phone",
  "url": "websiteUrl",
  "file": "resumeUpload",
};

// ─── Helper: Match value against field type patterns ─────────────────────────

function matchPattern(value: string): AutofillFieldType | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  for (const { type, pattern } of FIELD_PATTERNS) {
    if (pattern.test(trimmed)) return type;
  }
  return null;
}

// ─── Signal Evaluators ───────────────────────────────────────────────────────

export function evaluateAutocompleteSignal(el: Element): SignalEvaluation | null {
  const value = el.getAttribute("autocomplete");
  if (!value || value === "off" || value === "on") return null;

  const fieldType = AUTOCOMPLETE_MAP[value.trim().toLowerCase()];
  const weight = SIGNAL_WEIGHTS["autocomplete"];

  if (fieldType) {
    return {
      signal: "autocomplete",
      rawValue: value,
      suggestedType: fieldType,
      weight,
      matched: true,
      reason: `autocomplete="${value}" maps to ${fieldType}`,
    };
  }

  return {
    signal: "autocomplete",
    rawValue: value,
    suggestedType: "unknown",
    weight,
    matched: false,
    reason: `autocomplete="${value}" has no known mapping`,
  };
}

export function evaluateNameIdSignal(el: Element): SignalEvaluation | null {
  const name = el.getAttribute("name") ?? "";
  const id = el.getAttribute("id") ?? "";
  const combined = name || id;
  if (!combined) return null;

  const fieldType = matchPattern(combined);
  const weight = SIGNAL_WEIGHTS["name-id-regex"];

  if (fieldType) {
    return {
      signal: "name-id-regex",
      rawValue: combined,
      suggestedType: fieldType,
      weight,
      matched: true,
      reason: `name/id "${combined}" matches ${fieldType} pattern`,
    };
  }

  return {
    signal: "name-id-regex",
    rawValue: combined,
    suggestedType: "unknown",
    weight,
    matched: false,
    reason: `name/id "${combined}" has no known pattern match`,
  };
}

export function evaluateInputTypeSignal(el: Element): SignalEvaluation | null {
  const type = el.getAttribute("type")?.toLowerCase();
  if (!type) return null;

  const fieldType = INPUT_TYPE_MAP[type];
  const weight = SIGNAL_WEIGHTS["input-type"];

  if (fieldType) {
    return {
      signal: "input-type",
      rawValue: type,
      suggestedType: fieldType,
      weight,
      matched: true,
      reason: `input type="${type}" maps to ${fieldType}`,
    };
  }

  return null; // Don't emit non-matches for input-type (too noisy)
}

export function evaluateLabelForSignal(el: Element, dom: Document): SignalEvaluation | null {
  const id = el.getAttribute("id");
  if (!id) return null;

  const label = dom.querySelector(`label[for="${id}"]`);
  if (!label) return null;

  const text = label.textContent?.trim() ?? "";
  if (!text) return null;

  const fieldType = matchPattern(text);
  const weight = SIGNAL_WEIGHTS["label-for"];

  return {
    signal: "label-for",
    rawValue: text,
    suggestedType: fieldType ?? "customQuestion",
    weight,
    matched: fieldType !== null,
    reason: fieldType
      ? `<label> text "${text}" matches ${fieldType}`
      : `<label> text "${text}" has no known pattern`,
  };
}

export function evaluateAriaLabelSignal(el: Element): SignalEvaluation | null {
  const value = el.getAttribute("aria-label");
  if (!value?.trim()) return null;

  const fieldType = matchPattern(value);
  const weight = SIGNAL_WEIGHTS["aria-label"];

  return {
    signal: "aria-label",
    rawValue: value.trim(),
    suggestedType: fieldType ?? "customQuestion",
    weight,
    matched: fieldType !== null,
    reason: fieldType
      ? `aria-label "${value}" matches ${fieldType}`
      : `aria-label "${value}" has no known pattern`,
  };
}

export function evaluatePlaceholderSignal(el: Element): SignalEvaluation | null {
  const value = el.getAttribute("placeholder");
  if (!value?.trim()) return null;

  const fieldType = matchPattern(value);
  const weight = SIGNAL_WEIGHTS["placeholder"];

  return {
    signal: "placeholder",
    rawValue: value.trim(),
    suggestedType: fieldType ?? "customQuestion",
    weight,
    matched: fieldType !== null,
    reason: fieldType
      ? `placeholder "${value}" matches ${fieldType}`
      : `placeholder "${value}" has no known pattern`,
  };
}

export function evaluateParentLabelSignal(el: Element): SignalEvaluation | null {
  const parentLabel = el.closest("label");
  if (!parentLabel) return null;

  const text = parentLabel.textContent?.trim() ?? "";
  if (!text) return null;

  const fieldType = matchPattern(text);
  const weight = SIGNAL_WEIGHTS["parent-label"];

  return {
    signal: "parent-label",
    rawValue: text,
    suggestedType: fieldType ?? "customQuestion",
    weight,
    matched: fieldType !== null,
    reason: fieldType
      ? `parent <label> "${text}" matches ${fieldType}`
      : `parent <label> "${text}" has no known pattern`,
  };
}

export function evaluateSiblingTextSignal(el: Element): SignalEvaluation | null {
  const prev = el.previousElementSibling;
  if (!prev) return null;

  const tag = prev.tagName.toLowerCase();
  if (tag !== "label" && tag !== "span" && tag !== "div" && tag !== "p") return null;

  const text = prev.textContent?.trim() ?? "";
  if (!text || text.length > 100) return null;

  const fieldType = matchPattern(text);
  const weight = SIGNAL_WEIGHTS["sibling-text"];

  return {
    signal: "sibling-text",
    rawValue: text,
    suggestedType: fieldType ?? "customQuestion",
    weight,
    matched: fieldType !== null,
    reason: fieldType
      ? `sibling text "${text}" matches ${fieldType}`
      : `sibling text "${text}" has no known pattern`,
  };
}

export function evaluateCssDataAttrSignal(el: Element): SignalEvaluation | null {
  const className = el.getAttribute("class") ?? "";
  const dataAttrs: string[] = [];

  // Collect data-* attribute values
  for (const attr of el.attributes) {
    if (attr.name.startsWith("data-") && attr.name !== "data-jf-opid") {
      dataAttrs.push(`${attr.name}=${attr.value}`);
    }
  }

  const combined = `${className} ${dataAttrs.join(" ")}`.trim();
  if (!combined) return null;

  const fieldType = matchPattern(combined);
  const weight = SIGNAL_WEIGHTS["css-data-attr"];

  if (fieldType) {
    return {
      signal: "css-data-attr",
      rawValue: combined.slice(0, 100),
      suggestedType: fieldType,
      weight,
      matched: true,
      reason: `CSS/data attrs contain ${fieldType} pattern`,
    };
  }

  return null; // Don't emit non-matches for CSS (too noisy)
}

export function evaluateHeadingContextSignal(el: Element): SignalEvaluation | null {
  let parent = el.parentElement;
  while (parent) {
    const heading = parent.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) {
      const text = heading.textContent?.trim() ?? "";
      if (text) {
        const fieldType = matchPattern(text);
        const weight = SIGNAL_WEIGHTS["heading-context"];

        if (fieldType) {
          return {
            signal: "heading-context",
            rawValue: text,
            suggestedType: fieldType,
            weight,
            matched: true,
            reason: `heading "${text}" suggests ${fieldType}`,
          };
        }
      }
      break; // Only check nearest heading
    }
    parent = parent.parentElement;
  }

  return null;
}

export function evaluateSectionContextSignal(el: Element): SignalEvaluation | null {
  // Look at fieldset/section/form ancestors for context
  const section = el.closest("fieldset, section, [role='group']");
  if (!section) return null;

  const legend = section.querySelector("legend, [role='heading']");
  const text = legend?.textContent?.trim() ?? "";
  if (!text) return null;

  const fieldType = matchPattern(text);
  const weight = SIGNAL_WEIGHTS["section-context"];

  if (fieldType) {
    return {
      signal: "section-context",
      rawValue: text,
      suggestedType: fieldType,
      weight,
      matched: true,
      reason: `section context "${text}" suggests ${fieldType}`,
    };
  }

  return null;
}

export function evaluateBoardSelectorSignal(
  el: Element,
  board: string | null,
): SignalEvaluation | null {
  if (!board) return null;

  // Find write-mode selectors for this board
  const boardEntries = SELECTOR_REGISTRY.filter(
    (e) => e.board === board && (e.mode === "write" || e.mode === "both"),
  );

  if (boardEntries.length === 0) return null;

  // Check if element matches any write-mode selector
  for (const entry of boardEntries) {
    for (const selector of entry.selectors) {
      try {
        if (el.matches(selector)) {
          const weight = SIGNAL_WEIGHTS["board-selector"];
          return {
            signal: "board-selector",
            rawValue: `${entry.board}:${entry.field}:${selector}`,
            suggestedType: matchBoardFieldToAutofillType(entry.field),
            weight,
            matched: true,
            reason: `Matches board selector ${entry.id}: ${selector}`,
          };
        }
      } catch {
        // Invalid selector — skip
      }
    }
  }

  return null;
}

function matchBoardFieldToAutofillType(
  field: string,
): AutofillFieldType {
  switch (field) {
    case "title": return "currentTitle";
    case "company": return "currentCompany";
    case "description": return "coverLetterText";
    case "location": return "location";
    case "salary": return "salary";
    case "employmentType": return "customQuestion";
    default: {
      // Attempt pattern match for any new registry fields
      const matched = matchPattern(field);
      return matched ?? "customQuestion";
    }
  }
}

/**
 * Evaluate all signals for a single form element.
 *
 * Runs each signal evaluator and collects non-null results.
 */
export function evaluateAllSignals(
  el: Element,
  dom: Document,
  board: string | null,
): SignalEvaluation[] {
  const evaluations: SignalEvaluation[] = [];

  const evaluators: Array<() => SignalEvaluation | null> = [
    () => evaluateAutocompleteSignal(el),
    () => evaluateNameIdSignal(el),
    () => evaluateInputTypeSignal(el),
    () => evaluateLabelForSignal(el, dom),
    () => evaluateAriaLabelSignal(el),
    () => evaluatePlaceholderSignal(el),
    () => evaluateParentLabelSignal(el),
    () => evaluateSiblingTextSignal(el),
    () => evaluateCssDataAttrSignal(el),
    () => evaluateHeadingContextSignal(el),
    () => evaluateSectionContextSignal(el),
    () => evaluateBoardSelectorSignal(el, board),
  ];

  for (const evaluate of evaluators) {
    const result = evaluate();
    if (result) evaluations.push(result);
  }

  return evaluations;
}
