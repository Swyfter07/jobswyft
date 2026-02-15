import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AppHeader,
  Button,
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
import {
  SELECTOR_REGISTRY,
  detectJobPage,
  validateExtraction,
  aggregateFrameResults,
  type ExtractionSource,
} from "@jobswyft/engine";
import { cleanHtmlForAI } from "../features/scanning/html-cleaner";
import { toFrameResults } from "../features/scanning/frame-result-adapter";
import { apiClient } from "../lib/api-client";
import { DASHBOARD_URL, SIDE_PANEL_CLASSNAME, AUTO_SCAN_STORAGE_KEY, SENTINEL_STORAGE_KEY } from "../lib/constants";
import { useAutofillStore } from "../stores/autofill-store";
import { detectATSForm } from "@jobswyft/engine";
import { detectFormFields } from "../features/autofill/field-detector";
import { AUTOFILL_FIELD_REGISTRY } from "../features/autofill/field-registry";
import { fetchAutofillData } from "../features/autofill/autofill-data-service";
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
  const { autoScan, autoAnalysis: autoAnalysisSetting, setAutoScan, setAutoAnalysis } = useSettingsStore();
  const fetchCredits = useCreditsStore((s) => s.fetchCredits);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";
  const lastProcessedId = useRef("");
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchAnalysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewLayer, setViewLayer] = useState<"main" | "resume_detail">("main");
  const [showRescanWarning, setShowRescanWarning] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Fetch resumes + credits on mount when authenticated, then mark initial load complete.
  // Both fetches run in parallel; hasInitiallyLoaded flips to true after both resolve.
  //
  // NOTE (Task 4.3): Resume and credits stores do NOT have hydration guards (unlike
  // useScanStore which waits for persist.hasHydrated()). This is intentional — API data
  // is always fresher than persisted state, so any hydrated values get overwritten by
  // the server response. The brief overwrite is hidden by the hasInitiallyLoaded skeleton.
  const hasFetchedResumes = useRef(false);
  useEffect(() => {
    if (accessToken && !hasFetchedResumes.current) {
      hasFetchedResumes.current = true;
      Promise.all([
        fetchResumes(accessToken),
        fetchCredits(accessToken),
      ]).finally(() => {
        setHasInitiallyLoaded(true);
      });
    }
  }, [accessToken, fetchResumes, fetchCredits]);

  // Re-fetch active resume detail if ID is persisted but data was lost (not persisted)
  // Guard with a ref to prevent infinite retry loops on persistent failures (e.g. 404)
  const detailRetryCount = useRef(0);
  useEffect(() => {
    if (accessToken && activeResumeId && !activeResumeData && !resumeLoading) {
      if (detailRetryCount.current < 2) {
        detailRetryCount.current += 1;
        useResumeStore.getState().fetchResumeDetail(accessToken, activeResumeId);
      }
    }
    if (activeResumeData) {
      detailRetryCount.current = 0;
    }
  }, [accessToken, activeResumeId, activeResumeData, resumeLoading]);

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
    async (tabId: number, options?: { board?: string | null; skipAI?: boolean; skipJobPageCheck?: boolean }) => {
      const board = options?.board ?? null;
      const skipAI = options?.skipAI ?? false;

      // Guard: skip scan on non-job pages unless explicitly overridden (manual scan)
      if (!options?.skipJobPageCheck) {
        try {
          const tab = await chrome.tabs.get(tabId);
          if (!tab?.url || !detectJobPage(tab.url)) return;
        } catch {
          return; // Tab may no longer exist
        }
      }

      // FR72a: Reset autofill and scan state before starting a new scan
      // to prevent previous job's data from leaking into the new scan.
      useAutofillStore.getState().resetAutofill();
      scanStore.resetScan();

      scanStore.startScan();
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId, allFrames: true },
          func: scrapeJobPage,
          args: [board, SELECTOR_REGISTRY],
        });

        // Aggregate results — main frame (frameId 0) first, sub-frames fill gaps only
        const { data: best, sources: bestSources, hasShowMore } = aggregateFrameResults(toFrameResults(results));

        // Track show-more detection for banner display
        scanStore.setHasShowMore(hasShowMore);

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
                  args: [board, SELECTOR_REGISTRY],
                });

                // Fresh scan — don't carry forward stale data from initial scan
                const { data: reBest, sources: reSources } = aggregateFrameResults(toFrameResults(reResults));

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

      // Gate on autoScan preference (side panel can use Zustand directly)
      if (!useSettingsStore.getState().autoScan) return;

      // Deduplicate using unique ID (AC: 5.6 — crypto.randomUUID per signal)
      const requestId = request.id;
      if (!requestId || requestId === lastProcessedId.current) return;
      lastProcessedId.current = requestId;

      // ─── Journey tracking (AC7, AC10) ─────────────────────────────
      const { scanStatus, jobData } = useScanStore.getState();
      const hasExistingJob = scanStatus === "success" && jobData !== null;

      if (hasExistingJob && request.url) {
        const incomingIsJobPage = detectJobPage(request.url);
        const isSameUrl = request.url === jobData.sourceUrl;

        if (!incomingIsJobPage && !isSameUrl) {
          // User navigated to non-job page (e.g., apply form) — preserve context (FR72b)
          return;
        }
        // If incoming IS a different job page, proceed with scan (new job)
        // If same URL, proceed (re-scan same page, e.g., after show-more)
      }

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

      // Gate on autoScan preference
      if (!useSettingsStore.getState().autoScan) return;

      // Read hasShowMore from sentinel signal if present
      if (signal.hasShowMore !== undefined) {
        scanStore.setHasShowMore(signal.hasShowMore);
      }

      // Form detection: 5+ form fields on a non-job page with existing job data → Full Power state
      // Threshold is 5 (not 3) to avoid false positives from search bars/filters on job listing pages.
      // Only transition when the sentinel URL is NOT a known job page (i.e., it's an application form).
      if (signal.formFieldCount !== undefined && signal.formFieldCount >= 5) {
        const isApplicationPage = signal.url && !detectJobPage(signal.url);
        if (isApplicationPage) {
          const { scanStatus, jobData } = useScanStore.getState();
          if (scanStatus === "success" && jobData !== null) {
            setSidebarState("full-power");

            // Auto-trigger autofill detection on application pages
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
              const tab = tabs[0];
              if (!tab?.id || !tab?.url) return;

              const autofillStore = useAutofillStore.getState();
              if (autofillStore.detectionStatus === "detecting") return; // Already running

              const { board } = detectATSForm(tab.url);
              const boardName = board || null;
              const registrySerialized = AUTOFILL_FIELD_REGISTRY.map((e) => ({
                id: e.id, board: e.board, fieldType: e.fieldType,
                selectors: e.selectors, priority: e.priority, status: e.status,
              }));

              try {
                autofillStore.setDetecting();

                // Detection + data fetch in parallel
                const [results, autofillData] = await Promise.all([
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id!, allFrames: true },
                    func: detectFormFields,
                    args: [boardName, registrySerialized],
                  }),
                  accessToken ? fetchAutofillData(accessToken) : Promise.resolve(null),
                ]);

                // Aggregate frame results
                const allFields: Array<Record<string, unknown>> = [];
                const seenIds = new Set<string>();
                let totalScanned = 0;

                for (const fr of results) {
                  if (!fr?.result) continue;
                  const r = fr.result as { fields: Array<{ stableId: string }>; totalElementsScanned: number };
                  totalScanned += r.totalElementsScanned;
                  for (const field of r.fields) {
                    if (!seenIds.has(field.stableId)) {
                      seenIds.add(field.stableId);
                      allFields.push({ ...field, frameId: fr.frameId ?? 0 });
                    }
                  }
                }

                autofillStore.setDetectionResult({
                  fields: allFields as never[],
                  board: boardName,
                  url: tab.url!,
                  timestamp: Date.now(),
                  durationMs: 0,
                  totalElementsScanned: totalScanned,
                });

                if (autofillData) {
                  autofillStore.setAutofillData(autofillData);
                  autofillStore.mapFields(useSettingsStore.getState().eeoPreferences);
                }
              } catch {
                // Non-critical: user can manually scan from autofill tab
              }
            });
          }
        }
      }

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
  }, [performScan, scanStore, setSidebarState]);

  // ─── Auto-analysis: trigger match when conditions met (Task 15) ────
  const matchData = useSidebarStore((s) => s.matchData);

  useEffect(() => {
    // Clear any pending debounced call from previous dep change
    if (matchAnalysisTimer.current) clearTimeout(matchAnalysisTimer.current);

    const { savedJobId } = useScanStore.getState();

    if (
      autoAnalysisSetting &&
      savedJobId &&
      activeResumeId &&
      !matchData &&
      accessToken
    ) {
      matchAnalysisTimer.current = setTimeout(() => {
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
      }, 500);
    }

    return () => {
      if (matchAnalysisTimer.current) clearTimeout(matchAnalysisTimer.current);
    };
  }, [autoAnalysisSetting, scanStore.savedJobId, activeResumeId, matchData, accessToken]);

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
    // FR72c: Manual reset must also clear autofill state per State Preservation Matrix
    useAutofillStore.getState().resetAutofill();
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

  const doManualScan = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        performScan(tab.id, { skipJobPageCheck: true });
      }
    });
  }, [performScan]);

  const handleManualScan = useCallback(() => {
    const hasExistingJob = scanStore.jobData !== null && scanStore.scanStatus === "success";
    if (hasExistingJob) {
      setShowRescanWarning(true);
      return;
    }
    doManualScan();
  }, [scanStore.jobData, scanStore.scanStatus, doManualScan]);

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
  const handleAutoScanToggle = useCallback(() => setAutoScan(!autoScan), [autoScan, setAutoScan]);
  const handleAutoAnalysisToggle = useCallback(() => setAutoAnalysis(!autoAnalysisSetting), [autoAnalysisSetting, setAutoAnalysis]);

  const header = (
    <AppHeader
      onSignOut={signOut}
      onThemeToggle={toggleTheme}
      onOpenDashboard={handleOpenDashboard}
      onReset={handleReset}
      onProfileClick={() => setSettingsOpen(true)}
      resetButton
      isDarkMode={isDark}
      autoScanEnabled={autoScan}
      onAutoScanToggle={handleAutoScanToggle}
      autoAnalysisEnabled={autoAnalysisSetting}
      onAutoAnalysisToggle={handleAutoAnalysisToggle}
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
          {/* Rescan override warning (AC9) */}
          {showRescanWarning && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs flex flex-col gap-2">
              <span className="font-medium text-destructive">Rescan will replace the current job data.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => { setShowRescanWarning(false); doManualScan(); }}>
                  Rescan
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRescanWarning(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {/* Incomplete description banner */}
          {scanStore.hasShowMore && (
            <div className="rounded-md bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning-foreground flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Description may be incomplete. Expand &quot;Show More&quot; on the page and rescan for full details.</span>
            </div>
          )}
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
            isAnalyzing={autoAnalysisSetting && !!scanStore.savedJobId && !!activeResumeId && !matchData}
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

  // ─── Tab lock: AI Studio, Autofill locked when no job ──────────────
  const isLocked = !scanStore.jobData?.title;

  // Show loading skeleton during initial data fetch (Task 4.2)
  // Prevents flash of empty states while resumes + credits load
  if (!hasInitiallyLoaded) {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <ExtensionSidebar
            className={SIDE_PANEL_CLASSNAME}
            header={header}
            contextContent={
              <div className="space-y-3 p-2">
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            }
            scanContent={
              <div className="space-y-3 p-2">
                <Skeleton className="h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            }
            studioContent={null}
            autofillContent={null}
            coachContent={null}
            isLocked
            activeTab={activeTab}
            onTabChange={(tab: string) => setActiveTab(tab as import("../stores/sidebar-store").MainTab)}
          />
        </ToastProvider>
      </ErrorBoundary>
    );
  }

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
