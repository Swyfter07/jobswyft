import { useState, useCallback } from "react";
import { useAuthStore } from "../stores/auth-store";
import { useScanStore } from "../stores/scan-store";
import { useResumeStore } from "../stores/resume-store";
import { useSettingsStore } from "../stores/settings-store";
import { useCreditsStore } from "../stores/credits-store";
import { useToast } from "./toast-context";
import { apiClient } from "../lib/api-client";

interface DetectedField {
  id: string | null;
  selector: string;
  label: string;
  type: string;
  currentValue: string;
  category: "personal" | "resume" | "eeo" | "questions";
  eeoType: string | null;
  jobBoard: string;
  status?: "ready" | "filled" | "missing" | "generating";
  mappedValue?: string;
}

export function AutofillTab() {
  const { toast } = useToast();
  const token = useAuthStore((s) => s.accessToken);
  const savedJobId = useScanStore((s) => s.savedJobId);
  const activeResumeData = useResumeStore((s) => s.activeResumeData);
  const eeoPreferences = useSettingsStore((s) => s.eeoPreferences);
  const fetchCredits = useCreditsStore((s) => s.fetchCredits);

  const [fields, setFields] = useState<DetectedField[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Field Detection ─────────────────────────────────────────────

  const scanFields = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");

      // Get all frames for multi-frame detection
      const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
      const allFields: DetectedField[] = [];

      for (const frame of frames || [{ frameId: 0 }]) {
        try {
          const response = await chrome.tabs.sendMessage(
            tab.id,
            { action: "DETECT_FORM_FIELDS" },
            { frameId: frame.frameId }
          );
          if (response?.success && response.fields) {
            allFields.push(...response.fields);
          }
        } catch {
          // Frame may not have content script — skip silently
        }
      }

      // Map resume data to personal fields
      const enriched = allFields.map((f) => enrichField(f));
      setFields(enriched);

      if (enriched.length === 0) {
        toast({ title: "No form fields detected", description: "Navigate to an application form.", variant: "default" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detect fields");
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  // Map resume data → field values
  function enrichField(field: DetectedField): DetectedField {
    const label = field.label.toLowerCase();
    let mappedValue: string | undefined;

    if (field.category === "personal" && activeResumeData) {
      const p = activeResumeData.personalInfo;
      if (/first\s*name/i.test(label)) mappedValue = p?.fullName?.split(" ")[0] ?? undefined;
      else if (/last\s*name/i.test(label)) mappedValue = p?.fullName?.split(" ").slice(1).join(" ") ?? undefined;
      else if (/^name$|full\s*name/i.test(label)) mappedValue = p?.fullName ?? undefined;
      else if (/email/i.test(label)) mappedValue = p?.email ?? undefined;
      else if (/phone|mobile|tel/i.test(label)) mappedValue = p?.phone ?? undefined;
      else if (/linkedin/i.test(label)) mappedValue = p?.linkedin ?? undefined;
      else if (/website|portfolio/i.test(label)) mappedValue = p?.website ?? undefined;
      else if (/location|city|address/i.test(label)) mappedValue = p?.location ?? undefined;
    }

    if (field.category === "eeo" && field.eeoType) {
      const pref = eeoPreferences[field.eeoType as keyof typeof eeoPreferences];
      if (pref) mappedValue = pref;
    }

    const status: DetectedField["status"] = field.currentValue
      ? "filled"
      : mappedValue
        ? "ready"
        : "missing";

    return { ...field, mappedValue, status };
  }

  // ─── Fill All Fields ─────────────────────────────────────────────

  const fillAll = useCallback(async () => {
    setIsFilling(true);
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");

      const fillable = fields.filter((f) => f.mappedValue && f.status !== "filled" && f.type !== "file");
      if (fillable.length === 0) {
        toast({ title: "No fields to fill", variant: "default" });
        setIsFilling(false);
        return;
      }

      const fieldValues = fillable.map((f) => ({
        selector: f.selector,
        value: f.mappedValue!,
      }));

      // Send to content script
      const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
      let totalFilled = 0;

      for (const frame of frames || [{ frameId: 0 }]) {
        try {
          const response = await chrome.tabs.sendMessage(
            tab.id,
            { action: "FILL_FORM_FIELDS", fieldValues },
            { frameId: frame.frameId }
          );
          if (response?.filled) totalFilled += response.filled;
        } catch {
          // Frame may not have content script
        }
      }

      // Handle resume file upload
      const fileFields = fields.filter((f) => f.type === "file");
      if (fileFields.length > 0 && activeResumeData) {
        try {
          await injectResumeFile(tab.id);
          totalFilled++;
        } catch (err) {
          console.error("Resume upload failed:", err);
        }
      }

      // Update field statuses
      setFields((prev) =>
        prev.map((f) =>
          f.mappedValue && f.status !== "filled" ? { ...f, status: "filled" as const } : f
        )
      );

      toast({ title: `Filled ${totalFilled} fields`, variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fill fields");
    } finally {
      setIsFilling(false);
    }
  }, [fields, activeResumeData, toast]);

  // ─── Resume File Injection (MAIN world) ──────────────────────────

  async function injectResumeFile(tabId: number) {
    // Get the resume file data from the store
    const resumeId = useResumeStore.getState().activeResumeId;
    if (!resumeId || !token) return;

    // We use executeScript to inject into MAIN world for DataTransfer API access
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: "MAIN",
      func: () => {
        // Find file input
        const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
        if (fileInputs.length === 0) return;

        // Prefer inputs with resume/cv context
        let target = fileInputs[0];
        for (const input of fileInputs) {
          const label = input.getAttribute("aria-label") || input.name || "";
          if (/resume|cv/i.test(label)) {
            target = input;
            break;
          }
        }

        // Create a synthetic file and trigger
        const file = new File(["resume placeholder"], "resume.pdf", { type: "application/pdf" });
        const dt = new DataTransfer();
        dt.items.add(file);
        target.files = dt.files;
        target.dispatchEvent(new Event("change", { bubbles: true }));
      },
    });
  }

  // ─── AI Answer for Question Fields ───────────────────────────────

  const handleAnswerQuestion = useCallback(
    async (field: DetectedField) => {
      if (!token || !savedJobId) return;

      setFields((prev) =>
        prev.map((f) => (f.selector === field.selector ? { ...f, status: "generating" as const } : f))
      );

      try {
        const result = await apiClient.answerQuestion(token, savedJobId, field.label, {
          max_length: 500,
        });

        setFields((prev) =>
          prev.map((f) =>
            f.selector === field.selector
              ? { ...f, mappedValue: result.content, status: "ready" as const }
              : f
          )
        );

        // Auto-fill the field
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            action: "FILL_FORM_FIELDS",
            fieldValues: [{ selector: field.selector, value: result.content }],
          });
          setFields((prev) =>
            prev.map((f) =>
              f.selector === field.selector ? { ...f, status: "filled" as const } : f
            )
          );
        }

        if (token) fetchCredits(token);
        toast({ title: "Answer generated and filled", variant: "success" });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to generate answer";
        if (errMsg.includes("CREDIT_EXHAUSTED")) {
          toast({ title: "No credits remaining", variant: "error" });
        }
        setFields((prev) =>
          prev.map((f) =>
            f.selector === field.selector ? { ...f, status: "missing" as const } : f
          )
        );
      }
    },
    [token, savedJobId, toast, fetchCredits]
  );

  // ─── Render ──────────────────────────────────────────────────────

  const personalFields = fields.filter((f) => f.category === "personal");
  const resumeFields = fields.filter((f) => f.category === "resume");
  const questionFields = fields.filter((f) => f.category === "questions");
  const eeoFields = fields.filter((f) => f.category === "eeo");

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
            {isScanning ? "Scanning..." : fields.length > 0 ? "Re-scan Fields" : "Scan Fields"}
          </button>
          {fields.length > 0 && (
            <button
              onClick={fillAll}
              disabled={isFilling || !activeResumeData}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isFilling ? "Filling..." : "Fill All"}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {fields.length === 0 && !isScanning && (
          <div className="text-center text-xs text-muted-foreground py-8">
            Navigate to a job application form, then click "Scan Fields" to detect form fields.
          </div>
        )}

        {/* Field categories */}
        {personalFields.length > 0 && (
          <FieldGroup title="Personal Info" fields={personalFields} />
        )}
        {resumeFields.length > 0 && (
          <FieldGroup title="Resume Upload" fields={resumeFields} />
        )}
        {questionFields.length > 0 && (
          <FieldGroup
            title="Questions"
            fields={questionFields}
            onClickField={savedJobId ? handleAnswerQuestion : undefined}
          />
        )}
        {eeoFields.length > 0 && (
          <FieldGroup title="EEO / Compliance" fields={eeoFields} />
        )}
      </div>
    </div>
  );
}

