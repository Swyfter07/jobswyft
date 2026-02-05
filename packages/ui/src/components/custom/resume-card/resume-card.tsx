import { useEffect } from "react"
import { ResumeSelector } from "./resume-selector"
import { ResumeUploadCard } from "./resume-upload-card"
import { ResumeBlocksCard } from "./resume-blocks-card"
import { ResumeSkeleton } from "./resume-skeleton"
import { ResumeErrorCard } from "./resume-error-card"
import type { ResumeCardProps } from "./types"
import { cn } from "@/lib/utils"

function ResumeCard({
  resumes,
  activeResumeId,
  resumeData,
  state,
  uploadProgress,
  uploadFileName,
  errorMessage,
  errorGuidanceText,
  maxResumes = 5,
  onResumeSelect,
  onUpload,
  onDelete,
  onRetry,
  maxHeight,
  entryContentMaxHeight,
  className,
}: ResumeCardProps) {
  // AC7: Auto-selection — if resumes exist but no valid active selection, select first
  useEffect(() => {
    if (resumes.length > 0 && onResumeSelect) {
      const isValid = activeResumeId && resumes.some((r) => r.id === activeResumeId)
      if (!isValid) {
        onResumeSelect(resumes[0].id)
      }
    }
  }, [activeResumeId, resumes, onResumeSelect])

  // Determine visibility
  const showSelector =
    state === "idle" || state === "loading" || (state === "error" && resumes.length > 0)

  return (
    <div className={cn("flex h-full flex-col gap-2", className)}>
      {showSelector && (
        <ResumeSelector
          resumes={resumes}
          activeResumeId={activeResumeId}
          maxResumes={maxResumes}
          onResumeSelect={onResumeSelect}
          onUpload={onUpload}
          onDelete={onDelete}
        />
      )}

      {(state === "empty" || state === "uploading" || state === "parsing") && (
        <ResumeUploadCard
          state={state}
          onUpload={onUpload}
          uploadProgress={uploadProgress}
          uploadFileName={uploadFileName}
          className="flex-1"
        />
      )}

      {state === "idle" && resumeData && (
        <ResumeBlocksCard
          resumeData={resumeData}
          maxHeight={maxHeight}
          entryContentMaxHeight={entryContentMaxHeight}
          className="flex-1 min-h-0"
        />
      )}

      {state === "loading" && <ResumeSkeleton className="flex-1" />}

      {state === "error" && (
        <ResumeErrorCard errorMessage={errorMessage} guidanceText={errorGuidanceText} onRetry={onRetry} className="flex-1" />
      )}
    </div>
  )
}

export { ResumeCard }
