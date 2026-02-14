import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth-store";
import { useScanStore } from "../stores/scan-store";
import { useSettingsStore } from "../stores/settings-store";
import { useCreditsStore } from "../stores/credits-store";
import { useAutofillStore } from "../stores/autofill-store";
import { useToast } from "./toast-context";
import { apiClient } from "../lib/api-client";
import { detectATSForm } from "../features/autofill/ats-detector";
import { detectFormFields } from "../features/autofill/field-detector";
import { fillFormFields, undoFormFills } from "../features/autofill/field-filler";
import { fetchResumeBlob, injectResumeFile } from "../features/autofill/resume-uploader";
import { AUTOFILL_FIELD_REGISTRY } from "../features/autofill/field-registry";
import { fetchAutofillData } from "../features/autofill/autofill-data-service";
import type { MappedField, DetectionResult, DetectedField, FieldFillResult } from "../features/autofill/field-types";

// Serialize registry for chrome.scripting.executeScript args
const REGISTRY_SERIALIZED = AUTOFILL_FIELD_REGISTRY.map((e) => ({
  id: e.id,
  board: e.board,
  fieldType: e.fieldType,
  selectors: e.selectors,
  priority: e.priority,
  status: e.status,
}));

export function AutofillTab() {
  const { toast } = useToast();
  const token = useAuthStore((s) => s.accessToken);
  const savedJobId = useScanStore((s) => s.savedJobId);
  const eeoPreferences = useSettingsStore((s) => s.eeoPreferences);
  const fetchCredits = useCreditsStore((s) => s.fetchCredits);

  const store = useAutofillStore();

  // ─── Field Detection ─────────────────────────────────────────────

  const scanFields = useCallback(async () => {
    store.setDetecting();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab?.url) throw new Error("No active tab");

      // Detect ATS board from URL
      const { board } = detectATSForm(tab.url);
      const boardName = board || null;

      // Run injectable field detection across all frames
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: detectFormFields,
        args: [boardName, REGISTRY_SERIALIZED],
      });

      // Aggregate frame results
      const allFields: DetectedField[] = [];
      const seenIds = new Set<string>();
      let totalScanned = 0;
      let totalDuration = 0;

      for (const frameResult of results) {
        if (!frameResult?.result) continue;
        const r = frameResult.result as DetectionResult;
        totalScanned += r.totalElementsScanned;
        totalDuration = Math.max(totalDuration, r.durationMs);

        for (const field of r.fields) {
          // De-duplicate across frames by stableId
          if (!seenIds.has(field.stableId)) {
            seenIds.add(field.stableId);
            allFields.push({
              ...field,
              frameId: frameResult.frameId ?? 0,
            });
          }
        }
      }

      const detectionResult: DetectionResult = {
        fields: allFields,
        board: boardName,
        url: tab.url,
        timestamp: Date.now(),
        durationMs: totalDuration,
        totalElementsScanned: totalScanned,
      };

      store.setDetectionResult(detectionResult);

      // Fetch autofill data from backend in parallel
      if (token) {
        const data = await fetchAutofillData(token);
        if (data) {
          store.setAutofillData(data);
          store.mapFields(eeoPreferences);
        }
      }

      if (allFields.length === 0) {
        toast({
          title: "No form fields detected",
          description: "Navigate to an application form.",
          variant: "default",
        });
      }
    } catch (err) {
      store.setDetectionError(
        err instanceof Error ? err.message : "Failed to detect fields"
      );
    }
  }, [store, token, eeoPreferences, toast]);

  // ─── Resume Upload Handler ───────────────────────────────────────

  const handleResumeUpload = useCallback(async (tabId: number, field: MappedField) => {
    const resume = store.autofillData?.resume;
    if (!resume?.downloadUrl || !resume?.fileName) return;

    try {
      store.updateFieldStatus(field.stableId, "generating"); // reuse as "uploading" indicator
      const arrayBuffer = await fetchResumeBlob(resume.downloadUrl);
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: injectResumeFile,
        args: [field.selector, bytes, resume.fileName, "application/pdf"],
      });

      if (result?.result?.success) {
        store.updateFieldStatus(field.stableId, "filled");
      } else {
        store.updateFieldStatus(field.stableId, "error");
        store.addFillError(result?.result?.error ?? "Resume upload failed");
      }
    } catch (err) {
      store.updateFieldStatus(field.stableId, "error");
      store.addFillError(err instanceof Error ? err.message : "Resume upload failed");
    }
  }, [store]);

  // ─── Fill All Fields ─────────────────────────────────────────────

  const fillAll = useCallback(async () => {
    store.setFillStatus("filling");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");

      // 1. Build fill instructions for text/select fields
      const fillable = store.fields.filter(
        (f) =>
          f.mappedValue &&
          f.status === "ready" &&
          f.fieldType !== "resumeUpload" &&
          f.fieldType !== "coverLetterUpload"
      );

      const hasResumeField = store.fields.some(
        (f) =>
          (f.fieldType === "resumeUpload" || f.fieldType === "coverLetterUpload") &&
          f.status === "ready"
      );

      if (fillable.length === 0 && !hasResumeField) {
        toast({ title: "No fields to fill", variant: "default" });
        store.setFillStatus("idle");
        return;
      }

      const instructions = fillable.map((f) => ({
        selector: f.selector,
        value: f.mappedValue!,
        inputType: f.inputType,
        stableId: f.stableId,
      }));

      // 2. Execute injectable filler across all frames
      let allResults: FieldFillResult[] = [];

      if (instructions.length > 0) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: fillFormFields,
          args: [instructions],
        });

        // 3. Aggregate frame results
        for (const fr of results) {
          if (fr?.result?.results) {
            allResults.push(...fr.result.results);
          }
        }

        // 4. Apply results to store (updates field statuses + builds undo state)
        store.applyFillResults(allResults);
      }

      // 5. Handle resume upload separately (if resume field exists and data available)
      const resumeField = store.fields.find(
        (f) =>
          (f.fieldType === "resumeUpload" || f.fieldType === "coverLetterUpload") &&
          f.status === "ready"
      );
      if (resumeField && store.autofillData?.resume?.downloadUrl) {
        await handleResumeUpload(tab.id, resumeField);
      }

      const filled = allResults.filter((r) => r.success).length;
      store.setFillStatus(filled > 0 || resumeField ? "done" : "error");
      toast({
        title: `Filled ${filled} field${filled !== 1 ? "s" : ""}`,
        variant: "success",
      });
    } catch (err) {
      store.addFillError(err instanceof Error ? err.message : "Fill error");
      store.setFillStatus("error");
    }
  }, [store, toast, handleResumeUpload]);

  // ─── AI Answer for Custom Questions ──────────────────────────────

  const handleAnswerQuestion = useCallback(
    async (field: MappedField) => {
      if (!token || !savedJobId) return;

      store.updateFieldStatus(field.stableId, "generating");

      try {
        const result = await apiClient.answerQuestion(
          token,
          savedJobId,
          field.label,
          { max_length: 500 }
        );

        store.updateFieldStatus(field.stableId, "ready", result.content);

        // Auto-fill the field via injectable filler
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const fillResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: fillFormFields,
            args: [[{
              selector: field.selector,
              value: result.content,
              inputType: field.inputType,
              stableId: field.stableId,
            }]],
          });

          const frameResult = fillResults.find((fr) => fr?.result?.results?.length > 0);
          const fieldResult = frameResult?.result?.results?.[0];

          if (fieldResult?.success) {
            store.updateFieldStatus(field.stableId, "filled");
          } else {
            store.updateFieldStatus(field.stableId, "error");
            if (fieldResult?.error) store.addFillError(fieldResult.error);
          }
        }

        if (token) fetchCredits(token);
        toast({ title: "Answer generated and filled", variant: "success" });
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Failed to generate answer";
        if (errMsg.includes("CREDIT_EXHAUSTED")) {
          toast({ title: "No credits remaining", variant: "error" });
        }
        store.updateFieldStatus(field.stableId, "missing");
      }
    },
    [token, savedJobId, store, toast, fetchCredits]
  );

  // ─── Undo ──────────────────────────────────────────────────────────

  const handleUndo = useCallback(async () => {
    const undoState = store.undoState;
    if (!undoState) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      const entries = undoState.entries.map((e) => ({
        selector: e.selector,
        previousValue: e.previousValue,
        inputType: e.inputType,
        stableId: e.stableId,
      }));

      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: undoFormFills,
        args: [entries],
      });

      // Reset field statuses to "ready"
      for (const entry of undoState.entries) {
        store.updateFieldStatus(entry.stableId, "ready");
      }
      store.setUndoState(null);
      store.setFillStatus("idle");
      toast({ title: "Fill undone", variant: "default" });
    } catch (err) {
      toast({
        title: "Undo failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
    }
  }, [store, toast]);

  // ─── Undo Countdown ───────────────────────────────────────────────

  const [undoTimeLeft, setUndoTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!store.undoState) {
      setUndoTimeLeft(null);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - store.undoState!.timestamp;
      const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
      if (remaining <= 0) {
        store.clearExpiredUndo();
        setUndoTimeLeft(null);
      } else {
        setUndoTimeLeft(Math.ceil(remaining / 1000));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [store, store.undoState]);

  // ─── Render ──────────────────────────────────────────────────────

  const { detectionStatus, detectionError, fields, fillStatus } = store;

  const personalFields = fields.filter((f) => f.category === "personal");
  const resumeFields = fields.filter((f) => f.category === "resume");
  const professionalFields = fields.filter((f) => f.category === "professional");
  const authorizationFields = fields.filter((f) => f.category === "authorization");
  const eeoFields = fields.filter((f) => f.category === "eeo");
  const customFields = fields.filter((f) => f.category === "custom");

  const readyCount = fields.filter((f) => f.status === "ready").length;
  const filledCount = fields.filter((f) => f.status === "filled").length;
  const isScanning = detectionStatus === "detecting";
  const isFilling = fillStatus === "filling";
  const canUndo = store.canUndo();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={scanFields}
            disabled={isScanning}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {isScanning
              ? "Scanning..."
              : fields.length > 0
                ? "Re-scan Fields"
                : "Scan Fields"}
          </button>
          {fields.length > 0 && (
            <button
              onClick={fillAll}
              disabled={isFilling || readyCount === 0}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isFilling ? "Filling..." : `Fill All (${readyCount})`}
            </button>
          )}
          {canUndo && (
            <button
              onClick={handleUndo}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Undo
            </button>
          )}
        </div>

        {/* Summary bar */}
        {fields.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{fields.length} fields detected</span>
            <span className="text-border">|</span>
            <span className="text-success">{readyCount} ready</span>
            <span className="text-border">|</span>
            <span>{filledCount} filled</span>
            {store.board && (
              <>
                <span className="text-border">|</span>
                <span className="capitalize">{store.board}</span>
              </>
            )}
            {canUndo && undoTimeLeft !== null && (
              <>
                <span className="text-border">|</span>
                <span className="text-warning">
                  Undo {Math.floor(undoTimeLeft / 60)}:{String(undoTimeLeft % 60).padStart(2, "0")}
                </span>
              </>
            )}
          </div>
        )}

        {/* Error state */}
        {detectionError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {detectionError}
          </div>
        )}

        {/* Empty state */}
        {fields.length === 0 && !isScanning && !detectionError && (
          <div className="text-center text-xs text-muted-foreground py-8">
            Navigate to a job application form, then click &quot;Scan Fields&quot; to
            detect form fields.
          </div>
        )}

        {/* Field categories */}
        {personalFields.length > 0 && (
          <FieldGroup title="Personal Info" fields={personalFields} />
        )}
        {resumeFields.length > 0 && (
          <FieldGroup title="Resume / Cover Letter" fields={resumeFields} />
        )}
        {professionalFields.length > 0 && (
          <FieldGroup title="Professional" fields={professionalFields} />
        )}
        {authorizationFields.length > 0 && (
          <FieldGroup title="Work Authorization" fields={authorizationFields} />
        )}
        {eeoFields.length > 0 && (
          <FieldGroup title="EEO / Compliance" fields={eeoFields} />
        )}
        {customFields.length > 0 && (
          <FieldGroup
            title="Questions"
            fields={customFields}
            onClickField={savedJobId ? handleAnswerQuestion : undefined}
          />
        )}
      </div>
    </div>
  );
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence > 0.7
      ? "text-success"
      : confidence > 0.4
        ? "text-warning"
        : "text-destructive";

  return <span className={`text-micro font-mono ${color}`}>{pct}%</span>;
}

