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
import { DASHBOARD_URL, SIDE_PANEL_CLASSNAME } from "../lib/constants";

/** Storage key used by background worker to signal auto-scan */
const AUTO_SCAN_STORAGE_KEY = "jobswyft-auto-scan-request";

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
  const lastProcessedTimestamp = useRef(0);

  // Fetch resumes on mount when authenticated
  useEffect(() => {
    if (accessToken && resumes.length === 0) {
      fetchResumes(accessToken);
    }
  }, [accessToken, resumes.length, fetchResumes]);

  // ─── Core scan function: injects scraper into page via executeScript ─
  const performScan = useCallback(
    async (tabId: number) => {
      scanStore.startScan();
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId, allFrames: true },
          func: scrapeJobPage,
        });

        // Aggregate results from multiple frames — take best non-empty values
        let best = { title: "", company: "", description: "", location: "", salary: "", employmentType: "", sourceUrl: "" };
        for (const result of results || []) {
          const d = result?.result;
          if (!d) continue;
          if (d.title && !best.title) best.title = d.title;
          if (d.company && !best.company) best.company = d.company;
          if (d.location && !best.location) best.location = d.location;
          if (d.salary && !best.salary) best.salary = d.salary;
          if (d.employmentType && !best.employmentType) best.employmentType = d.employmentType;
          if (d.sourceUrl && !best.sourceUrl) best.sourceUrl = d.sourceUrl;
          // For description: take the longest
          if (d.description && d.description.length > (best.description?.length || 0)) {
            best.description = d.description;
          }
        }

        if (best.title || best.description || best.company) {
          onUrlChange(best.sourceUrl, true);
          scanStore.setScanResult(best);
          // Sync to sidebar store for downstream features (EXT.6+ match/cover-letter/chat)
          setJobData({
            title: best.title,
            company: best.company,
            location: best.location,
            salary: best.salary || undefined,
            employmentType: best.employmentType || undefined,
            sourceUrl: best.sourceUrl || undefined,
            description: best.description || undefined,
          });
          setSidebarState("job-detected");
        } else {
          // No meaningful data extracted
          scanStore.resetScan();
        }
      } catch (err) {
        scanStore.setScanError(
          err instanceof Error ? err.message : "Failed to scan page"
        );
      }
    },
    [scanStore, onUrlChange, setJobData, setSidebarState]
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
      if (!request?.tabId || !request?.timestamp) return;

      // Deduplicate — skip if already processed
      if (request.timestamp <= lastProcessedTimestamp.current) return;
      lastProcessedTimestamp.current = request.timestamp;

      performScan(request.tabId);
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
        <JobCard
          job={currentJobData}
          isEditing={scanStore.isEditing}
          onEditToggle={() => scanStore.toggleEdit()}
          onSave={handleSaveJob}
          onFieldChange={handleFieldChange}
          isSaving={scanStore.isSaving}
        />
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
