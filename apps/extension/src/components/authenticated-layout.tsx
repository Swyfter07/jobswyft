import { AppHeader, ExtensionSidebar, NonJobPageView } from "@jobswyft/ui";
import { useAuthStore } from "../stores/auth-store";
import { useThemeStore } from "../stores/theme-store";
import { useSidebarStore } from "../stores/sidebar-store";
import { useCreditsStore } from "../stores/credits-store";
import { DASHBOARD_URL, SIDE_PANEL_CLASSNAME } from "../lib/constants";

export function AuthenticatedLayout() {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    sidebarState,
    activeTab,
    aiStudioSubTab,
    setActiveTab,
    setAIStudioSubTab,
    resetJob,
  } = useSidebarStore();
  const { credits, maxCredits } = useCreditsStore();

  const isDark = theme === "dark";

  // Determine locked state: AI Studio, Autofill, Coach locked when no job detected
  const isLocked = sidebarState === "non-job-page" || sidebarState === "logged-out";

  const handleOpenDashboard = () => {
    try {
      chrome.tabs.create({ url: DASHBOARD_URL });
    } catch (error) {
      console.error("Failed to open dashboard:", error);
      // Fallback: open in current tab if extension API unavailable
      window.open(DASHBOARD_URL, "_blank");
    }
  };

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

  // Placeholder for manual job paste (EXT.5)
  const handlePasteJobDescription = () => {
    console.log("Paste job description (placeholder for EXT.5)");
  };

  // Build tab content based on sidebar state
  const scanContent =
    sidebarState === "non-job-page" ? (
      <NonJobPageView onPasteJobDescription={handlePasteJobDescription} />
    ) : (
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
    <ExtensionSidebar
      header={header}
      className={SIDE_PANEL_CLASSNAME}
      isLocked={isLocked}
      activeTab={activeTab}
      onTabChange={(tab: string) => setActiveTab(tab as typeof activeTab)}
      aiStudioSubTab={aiStudioSubTab}
      onAIStudioSubTabChange={(subTab: string) =>
        setAIStudioSubTab(subTab as typeof aiStudioSubTab)
      }
      scanContent={scanContent}
      studioContent={studioContent}
      autofillContent={autofillContent}
      coachContent={coachContent}
      creditBar={{ credits, maxCredits }}
    />
  );
}
