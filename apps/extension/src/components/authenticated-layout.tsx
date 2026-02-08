import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  AppHeader,
  ExtensionSidebar,
  ResumeCard,
  JobCard,
  ScanEmptyState,
  Skeleton,
} from "@jobswyft/ui";
import type { JobData } from "@jobswyft/ui";
import { useAuthStore } from "../stores/auth-store";
import { useThemeStore } from "../stores/theme-store";
import { useSidebarStore } from "../stores/sidebar-store";
import { useResumeStore } from "../stores/resume-store";
import { useScanStore } from "../stores/scan-store";
import { scrapeJobPage } from "../features/scanning/scanner";
import { validateExtraction, type ExtractionSource } from "../features/scanning/extraction-validator";
import { cleanHtmlForAI } from "../features/scanning/html-cleaner";
import { apiClient } from "../lib/api-client";
import { DASHBOARD_URL, SIDE_PANEL_CLASSNAME } from "../lib/constants";

/** Storage key used by background worker to signal auto-scan */
const AUTO_SCAN_STORAGE_KEY = "jobswyft-auto-scan-request";

/** Storage key for content sentinel readiness */
const SENTINEL_STORAGE_KEY = "jobswyft-content-ready";

/** Completeness threshold for triggering AI fallback */
const AI_FALLBACK_THRESHOLD = 0.7;

/** Completeness threshold for triggering delayed verification */
const VERIFICATION_THRESHOLD = 0.8;

/** Delay for verification re-scan (ms) */
const VERIFICATION_DELAY_MS = 5000;

