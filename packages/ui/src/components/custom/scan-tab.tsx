import React from "react"
import { JobCard, JobData, MatchData } from "./job-card"
import { Button } from "@/components/ui/button"
import { EmptyJobState } from "./empty-job-state"

export interface ScanTabProps {
    jobData: JobData
    matchData: MatchData | null
    isScanning: boolean
    isAnalyzing: boolean
    autoScanEnabled: boolean
    onScanPage: () => void
    onUpdateJobField: (field: keyof JobData, value: string) => void
    onAnalyzeMatch: (data?: Partial<JobData>) => void
    onToggleAutoScan: () => void
    onClearJob: () => void
    onSwitchTab: (tab: string) => void
}

export function ScanTab({
    jobData,
    matchData,
    isScanning,
    isAnalyzing,
    autoScanEnabled,
    onScanPage,
    onUpdateJobField,
    onAnalyzeMatch,
    onToggleAutoScan,
    onClearJob,
    onSwitchTab,
}: ScanTabProps) {
    const handleAnalyze = (data?: Partial<JobData>) => {
        if (data) {
            if (data.title) onUpdateJobField("title", data.title);
            if (data.company) onUpdateJobField("company", data.company);
            if (data.description) onUpdateJobField("description", data.description);
        }
        onAnalyzeMatch();
    };

    return (
        <div className="flex flex-col gap-3 p-1">
            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={autoScanEnabled}
                        onChange={onToggleAutoScan}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Auto-scan
                </label>

                <div className="flex gap-1.5">
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                            // Manual entry fallback
                            onUpdateJobField("title", "New Job");
                            onUpdateJobField("company", "Company");
                            onUpdateJobField("description", "Paste job description here...");
                        }}
                    >
                        Add Manually
                    </Button>
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={onClearJob}
                    >
                        Clear
                    </Button>
                    <Button
                        size="xs"
                        onClick={onScanPage}
                        disabled={isScanning}
                    >
                        {isScanning ? "Scanning..." : "Scan Page"}
                    </Button>
                </div>
            </div>

            {/* Job Card or Waiting State */}
            {jobData.description || (jobData.title && jobData.company) ? (
                <JobCard
                    job={jobData}
                    match={matchData ?? undefined}
                    isEditing={!jobData.description && !jobData.title}
                    onAnalyze={handleAnalyze}
                    onDiveDeeper={() => onSwitchTab("ai-studio")}
                    onCoach={() => onSwitchTab("coach")}
                />
            ) : (
                <EmptyJobState />
            )}
        </div>
    )
}
