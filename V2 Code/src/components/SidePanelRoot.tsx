import { useState } from "react";
import {
  ExtensionSidebar,
  AppHeader,
} from "@jobswyft/ui";
import { useResumes } from "@/hooks/use-resumes";
import { useJobScan } from "@/hooks/use-job-scan";
import { useOpenAI } from "@/hooks/use-openai";
import { useTheme } from "@/hooks/use-theme"; // New import
import { ResumeContext } from "./ResumeContext";
import { ScanTab } from "./ScanTab";
import { StudioTab } from "./StudioTab";
import { AutofillTab } from "./AutofillTab";
import { CoachTab } from "./CoachTab";
import { SettingsDialog } from "./SettingsDialog";
import type { CoachMessage } from "@jobswyft/ui";

export function SidePanelRoot() {
  const resumes = useResumes();
  const jobScan = useJobScan();
  const openai = useOpenAI();
  const { isDarkMode, toggleTheme } = useTheme(); // Use the hook

  const [activeTab, setActiveTab] = useState("scan");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Lock AI features when no job is scanned
  const isLocked = !jobScan.jobData.description;

  // Placeholder functions and data for the new props
  const jobData = jobScan.jobData; // Assuming jobData comes from useJobScan
  const fullMatchData = jobScan.matchData; // Assuming matchData comes from useJobScan
  const isScanning = false; // Placeholder
  const isAnalyzing = false; // Placeholder
  const handleScanPage = () => { }; // Placeholder
  const handleUpdateJobField = () => { }; // Placeholder
  const handleAnalyzeMatch = () => { }; // Placeholder
  const handleClearJob = () => { }; // Placeholder
  const handleTabChange = setActiveTab; // Placeholder
  const messages: CoachMessage[] = []; // Placeholder for coach messages
  const handleSendMessage = () => { }; // Placeholder for coach send message

  return (
    <>
      <ExtensionSidebar
        header={
          <AppHeader
            appName="JobSwyft"
            onThemeToggle={toggleTheme}
            isDarkMode={isDarkMode}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        }
        contextContent={<ResumeContext {...resumes} />}
        scanContent={
          <ScanTab
            jobData={jobData}
            matchData={fullMatchData}
            isScanning={isScanning}
            isAnalyzing={isAnalyzing}
            autoScanEnabled={true}
            onScanPage={handleScanPage}
            onUpdateJobField={handleUpdateJobField}
            onAnalyzeMatch={handleAnalyzeMatch}
            onToggleAutoScan={() => { }}
            onClearJob={handleClearJob}
            onSwitchTab={handleTabChange}
          />
        }
        studioContent={
          <StudioTab
            openai={openai}
            jobData={jobData}
            isLocked={!jobData.description} // Example logic
            matchData={fullMatchData}
          />
        }
        autofillContent={<AutofillTab />}
        coachContent={<CoachTab messages={messages} onSendMessage={handleSendMessage} isLocked={false} hasKey={true} />}
        isLocked={isLocked}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        creditBar={{ credits: 10, maxCredits: 10 }}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        openai={openai}
      />
    </>
  );
}
