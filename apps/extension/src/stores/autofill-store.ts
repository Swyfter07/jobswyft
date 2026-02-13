/**
 * Autofill Store — Zustand + persist + chromeStorageAdapter.
 *
 * Manages detection results, field mapping, fill status, and autofill data.
 * Follows the same pattern as scan-store.ts.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import { AUTOFILL_STORAGE_KEY } from "../lib/constants";
import type {
  DetectionResult,
  MappedField,
  MappedFieldStatus,
  AutofillData,
  AutofillFieldType,
  FieldCategory,
  FieldFillResult,
  UndoState,
} from "../features/autofill/field-types";
import { getFieldCategory } from "../features/autofill/field-types";
import type { EEOPreferences } from "./settings-store";

// ─── State Types ──────────────────────────────────────────────────────────────

type DetectionStatus = "idle" | "detecting" | "detected" | "error";
type FillStatus = "idle" | "filling" | "done" | "error";

interface AutofillState {
  // Detection
  detectionStatus: DetectionStatus;
  detectionResult: DetectionResult | null;
  detectionError: string | null;

  // Mapped fields (detection + user data)
  fields: MappedField[];

  // Backend data
  autofillData: AutofillData | null;

  // Fill status
  fillStatus: FillStatus;
  filledCount: number;
  fillErrors: string[];

  // Page context
  pageUrl: string | null;
  board: string | null;

  // Undo state
  undoState: UndoState | null;

  // Actions
  setDetectionResult: (result: DetectionResult) => void;
  setDetectionError: (error: string) => void;
  setDetecting: () => void;
  setAutofillData: (data: AutofillData) => void;
  mapFields: (eeoPreferences: EEOPreferences) => void;
  updateFieldStatus: (stableId: string, status: MappedFieldStatus, mappedValue?: string) => void;
  setFillStatus: (status: FillStatus) => void;
  incrementFilledCount: () => void;
  addFillError: (error: string) => void;
  applyFillResults: (results: FieldFillResult[]) => void;
  setUndoState: (state: UndoState | null) => void;
  canUndo: () => boolean;
  clearExpiredUndo: () => void;
  resetAutofill: () => void;
}

// ─── Field → Value Mapping ────────────────────────────────────────────────────

function mapFieldToValue(
  fieldType: AutofillFieldType,
  data: AutofillData,
  eeo: EEOPreferences
): { value: string | null; source: MappedField["valueSource"] } {
  const p = data.personal;

  switch (fieldType) {
    case "firstName":
      return { value: p.firstName, source: "personal" };
    case "lastName":
      return { value: p.lastName, source: "personal" };
    case "fullName":
      return { value: p.fullName ?? ([p.firstName, p.lastName].filter(Boolean).join(" ") || null), source: "personal" };
    case "email":
      return { value: p.email, source: "personal" };
    case "phone":
      return { value: p.phone, source: "personal" };
    case "location":
      return { value: p.location, source: "personal" };
    case "linkedinUrl":
      return { value: p.linkedinUrl, source: "personal" };
    case "portfolioUrl":
      return { value: p.portfolioUrl, source: "personal" };
    case "websiteUrl":
      return { value: p.portfolioUrl, source: "personal" };
    case "workAuthorization":
      return { value: eeo.authorizedToWork ?? data.workAuthorization, source: "eeo" };
    case "sponsorshipRequired":
      return { value: eeo.sponsorshipRequired ?? null, source: "eeo" };
    case "eeoGender":
      return { value: eeo.gender ?? null, source: "eeo" };
    case "eeoRaceEthnicity":
      return { value: eeo.raceEthnicity ?? null, source: "eeo" };
    case "eeoVeteranStatus":
      return { value: eeo.veteranStatus ?? null, source: "eeo" };
    case "eeoDisabilityStatus":
      return { value: eeo.disabilityStatus ?? null, source: "eeo" };
    case "salary":
      return { value: data.salaryExpectation, source: "personal" };
    default:
      return { value: null, source: null };
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAutofillStore = create<AutofillState>()(
  persist(
    (set, get) => ({
      detectionStatus: "idle",
      detectionResult: null,
      detectionError: null,
      fields: [],
      autofillData: null,
      fillStatus: "idle",
      filledCount: 0,
      fillErrors: [],
      pageUrl: null,
      board: null,
      undoState: null,

      setDetecting: () => {
        // Clear expired undo on new detection
        const current = get();
        const shouldClearUndo = current.undoState &&
          (Date.now() - current.undoState.timestamp > 5 * 60 * 1000);

        set({
          detectionStatus: "detecting",
          detectionError: null,
          fields: [],
          fillStatus: "idle",
          filledCount: 0,
          fillErrors: [],
          ...(shouldClearUndo ? { undoState: null } : {}),
        });
      },

      setDetectionResult: (result) => {
        set({
          detectionStatus: "detected",
          detectionResult: result,
          detectionError: null,
          pageUrl: result.url,
          board: result.board,
          // Convert DetectedFields to MappedFields (unmapped initially)
          fields: result.fields.map((f) => ({
            ...f,
            status: f.currentValue ? "filled" as const : "missing" as const,
            mappedValue: null,
            valueSource: null,
          })),
        });
      },

      setDetectionError: (error) => {
        set({
          detectionStatus: "error",
          detectionError: error,
        });
      },

      setAutofillData: (data) => {
        set({ autofillData: data });
      },

      mapFields: (eeoPreferences) => {
        const { fields, autofillData } = get();
        if (!autofillData) return;

        const mapped = fields.map((field): MappedField => {
          // Don't remap already-filled fields
          if (field.status === "filled") return field;

          const { value, source } = mapFieldToValue(
            field.fieldType as AutofillFieldType,
            autofillData,
            eeoPreferences
          );

          const status: MappedFieldStatus = field.currentValue
            ? "filled"
            : value
              ? "ready"
              : "missing";

          return {
            ...field,
            mappedValue: value,
            valueSource: source,
            status,
          };
        });

        set({ fields: mapped });
      },

      updateFieldStatus: (stableId, status, mappedValue) => {
        set({
          fields: get().fields.map((f) =>
            f.stableId === stableId
              ? {
                  ...f,
                  status,
                  ...(mappedValue !== undefined ? { mappedValue } : {}),
                }
              : f
          ),
        });
      },

      setFillStatus: (status) => {
        set({
          fillStatus: status,
          ...(status === "idle" ? { filledCount: 0, fillErrors: [] } : {}),
        });
      },

      incrementFilledCount: () => {
        set({ filledCount: get().filledCount + 1 });
      },

      addFillError: (error) => {
        set({ fillErrors: [...get().fillErrors, error] });
      },

      applyFillResults: (results) => {
        const { fields, pageUrl } = get();
        let filledCount = 0;
        const undoEntries: UndoState["entries"] = [];

        const updatedFields = fields.map((f) => {
          const result = results.find((r) => r.stableId === f.stableId);
          if (!result) return f;

          if (result.success) {
            filledCount++;
            undoEntries.push({
              stableId: f.stableId,
              selector: f.selector,
              previousValue: result.previousValue,
              inputType: f.inputType,
            });
            return { ...f, status: "filled" as const };
          } else {
            return { ...f, status: "error" as const };
          }
        });

        const newUndoState: UndoState | null = undoEntries.length > 0
          ? { entries: undoEntries, timestamp: Date.now(), pageUrl: pageUrl || "" }
          : null;

        set({
          fields: updatedFields,
          filledCount,
          undoState: newUndoState,
        });

        // Add fill errors for failed results
        for (const r of results) {
          if (!r.success && r.error) {
            get().addFillError(r.error);
          }
        }
      },

      setUndoState: (state) => {
        set({ undoState: state });
      },

      canUndo: () => {
        const { undoState, pageUrl } = get();
        if (!undoState) return false;
        // Expired after 5 minutes
        if (Date.now() - undoState.timestamp > 5 * 60 * 1000) return false;
        // Must be on same page
        if (undoState.pageUrl !== pageUrl) return false;
        return true;
      },

      clearExpiredUndo: () => {
        const { undoState } = get();
        if (undoState && Date.now() - undoState.timestamp > 5 * 60 * 1000) {
          set({ undoState: null });
        }
      },

      resetAutofill: () => {
        set({
          detectionStatus: "idle",
          detectionResult: null,
          detectionError: null,
          fields: [],
          fillStatus: "idle",
          filledCount: 0,
          fillErrors: [],
          pageUrl: null,
          board: null,
          // Keep autofillData — it's user-scoped, not page-scoped
        });
      },
    }),
    {
      name: AUTOFILL_STORAGE_KEY,
      storage: createJSONStorage(() => chromeStorageAdapter),
      // Only persist lightweight state — NOT the full signals[] audit trail
      partialize: (state) => ({
        detectionStatus: state.detectionStatus,
        pageUrl: state.pageUrl,
        board: state.board,
        undoState: state.undoState,
        fields: state.fields.map((f) => ({
          stableId: f.stableId,
          selector: f.selector,
          label: f.label,
          fieldType: f.fieldType,
          confidence: f.confidence,
          category: f.category,
          isRequired: f.isRequired,
          isVisible: f.isVisible,
          isDisabled: f.isDisabled,
          currentValue: f.currentValue,
          inputType: f.inputType,
          status: f.status,
          mappedValue: f.mappedValue,
          valueSource: f.valueSource,
          // Omit: signals, registryEntryId, board, frameId (too large / transient)
        })),
      }),
    }
  )
);
