/**
 * Autofill Field Registry — Data-driven CSS selector definitions for form field detection.
 *
 * Each entry maps a board + fieldType to CSS selectors that identify form fields
 * on specific ATS platforms. Mirrors the SelectorEntry pattern from scanning/selector-registry.ts.
 *
 * The registry is JSON-serializable for passing via chrome.scripting.executeScript({ args }).
 */

import type { AutofillFieldType } from "./field-types";

export interface AutofillFieldEntry {
  /** Unique identifier, e.g. "gh-firstName" */
  id: string;
  /** Board name matching ats-detector.ts output, or "generic" */
  board: string;
  /** Field type this entry targets */
  fieldType: AutofillFieldType;
  /** CSS selectors — tried in sequence, first match wins */
  selectors: string[];
  /** Lower number = tried first within same board+fieldType */
  priority: number;
  /** Lifecycle status */
  status: "active" | "degraded" | "deprecated";
  /** ISO date when entry was added */
  added: string;
  /** Human-readable notes */
  notes?: string;
}

export const AUTOFILL_FIELD_REGISTRY: AutofillFieldEntry[] = [
  // ─── Greenhouse ───────────────────────────────────────────────────────

  {
    id: "gh-firstName",
    board: "greenhouse",
    fieldType: "firstName",
    selectors: [
      '#first_name',
      'input[name="job_application[first_name]"]',
      'input[id*="first_name"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-lastName",
    board: "greenhouse",
    fieldType: "lastName",
    selectors: [
      '#last_name',
      'input[name="job_application[last_name]"]',
      'input[id*="last_name"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-email",
    board: "greenhouse",
    fieldType: "email",
    selectors: [
      '#email',
      'input[name="job_application[email]"]',
      'input[type="email"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-phone",
    board: "greenhouse",
    fieldType: "phone",
    selectors: [
      '#phone',
      'input[name="job_application[phone]"]',
      'input[type="tel"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-resume",
    board: "greenhouse",
    fieldType: "resumeUpload",
    selectors: [
      'input[type="file"][name*="resume"]',
      '#resume_file',
      'input[data-source="attach"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-coverLetter",
    board: "greenhouse",
    fieldType: "coverLetterUpload",
    selectors: [
      'input[type="file"][name*="cover_letter"]',
      '#cover_letter_file',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-linkedin",
    board: "greenhouse",
    fieldType: "linkedinUrl",
    selectors: [
      'input[name*="linkedin"]',
      'input[name*="LinkedIn"]',
      'input[id*="linkedin"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-website",
    board: "greenhouse",
    fieldType: "websiteUrl",
    selectors: [
      'input[name*="website"]',
      'input[name*="portfolio"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gh-location",
    board: "greenhouse",
    fieldType: "location",
    selectors: [
      'input[name="job_application[location]"]',
      'input[id*="location"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },

  // ─── Lever ────────────────────────────────────────────────────────────

  {
    id: "lever-fullName",
    board: "lever",
    fieldType: "fullName",
    selectors: [
      'input[name="name"]',
      '.application-name input',
      'input[placeholder*="Full name"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "lever-email",
    board: "lever",
    fieldType: "email",
    selectors: [
      'input[name="email"]',
      '.application-email input',
      'input[type="email"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "lever-phone",
    board: "lever",
    fieldType: "phone",
    selectors: [
      'input[name="phone"]',
      '.application-phone input',
      'input[type="tel"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "lever-resume",
    board: "lever",
    fieldType: "resumeUpload",
    selectors: [
      'input[name="resume"]',
      'input[type="file"]',
      '.application-file input[type="file"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "lever-linkedin",
    board: "lever",
    fieldType: "linkedinUrl",
    selectors: [
      'input[name="urls[LinkedIn]"]',
      'input[name*="linkedin"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "lever-portfolio",
    board: "lever",
    fieldType: "portfolioUrl",
    selectors: [
      'input[name="urls[Portfolio]"]',
      'input[name*="portfolio"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "lever-currentCompany",
    board: "lever",
    fieldType: "currentCompany",
    selectors: [
      'input[name="org"]',
      '.application-org input',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },

  // ─── Workday ──────────────────────────────────────────────────────────

  {
    id: "wd-firstName",
    board: "workday",
    fieldType: "firstName",
    selectors: [
      '[data-automation-id="legalNameSection_firstName"] input',
      'input[data-automation-id="firstName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-lastName",
    board: "workday",
    fieldType: "lastName",
    selectors: [
      '[data-automation-id="legalNameSection_lastName"] input',
      'input[data-automation-id="lastName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-email",
    board: "workday",
    fieldType: "email",
    selectors: [
      'input[data-automation-id="email"]',
      '[data-automation-id="emailSection"] input',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-phone",
    board: "workday",
    fieldType: "phone",
    selectors: [
      'input[data-automation-id="phone"]',
      '[data-automation-id="phoneSection"] input',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-resume",
    board: "workday",
    fieldType: "resumeUpload",
    selectors: [
      'input[data-automation-id="file-upload-input-ref"]',
      '[data-automation-id="resumeSection"] input[type="file"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-address",
    board: "workday",
    fieldType: "address",
    selectors: [
      'input[data-automation-id="addressSection_addressLine1"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-city",
    board: "workday",
    fieldType: "city",
    selectors: [
      'input[data-automation-id="addressSection_city"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-state",
    board: "workday",
    fieldType: "state",
    selectors: [
      '[data-automation-id="addressSection_countryRegion"] input',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "wd-zipCode",
    board: "workday",
    fieldType: "zipCode",
    selectors: [
      'input[data-automation-id="addressSection_postalCode"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },

  // ─── Ashby ────────────────────────────────────────────────────────────

  {
    id: "ashby-firstName",
    board: "ashby",
    fieldType: "firstName",
    selectors: [
      '[data-ui="firstName"] input',
      'input[name="firstName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "ashby-lastName",
    board: "ashby",
    fieldType: "lastName",
    selectors: [
      '[data-ui="lastName"] input',
      'input[name="lastName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "ashby-email",
    board: "ashby",
    fieldType: "email",
    selectors: [
      '[data-ui="email"] input',
      'input[name="email"]',
      'input[type="email"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "ashby-phone",
    board: "ashby",
    fieldType: "phone",
    selectors: [
      '[data-ui="phone"] input',
      'input[name="phone"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "ashby-resume",
    board: "ashby",
    fieldType: "resumeUpload",
    selectors: [
      '[data-ui="resume"] input[type="file"]',
      'input[name="resume"][type="file"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "ashby-linkedin",
    board: "ashby",
    fieldType: "linkedinUrl",
    selectors: [
      '[data-ui="linkedin"] input',
      'input[name*="linkedin" i]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },

  // ─── SmartRecruiters ──────────────────────────────────────────────────

  {
    id: "sr-firstName",
    board: "smartrecruiters",
    fieldType: "firstName",
    selectors: [
      'input[name="firstName"]',
      'input[id*="firstName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "sr-lastName",
    board: "smartrecruiters",
    fieldType: "lastName",
    selectors: [
      'input[name="lastName"]',
      'input[id*="lastName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "sr-email",
    board: "smartrecruiters",
    fieldType: "email",
    selectors: [
      'input[name="email"]',
      'input[type="email"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "sr-phone",
    board: "smartrecruiters",
    fieldType: "phone",
    selectors: [
      'input[name="phoneNumber"]',
      'input[type="tel"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },

  // ─── iCIMS ────────────────────────────────────────────────────────────

  {
    id: "icims-firstName",
    board: "icims",
    fieldType: "firstName",
    selectors: [
      'input[name="FirstName"]',
      'input[id*="FirstName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "icims-lastName",
    board: "icims",
    fieldType: "lastName",
    selectors: [
      'input[name="LastName"]',
      'input[id*="LastName"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "icims-email",
    board: "icims",
    fieldType: "email",
    selectors: [
      'input[name="Email"]',
      'input[type="email"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "icims-phone",
    board: "icims",
    fieldType: "phone",
    selectors: [
      'input[name="Phone"]',
      'input[type="tel"]',
    ],
    priority: 1,
    status: "active",
    added: "2026-02-12",
  },

  // ─── Generic Fallbacks (all boards) ───────────────────────────────────

  {
    id: "gen-firstName-autocomplete",
    board: "generic",
    fieldType: "firstName",
    selectors: [
      'input[autocomplete="given-name"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
    notes: "HTML autocomplete standard attribute",
  },
  {
    id: "gen-lastName-autocomplete",
    board: "generic",
    fieldType: "lastName",
    selectors: [
      'input[autocomplete="family-name"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-fullName-autocomplete",
    board: "generic",
    fieldType: "fullName",
    selectors: [
      'input[autocomplete="name"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-email",
    board: "generic",
    fieldType: "email",
    selectors: [
      'input[autocomplete="email"]',
      'input[type="email"]',
      'input[name="email" i]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-phone",
    board: "generic",
    fieldType: "phone",
    selectors: [
      'input[autocomplete="tel"]',
      'input[type="tel"]',
      'input[name="phone" i]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-firstName-name",
    board: "generic",
    fieldType: "firstName",
    selectors: [
      'input[name="first_name" i]',
      'input[name="firstName" i]',
      'input[name="fname" i]',
    ],
    priority: 11,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-lastName-name",
    board: "generic",
    fieldType: "lastName",
    selectors: [
      'input[name="last_name" i]',
      'input[name="lastName" i]',
      'input[name="lname" i]',
    ],
    priority: 11,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-linkedin",
    board: "generic",
    fieldType: "linkedinUrl",
    selectors: [
      'input[name*="linkedin" i]',
      'input[id*="linkedin" i]',
      'input[placeholder*="linkedin" i]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-resume",
    board: "generic",
    fieldType: "resumeUpload",
    selectors: [
      'input[type="file"][name*="resume" i]',
      'input[type="file"][name*="cv" i]',
      'input[type="file"][accept*="pdf"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-coverLetter",
    board: "generic",
    fieldType: "coverLetterUpload",
    selectors: [
      'input[type="file"][name*="cover" i]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-website",
    board: "generic",
    fieldType: "websiteUrl",
    selectors: [
      'input[name*="website" i]',
      'input[name*="portfolio" i]',
      'input[autocomplete="url"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-location",
    board: "generic",
    fieldType: "location",
    selectors: [
      'input[name*="location" i]',
      'input[autocomplete="address-level2"]',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-address",
    board: "generic",
    fieldType: "address",
    selectors: [
      'input[autocomplete="street-address"]',
      'input[name*="address" i]:not([name*="email"])',
    ],
    priority: 10,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-city",
    board: "generic",
    fieldType: "city",
    selectors: [
      'input[name="city" i]',
      'input[autocomplete="address-level2"]',
    ],
    priority: 11,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-state",
    board: "generic",
    fieldType: "state",
    selectors: [
      'select[name="state" i]',
      'input[name="state" i]',
      'select[autocomplete="address-level1"]',
    ],
    priority: 11,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-zipCode",
    board: "generic",
    fieldType: "zipCode",
    selectors: [
      'input[name*="zip" i]',
      'input[name*="postal" i]',
      'input[autocomplete="postal-code"]',
    ],
    priority: 11,
    status: "active",
    added: "2026-02-12",
  },
  {
    id: "gen-country",
    board: "generic",
    fieldType: "country",
    selectors: [
      'select[name="country" i]',
      'select[autocomplete="country"]',
      'select[autocomplete="country-name"]',
    ],
    priority: 11,
    status: "active",
    added: "2026-02-12",
  },
];
