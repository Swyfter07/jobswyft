/**
 * Core types for the autofill detection engine.
 *
 * These types define the multi-signal detection system that identifies form fields
 * on job application pages and provides full audit trail for debugging.
 */

// ─── Field Type Union ─────────────────────────────────────────────────────────

export type AutofillFieldType =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "phone"
  | "location"
  | "address"
  | "city"
  | "state"
  | "zipCode"
  | "country"
  | "linkedinUrl"
  | "portfolioUrl"
  | "websiteUrl"
  | "resumeUpload"
  | "coverLetterUpload"
  | "coverLetterText"
  | "yearsExperience"
  | "education"
  | "salary"
  | "startDate"
  | "currentCompany"
  | "currentTitle"
  | "workAuthorization"
  | "sponsorshipRequired"
  | "eeoGender"
  | "eeoRaceEthnicity"
  | "eeoVeteranStatus"
  | "eeoDisabilityStatus"
  | "customQuestion"
  | "unknown";

// ─── Signal Types (ordered by reliability) ────────────────────────────────────

export type SignalType =
  | "autocomplete"
  | "name-id-regex"
  | "input-type"
  | "board-selector"
  | "label-for"
  | "aria-label"
  | "parent-label"
  | "placeholder"
  | "sibling-text"
  | "css-data-attr"
  | "heading-context"
  | "section-context";

// ─── Signal Evaluation (audit trail per signal) ───────────────────────────────

export interface SignalEvaluation {
  /** Which signal was evaluated */
  signal: SignalType;
  /** The raw value extracted (e.g., the autocomplete attr value, label text) */
  rawValue: string;
  /** The field type this signal suggests */
  suggestedType: AutofillFieldType;
  /** Base weight of this signal type */
  weight: number;
  /** Whether this signal matched a known pattern */
  matched: boolean;
  /** Human-readable reason for match/no-match */
  reason: string;
}

// ─── Field Categories ─────────────────────────────────────────────────────────

export type FieldCategory =
  | "personal"
  | "resume"
  | "professional"
  | "authorization"
  | "eeo"
  | "custom";

/** Derive category from field type */
export function getFieldCategory(fieldType: AutofillFieldType): FieldCategory {
  switch (fieldType) {
    case "firstName":
    case "lastName":
    case "fullName":
    case "email":
    case "phone":
    case "location":
    case "address":
    case "city":
    case "state":
    case "zipCode":
    case "country":
    case "linkedinUrl":
    case "portfolioUrl":
    case "websiteUrl":
      return "personal";

    case "resumeUpload":
    case "coverLetterUpload":
    case "coverLetterText":
      return "resume";

    case "yearsExperience":
    case "education":
    case "salary":
    case "startDate":
    case "currentCompany":
    case "currentTitle":
      return "professional";

    case "workAuthorization":
    case "sponsorshipRequired":
      return "authorization";

    case "eeoGender":
    case "eeoRaceEthnicity":
    case "eeoVeteranStatus":
    case "eeoDisabilityStatus":
      return "eeo";

    case "customQuestion":
    case "unknown":
    default:
      return "custom";
  }
}

// ─── Detected Field (per-field result with audit trail) ───────────────────────

export interface DetectedField {
  /** Stable ID for tracking: af-{index}-{name|id|label_fragment} */
  stableId: string;
  /** CSS selector to re-locate the element */
  selector: string;
  /** Human-readable label */
  label: string;
  /** Resolved field type */
  fieldType: AutofillFieldType;
  /** Confidence score 0-0.99 */
  confidence: number;
  /** Derived category */
  category: FieldCategory;
  /** Whether the field is required */
  isRequired: boolean;
  /** Whether the field is visible */
  isVisible: boolean;
  /** Whether the field is disabled */
  isDisabled: boolean;
  /** Current value in the DOM */
  currentValue: string;
  /** HTML input type */
  inputType: string;
  /** Full audit trail: every signal attempted */
  signals: SignalEvaluation[];
  /** Registry entry ID that matched (if any) */
  registryEntryId: string | null;
  /** Detected ATS board */
  board: string | null;
  /** Frame ID (for multi-frame aggregation) */
  frameId: number;
}

// ─── Detection Result (page-level) ───────────────────────────────────────────

export interface DetectionResult {
  /** All detected fields with audit trails */
  fields: DetectedField[];
  /** Detected ATS board */
  board: string | null;
  /** Page URL */
  url: string;
  /** Detection timestamp */
  timestamp: number;
  /** Detection duration in milliseconds */
  durationMs: number;
  /** Total DOM elements scanned */
  totalElementsScanned: number;
}

// ─── Mapped Field (DetectedField + fill status) ──────────────────────────────

export type MappedFieldStatus = "ready" | "missing" | "filled" | "skipped" | "generating" | "error";

export interface MappedField extends DetectedField {
  /** Fill status */
  status: MappedFieldStatus;
  /** Value mapped from user data */
  mappedValue: string | null;
  /** Source of the mapped value */
  valueSource: "personal" | "resume" | "eeo" | "ai" | "manual" | null;
}

// ─── Autofill Data (from backend API) ────────────────────────────────────────

export interface AutofillPersonalData {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

export interface AutofillResumeData {
  id: string;
  fileName: string | null;
  downloadUrl: string | null;
  parsedSummary: string | null;
}

export interface AutofillData {
  personal: AutofillPersonalData;
  resume: AutofillResumeData | null;
  workAuthorization: string | null;
  salaryExpectation: string | null;
}

// ─── Fill Types (Phase 2) ───────────────────────────────────────────────────

/** Instruction sent to the injectable filler */
export interface FillInstruction {
  selector: string;
  value: string;
  /** Hint about element type for choosing fill strategy */
  inputType: string;
  /** Field stable ID for result tracking */
  stableId: string;
}

/** Per-field result from the injectable filler */
export interface FieldFillResult {
  stableId: string;
  selector: string;
  success: boolean;
  /** The value that was in the field before filling */
  previousValue: string;
  /** Error message if fill failed */
  error: string | null;
}

/** Aggregate result from one executeScript call */
export interface FillResult {
  filled: number;
  failed: number;
  results: FieldFillResult[];
  durationMs: number;
}

/** Snapshot for undo — one entry per filled field */
export interface UndoEntry {
  stableId: string;
  selector: string;
  previousValue: string;
  inputType: string;
}

/** Full undo state stored in the autofill store */
export interface UndoState {
  entries: UndoEntry[];
  timestamp: number;
  pageUrl: string;
}