// ─── Field Group ──────────────────────────────────────────────────────────────

function FieldGroup({
  title,
  fields,
  onClickField,
}: {
  title: string;
  fields: MappedField[];
  onClickField?: (field: MappedField) => void;
}) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-1">
        {fields.map((f) => (
          <div
            key={f.stableId}
            onClick={() =>
              onClickField &&
              f.status !== "filled" &&
              f.status !== "generating"
                ? onClickField(f)
                : undefined
            }
            className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-xs ${
              onClickField &&
              f.status !== "filled" &&
              f.status !== "generating"
                ? "cursor-pointer hover:bg-muted/50"
                : ""
            } ${
              f.status === "filled"
                ? "border-border/50 text-muted-foreground opacity-60"
                : f.status === "ready"
                  ? "border-success/30 bg-success/5"
                  : f.status === "generating"
                    ? "border-primary/30 bg-primary/5"
                    : "border-warning/30 bg-warning/5"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate mr-2">
              <span className="truncate">{f.label}</span>
              <ConfidenceBadge confidence={f.confidence} />
            </div>
            <span className="shrink-0">
              {f.status === "filled" && (
                <span className="text-muted-foreground">Filled</span>
              )}
              {f.status === "ready" && (
                <span className="text-success">Ready</span>
              )}
              {f.status === "generating" && (
                <span className="text-primary animate-pulse">Generating...</span>
              )}
              {f.status === "missing" && (
                <span className="text-warning">
                  {onClickField ? "Click to AI fill" : "No value"}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
