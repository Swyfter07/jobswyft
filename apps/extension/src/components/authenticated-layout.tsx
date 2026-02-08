import { useRef, useEffect, useCallback, useMemo } from "react";
import { AppHeader, ExtensionSidebar, ResumeCard } from "@jobswyft/ui";
import { useAuthStore } from "../stores/auth-store";
import { useThemeStore } from "../stores/theme-store";
import { useSidebarStore } from "../stores/sidebar-store";
import { useResumeStore } from "../stores/resume-store";
import { DASHBOARD_URL, SIDE_PANEL_CLASSNAME } from "../lib/constants";

export function AuthenticatedLayout() {
  const { user, accessToken, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    sidebarState,
    activeTab,
    setActiveTab,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  // Fetch resumes on mount when authenticated
  useEffect(() => {
    if (accessToken && resumes.length === 0) {
      fetchResumes(accessToken);
    }
  }, [accessToken, resumes.length, fetchResumes]);

  // Determine locked state: AI Studio, Autofill, Coach locked when no job detected
  const isLocked = sidebarState === "non-job-page" || sidebarState === "logged-out";

  const handleOpenDashboard = () => {
    try {
      chrome.tabs.create({ url: DASHBOARD_URL });
    } catch (error) {
      console.error("Failed to open dashboard:", error);
      window.open(DASHBOARD_URL, "_blank");
    }
  };

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && accessToken) {
        uploadResume(accessToken, file);
      }
      // Reset input so same file can be re-selected
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

  const header = (
    <AppHeader
      onSignOut={signOut}
      onThemeToggle={toggleTheme}
      onOpenDashboard={handleOpenDashboard}
      onReset={resetJob}
      resetButton
      isDarkMode={isDark}
    />
  );

  // Memoize resume list transform to avoid unnecessary ResumeCard re-renders
  const resumeSummaries = useMemo(
    () => resumes.map((r) => ({ id: r.id, fileName: r.fileName })),
    [resumes]
  );

  // Resume context content — must be a DIRECT element (not Fragment) so
  // ExtensionSidebar's cloneElement can inject isOpen/onOpenChange props
  const resumeContext = (
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
    />
  );

  // Build tab content based on sidebar state
  const scanContent = (
    <div className="text-center text-muted-foreground text-sm py-8">
      Scan content (EXT.5+)
    </div>
  );

  const studioContent = (
    <div className="text-center text-muted-foreground text-sm py-8">
      AI Studio content (EXT.6+)
    </div>
  );

  const autofillContent = (
    <div className="text-center text-muted-foreground text-sm py-8">
      Autofill content (EXT.8+)
    </div>
  );

  const coachContent = (
    <div className="text-center text-muted-foreground text-sm py-8">
      Coach content (EXT.12+)
    </div>
  );

  return (
    <>
      <ExtensionSidebar
        header={header}
        className={SIDE_PANEL_CLASSNAME}
        contextContent={resumeContext}
        isLocked={isLocked}
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab as typeof activeTab)}
        scanContent={scanContent}
        studioContent={studioContent}
        autofillContent={autofillContent}
        coachContent={coachContent}
      />
      {/* Hidden file input — placed outside contextContent so cloneElement works */}
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