export function AuthenticatedLayout() {
  const { user, accessToken, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    sidebarState,
    setSidebarState,
    setJobData,
    onUrlChange,
    resetJob,
  } = useSidebarStore();
  const {
    resumes,
    activeResumeId,
    activeResumeData,
    isLoading: resumeLoading,
    isUploading: resumeUploading,
    error: resumeError,
    fetchResumes,
    setActiveResume,
    uploadResume,
    deleteResume,
    clearError: clearResumeError,
  } = useResumeStore();
  const scanStore = useScanStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  const lastProcessedId = useRef("");
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch resumes on mount when authenticated
  useEffect(() => {
    if (accessToken && resumes.length === 0) {
      fetchResumes(accessToken);
    }
  }, [accessToken, resumes.length, fetchResumes]);

  // Cleanup verification timer on unmount
  useEffect(() => {
    return () => {
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
      }
    };
  }, []);

  // ─── Core scan function: injects scraper into page via executeScript ─
  const performScan = useCallback(
    async (tabId: number, options?: { board?: string | null; skipAI?: boolean }) => {
      const board = options?.board ?? null;
      const skipAI = options?.skipAI ?? false;

      scanStore.startScan();
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId, allFrames: true },
          func: scrapeJobPage,
          args: [board],
        });

        // Aggregate results — main frame (frameId 0) first, sub-frames fill gaps only
        const best: Record<string, string> = { title: "", company: "", description: "", location: "", salary: "", employmentType: "", sourceUrl: "" };
        const bestSources: Record<string, string> = {};
        const mainFrame = (results || []).find(r => r.frameId === 0);
        const subFrames = (results || []).filter(r => r.frameId !== 0);

        for (const d of [mainFrame?.result, ...subFrames.map(r => r?.result)]) {
          if (!d) continue;
          if (d.title && !best.title) { best.title = d.title; if (d.sources?.title) bestSources.title = d.sources.title; }
          if (d.company && !best.company) { best.company = d.company; if (d.sources?.company) bestSources.company = d.sources.company; }
          if (d.location && !best.location) { best.location = d.location; if (d.sources?.location) bestSources.location = d.sources.location; }
          if (d.salary && !best.salary) { best.salary = d.salary; if (d.sources?.salary) bestSources.salary = d.sources.salary; }
          if (d.employmentType && !best.employmentType) { best.employmentType = d.employmentType; if (d.sources?.employmentType) bestSources.employmentType = d.sources.employmentType; }
          if (d.sourceUrl && !best.sourceUrl) best.sourceUrl = d.sourceUrl;
          if (d.description && d.description.length > (best.description?.length || 0)) {
            best.description = d.description;
            if (d.sources?.description) bestSources.description = d.sources.description;
          }
        }

        // ─── Confidence scoring (AC3, AC4) ─────────────────────────────
        let validation = validateExtraction(best, bestSources as Record<string, ExtractionSource>);

        // ─── AI Fallback (AC6) — only on initial scan, not verification ─
        if (!skipAI && validation.completeness < AI_FALLBACK_THRESHOLD && accessToken) {
          try {
            const html = await cleanHtmlForAI(tabId);
            if (html) {
              const aiResult = await apiClient.extractJobWithAI(
                accessToken,
                html,
                best.sourceUrl,
                best
              );
              // Merge AI results: fill only empty/low-confidence fields
              if (aiResult.title && !best.title) { best.title = aiResult.title; bestSources.title = "ai-llm"; }
              if (aiResult.company && !best.company) { best.company = aiResult.company; bestSources.company = "ai-llm"; }
              if (aiResult.description && (!best.description || best.description.length < 50)) {
                best.description = aiResult.description;
                bestSources.description = "ai-llm";
              }
              if (aiResult.location && !best.location) { best.location = aiResult.location; bestSources.location = "ai-llm"; }
              if (aiResult.salary && !best.salary) { best.salary = aiResult.salary; bestSources.salary = "ai-llm"; }
              if (aiResult.employment_type && !best.employmentType) {
                best.employmentType = aiResult.employment_type;
                bestSources.employmentType = "ai-llm";
              }

              // Recompute validation after AI merge
              validation = validateExtraction(best, bestSources as Record<string, ExtractionSource>);
            }
          } catch {
            // AI failure should not block the scan result (AC6 guardrail)
          }
        }

        // ─── Strict success validation (AC4) ───────────────────────────
        if (best.title && best.company) {
          onUrlChange(best.sourceUrl, true);
          scanStore.setScanResult(best, validation.confidence, board);
          // Sync to sidebar store for downstream features
          setJobData({
            title: best.title,
            company: best.company,
            location: best.location,
            salary: best.salary || undefined,
            employmentType: best.employmentType || undefined,
            sourceUrl: best.sourceUrl || undefined,
            description: best.description || undefined,
          });
          if (board) scanStore.setBoard(board);
          setSidebarState("job-detected");

          // ─── Delayed verification (AC7) ────────────────────────────
          if (!skipAI && validation.completeness < VERIFICATION_THRESHOLD) {
            scanStore.setRefining(true);
            if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
            verificationTimerRef.current = setTimeout(async () => {
              try {
                // Re-scan rule-based only, no AI
                const reResults = await chrome.scripting.executeScript({
                  target: { tabId, allFrames: true },
                  func: scrapeJobPage,
                  args: [board],
                });

                // Fresh scan — don't carry forward stale data from initial scan
                const reBest: Record<string, string> = { title: "", company: "", description: "", location: "", salary: "", employmentType: "", sourceUrl: "" };
                const reSources: Record<string, string> = {};
                const reMainFrame = (reResults || []).find(r => r.frameId === 0);
                const reSubFrames = (reResults || []).filter(r => r.frameId !== 0);
                for (const d of [reMainFrame?.result, ...reSubFrames.map(r => r?.result)]) {
                  if (!d) continue;
                  if (d.title && !reBest.title) { reBest.title = d.title; if (d.sources?.title) reSources.title = d.sources.title; }
                  if (d.company && !reBest.company) { reBest.company = d.company; if (d.sources?.company) reSources.company = d.sources.company; }
                  if (d.location && !reBest.location) { reBest.location = d.location; if (d.sources?.location) reSources.location = d.sources.location; }
                  if (d.salary && !reBest.salary) { reBest.salary = d.salary; if (d.sources?.salary) reSources.salary = d.sources.salary; }
                  if (d.employmentType && !reBest.employmentType) { reBest.employmentType = d.employmentType; if (d.sources?.employmentType) reSources.employmentType = d.sources.employmentType; }
                  if (d.sourceUrl && !reBest.sourceUrl) reBest.sourceUrl = d.sourceUrl;
                  if (d.description && d.description.length > (reBest.description?.length || 0)) {
                    reBest.description = d.description;
                    if (d.sources?.description) reSources.description = d.sources.description;
                  }
                }

                // Backfill secondary fields from initial scan if fresh scan missed them
                if (!reBest.location && best.location) { reBest.location = best.location; reSources.location = bestSources.location; }
                if (!reBest.salary && best.salary) { reBest.salary = best.salary; reSources.salary = bestSources.salary; }
                if (!reBest.employmentType && best.employmentType) { reBest.employmentType = best.employmentType; reSources.employmentType = bestSources.employmentType; }
                if (!reBest.sourceUrl && best.sourceUrl) reBest.sourceUrl = best.sourceUrl;

                const reValidation = validateExtraction(reBest, reSources as Record<string, ExtractionSource>);
                // Always update if verification found valid title + company (fresh data > stale)
                if (reBest.title && reBest.company) {
                  scanStore.setScanResult(reBest, reValidation.confidence, board);
                  setJobData({
                    title: reBest.title,
                    company: reBest.company,
                    location: reBest.location,
                    salary: reBest.salary || undefined,
                    employmentType: reBest.employmentType || undefined,
                    sourceUrl: reBest.sourceUrl || undefined,
                    description: reBest.description || undefined,
                  });
                }
              } catch {
                // Verification failure is non-critical
              } finally {
                scanStore.setRefining(false);
              }
            }, VERIFICATION_DELAY_MS);
          }
        } else {
          // Missing title OR company → error state with manual entry prompt
          scanStore.setScanError(
            "Could not detect job title or company. Try scanning again or paste the job description."
          );
        }
      } catch (err) {
        scanStore.setScanError(
          err instanceof Error ? err.message : "Failed to scan page"
        );
      }
    },
    [scanStore, onUrlChange, setJobData, setSidebarState, accessToken]
  );

  // ─── Scan on mount: scan the active tab when side panel opens ──────
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        performScan(tab.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Listen for auto-scan signals from background via storage ──────
  useEffect(() => {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local" || !changes[AUTO_SCAN_STORAGE_KEY]) return;
      const request = changes[AUTO_SCAN_STORAGE_KEY].newValue;
      if (!request?.tabId) return;

      // Deduplicate using unique ID (AC: 5.6 — crypto.randomUUID per signal)
      const requestId = request.id ?? `${request.tabId}-${request.timestamp}`;
      if (requestId === lastProcessedId.current) return;
      lastProcessedId.current = requestId;

      performScan(request.tabId, { board: request.board ?? null });
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [performScan]);

  // ─── Listen for content sentinel readiness signal (AC1, 5.4) ──────
  useEffect(() => {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "session" || !changes[SENTINEL_STORAGE_KEY]) return;
      const signal = changes[SENTINEL_STORAGE_KEY].newValue;
      if (!signal?.url) return;

      // Sentinel signals readiness — trigger scan on active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          performScan(tab.id);
        }
      });
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [performScan]);

  const handleOpenDashboard = () => {
    try {
      chrome.tabs.create({ url: DASHBOARD_URL });
    } catch (error) {
      console.error("Failed to open dashboard:", error);
      window.open(DASHBOARD_URL, "_blank");
    }
  };

  const handleReset = useCallback(() => {
    resetJob();
    scanStore.resetScan();
    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
      verificationTimerRef.current = null;
    }
  }, [resetJob, scanStore]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && accessToken) {
        uploadResume(accessToken, file);
      }
      e.target.value = "";
    },
    [accessToken, uploadResume]
  );

  const handleResumeSelect = useCallback(
    (id: string) => {
      if (accessToken) {
        setActiveResume(accessToken, id);
      }
    },
    [accessToken, setActiveResume]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (accessToken) {
        deleteResume(accessToken, id);
      }
    },
    [accessToken, deleteResume]
  );

  const handleRetry = useCallback(() => {
    if (accessToken) {
      fetchResumes(accessToken);
    }
  }, [accessToken, fetchResumes]);

  const handleManualScan = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        performScan(tab.id);
      }
    });
  }, [performScan]);

  const handleManualEntry = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? "";
      scanStore.setScanResult({ sourceUrl: url });
      setSidebarState("job-detected");
      if (!useScanStore.getState().isEditing) {
        scanStore.toggleEdit();
      }
    });
  }, [scanStore, setSidebarState]);

  const handleSaveJob = useCallback(
    async (_job: JobData) => {
      if (accessToken) {
        await scanStore.saveJob(accessToken);
        // Sync saved (possibly edited) job data to sidebar store
        const savedJob = useScanStore.getState().jobData;
        if (savedJob) setJobData(savedJob);
      }
    },
    [accessToken, scanStore, setJobData]
  );

  const handleFieldChange = useCallback(
    (field: keyof JobData, value: string) => {
      scanStore.updateField(field, value);
    },
    [scanStore]
  );

  const header = (
    <AppHeader
      onSignOut={signOut}
      onThemeToggle={toggleTheme}
      onOpenDashboard={handleOpenDashboard}
      onReset={handleReset}
      resetButton
      isDarkMode={isDark}
    />
  );

  const resumeSummaries = useMemo(
    () => resumes.map((r) => ({ id: r.id, fileName: r.fileName })),
    [resumes]
  );

  // ─── Scan Content ─────────────────────────────────────────────────

  const currentJobData =
    scanStore.isEditing && scanStore.editedJobData
      ? ({
          title: scanStore.editedJobData.title ?? "",
          company: scanStore.editedJobData.company ?? "",
          location: scanStore.editedJobData.location ?? "",
          ...scanStore.editedJobData,
        } as JobData)
      : scanStore.jobData;

  let scanContent: React.ReactNode;
  switch (scanStore.scanStatus) {
    case "idle":
      scanContent = (
        <ScanEmptyState
          canManualScan
          onManualScan={handleManualScan}
          onManualEntry={handleManualEntry}
        />
      );
      break;
    case "scanning":
      scanContent = (
        <div className="w-full space-y-3 rounded-lg border-2 border-card-accent-border p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      );
      break;
    case "success":
      scanContent = currentJobData ? (
        <>
          {/* Refining badge (AC7, Task 9) */}
          {scanStore.isRefining && (
            <span className="text-micro text-muted-foreground animate-pulse motion-reduce:animate-none">
              Refining...
            </span>
          )}
          <JobCard
            job={currentJobData}
            isEditing={scanStore.isEditing}
            onEditToggle={() => scanStore.toggleEdit()}
            onSave={handleSaveJob}
            onFieldChange={handleFieldChange}
            isSaving={scanStore.isSaving}
          />
        </>
      ) : null;
      break;
    case "error":
      scanContent = (
        <div className="space-y-4 rounded-lg border-2 border-card-accent-border p-6 flex flex-col items-center">
          <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 w-full text-center">
            {scanStore.error ?? "Failed to scan job page"}
          </p>
          <button
            type="button"
            className="text-sm text-primary hover:underline font-medium"
            onClick={handleManualScan}
          >
            Retry Scan
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
            onClick={handleManualEntry}
          >
            Or paste a job description
          </button>
        </div>
      );
      break;
  }

  return (
    <>
      <ExtensionSidebar className={SIDE_PANEL_CLASSNAME}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-2 bg-background z-10 shrink-0">
            {header}
          </div>

          {/* Resume Context */}
          <div className="bg-muted/30 dark:bg-muted/50 overflow-y-auto overflow-x-hidden shrink-0 scroll-fade-y scrollbar-hidden">
            <div className="px-2 py-1">
              <ResumeCard
                resumes={resumeSummaries}
                activeResumeId={activeResumeId}
                resumeData={activeResumeData}
                isLoading={resumeLoading}
                isUploading={resumeUploading}
                error={resumeError}
                onResumeSelect={handleResumeSelect}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onRetry={handleRetry}
                onClearError={clearResumeError}
                isCollapsible
                isOpen={isContextExpanded}
                onOpenChange={setIsContextExpanded}
              />
            </div>
          </div>

          {/* Main Content — scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 bg-muted/20 dark:bg-muted/40 scroll-fade-y scrollbar-hidden">
            {scanContent}
          </div>
        </div>
      </ExtensionSidebar>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload resume PDF"
      />
    </>
  );
}
