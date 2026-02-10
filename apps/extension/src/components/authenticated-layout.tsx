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
import { useCreditsStore } from "../stores/credits-store";
import { useSettingsStore } from "../stores/settings-store";
import { scrapeJobPage } from "../features/scanning/scanner";
import { validateExtraction, type ExtractionSource } from "../features/scanning/extraction-validator";
import { cleanHtmlForAI } from "../features/scanning/html-cleaner";
import { aggregateFrameResults } from "../features/scanning/frame-aggregator";
import { apiClient } from "../lib/api-client";
import { DASHBOARD_URL, SIDE_PANEL_CLASSNAME, AUTO_SCAN_STORAGE_KEY, SENTINEL_STORAGE_KEY } from "../lib/constants";
import { AIStudioTab } from "./ai-studio-tab";
import { AutofillTab } from "./autofill-tab";
import { CoachTab } from "./coach-tab";
import { ResumeDetailView } from "./resume-detail-view";
import { SettingsDialog } from "./settings-dialog";
import { ErrorBoundary } from "./error-boundary";
import { ToastProvider } from "./toast-context";

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
    activeTab,
    setActiveTab,
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
  const fetchCredits = useCreditsStore((s) => s.fetchCredits);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";
  const lastProcessedId = useRef("");
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewLayer, setViewLayer] = useState<"main" | "resume_detail">("main");

  // Fetch resumes on mount when authenticated
  useEffect(() => {
    if (accessToken && resumes.length === 0) {
      fetchResumes(accessToken);
    }
  }, [accessToken, resumes.length, fetchResumes]);

  // Re-fetch active resume detail if ID is persisted but data was lost (not persisted)
  useEffect(() => {
    if (accessToken && activeResumeId && !activeResumeData && !resumeLoading) {
      useResumeStore.getState().fetchResumeDetail(accessToken, activeResumeId);
    }
  }, [accessToken, activeResumeId, activeResumeData, resumeLoading]);

  // Fetch credits on mount
  useEffect(() => {
    if (accessToken) {
      fetchCredits(accessToken);
    }
  }, [accessToken, fetchCredits]);

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
        const { data: best, sources: bestSources } = aggregateFrameResults(results);

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

          // Auto-save job to get savedJobId for AI API calls
          if (accessToken && best.description) {
            scanStore.saveJob(accessToken).catch(() => {
              // Non-critical: user can manually save later
            });
          }

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
                const { data: reBest, sources: reSources } = aggregateFrameResults(reResults);

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
  // Wait for store hydration, then skip if we already have a persisted job
  useEffect(() => {
    const doScan = () => {
      const { scanStatus: persisted } = useScanStore.getState();
      if (persisted === "success") return; // Already have a job from persistence

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          performScan(tab.id);
        }
      });
    };

    if (useScanStore.persist.hasHydrated()) {
      doScan();
    } else {
      const unsub = useScanStore.persist.onFinishHydration(() => {
        doScan();
        unsub();
      });
    }
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
      const requestId = request.id;
      if (!requestId || requestId === lastProcessedId.current) return;
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

  // ─── Auto-analysis: trigger match when conditions met (Task 15) ────
  const autoAnalysis = useSettingsStore((s) => s.autoAnalysis);
  const matchData = useSidebarStore((s) => s.matchData);

  useEffect(() => {
    const { savedJobId } = useScanStore.getState();

    if (
      autoAnalysis &&
      savedJobId &&
      activeResumeId &&
      !matchData &&
      accessToken
    ) {
      apiClient
        .analyzeMatch(accessToken, savedJobId)
        .then((result) => {
          useSidebarStore.getState().setMatchData({
            score: result.match_score,
            matchedSkills: result.strengths,
            missingSkills: result.gaps,
            summary: result.recommendations.join("; "),
          });
        })
        .catch(() => {
          // Non-critical: user can manually trigger from AI Studio
        });
    }
  }, [autoAnalysis, scanStore.savedJobId, activeResumeId, matchData, accessToken]);

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

  // ─── Header ─────────────────────────────────────────────────────────
  const header = (
    <AppHeader
      onSignOut={signOut}
      onThemeToggle={toggleTheme}
      onOpenDashboard={handleOpenDashboard}
      onReset={handleReset}
      onProfileClick={() => setSettingsOpen(true)}
      resetButton
      isDarkMode={isDark}
    />
  );

  // ─── Context Content (Resume Card) ─────────────────────────────────
  const resumeSummaries = useMemo(
    () => resumes.map((r) => ({ id: r.id, fileName: r.fileName })),
    [resumes]
  );

  const contextContent = (
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
      onDrillDown={() => setViewLayer("resume_detail")}
      onRetry={handleRetry}
      onClearError={clearResumeError}
    />
  );

  // ─── Scan Content ───────────────────────────────────────────────────
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
          {/* Save error (visible to user) */}
          {scanStore.error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 text-center">
              {scanStore.error}
            </p>
          )}
          <JobCard
            job={currentJobData}
            match={matchData ?? undefined}
            isEditing={scanStore.isEditing}
            onEditToggle={() => scanStore.toggleEdit()}
            onSave={handleSaveJob}
            onFieldChange={handleFieldChange}
            isSaving={scanStore.isSaving}
            isScanning={false}
            onScan={handleManualScan}
            isAnalyzing={autoAnalysis && !!scanStore.savedJobId && !!activeResumeId && !matchData}
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

  // ─── Tab lock: AI Studio, Autofill, Coach locked when no job ───────
  const isLocked = !scanStore.jobData?.title;

  return (
    <ErrorBoundary>
      <ToastProvider>
        {viewLayer === "resume_detail" ? (
          <ResumeDetailView onClose={() => setViewLayer("main")} />
        ) : (
          <ExtensionSidebar
            className={SIDE_PANEL_CLASSNAME}
            header={header}
            contextContent={contextContent}
            scanContent={scanContent}
            studioContent={<AIStudioTab />}
            autofillContent={<AutofillTab />}
            coachContent={<CoachTab />}
            isLocked={isLocked}
            activeTab={activeTab}
            onTabChange={(tab: string) => setActiveTab(tab as import("../stores/sidebar-store").MainTab)}
          />
        )}
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload resume PDF"
        />
      </ToastProvider>
    </ErrorBoundary>
  );
}