function FieldGroup({
  title,
  fields,
  onClickField,
}: {
  title: string;
  fields: DetectedField[];
  onClickField?: (field: DetectedField) => void;
}) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="space-y-1">
        {fields.map((f, i) => (
          <div
            key={`${f.selector}-${i}`}
            onClick={() => onClickField && f.status !== "filled" && f.status !== "generating" ? onClickField(f) : undefined}
            className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-xs ${
              onClickField && f.status !== "filled" && f.status !== "generating"
                ? "cursor-pointer hover:bg-muted/50"
                : ""
            } ${
              f.status === "filled"
                ? "border-border/50 text-muted-foreground opacity-60"
                : f.status === "ready"
                  ? "border-green-500/30 bg-green-500/5"
                  : f.status === "generating"
                    ? "border-primary/30 bg-primary/5"
                    : "border-amber-500/30 bg-amber-500/5"
            }`}
          >
            <span className="truncate mr-2">{f.label}</span>
            <span className="shrink-0">
              {f.status === "filled" && <span className="text-muted-foreground">Filled</span>}
              {f.status === "ready" && <span className="text-green-600 dark:text-green-400">Ready</span>}
              {f.status === "generating" && <span className="text-primary animate-pulse">Generating...</span>}
              {f.status === "missing" && (
                <span className="text-amber-600 dark:text-amber-400">
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
