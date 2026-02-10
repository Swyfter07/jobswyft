import React, { useState } from "react"
import { AIStudio, AIStudioProps } from "./ai-studio"
import { JobData, MatchData } from "./job-card"

export interface StudioTabProps {
    isLocked: boolean
    isGenerating: boolean
    matchData?: any // Replace with specific type
    onTabChange?: (tab: string) => void
}

export function StudioTab({ isLocked, isGenerating, matchData }: StudioTabProps) {
    const [activeTab, setActiveTab] = useState("match");

    return (
        <div className="flex flex-col gap-3 p-1 h-full">
            <AIStudio
                isLocked={isLocked}
                matchAnalysis={!isLocked ? matchData : undefined}
                isGenerating={isGenerating}
                generatingLabel="Generating..."
                creditBalance={10}
                defaultTab="match"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="h-full"
                onUnlock={() => {
                    // Could open settings dialog
                }}
            />
        </div>
    );
}
