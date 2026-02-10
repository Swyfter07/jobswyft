import {
  StudioTab as UIStudioTab,
} from "@jobswyft/ui";
import type { JobData } from "@jobswyft/ui";
import type { UseOpenAIReturn } from "@/hooks/use-openai";

interface StudioTabProps {
  openai: UseOpenAIReturn;
  jobData: JobData;
  isLocked: boolean;
  matchData?: any; // Replace with proper type if available
}

export function StudioTab({ openai, jobData, isLocked, matchData }: StudioTabProps) {
  return (
    <UIStudioTab
      isLocked={isLocked}
      isGenerating={openai.isGenerating}
      matchData={matchData}
    />
  );
}
