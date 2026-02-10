import { ScanTab as UIScanTab } from "@jobswyft/ui";
import { JobData } from "@jobswyft/ui";
import type { UseJobScanReturn } from "@/hooks/use-job-scan";

interface ScanTabProps extends UseJobScanReturn {
  onSwitchTab: (tab: string) => void;
}

export function ScanTab({
  jobData,
  matchData,
  isScanning,
  isAnalyzing,
  autoScanEnabled,
  scanPage,
  updateJobField,
  analyzeMatch,
  toggleAutoScan,
  clearJob,
  onSwitchTab,
}: ScanTabProps) {
  // We need to adapt the props to match what the UI component expects
  // The UI component uses 'onUpdateJobField' instead of 'updateJobField' etc.

  return (
    <UIScanTab
      jobData={jobData}
      matchData={matchData}
      isScanning={isScanning}
      isAnalyzing={isAnalyzing}
      autoScanEnabled={autoScanEnabled}
      onScanPage={scanPage}
      onUpdateJobField={updateJobField}
      onAnalyzeMatch={analyzeMatch}
      onToggleAutoScan={toggleAutoScan}
      onClearJob={clearJob}
      onSwitchTab={onSwitchTab}
    />
  );
}
