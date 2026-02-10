import { useRef } from "react";
import { ResumeCard, ResumeEmptyState } from "@jobswyft/ui";
import type { UseResumesReturn } from "@/hooks/use-resumes";

export function ResumeContext({
  resumes,
  activeResumeId,
  activeResumeData,
  isLoading,
  isParsing,
  selectResume,
  uploadResume,
  deleteResume,
  reparseResume,
}: UseResumesReturn) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => uploadResume(file));
    e.target.value = ""; // Reset to allow re-upload of same file
  };

  console.log("[JobSwyft] ResumeContext Render:", {
    hasActiveId: !!activeResumeId,
    activeId: activeResumeId,
    hasReparse: !!reparseResume,
    resumesCount: resumes.length
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
        Loading resumes...
      </div>
    );
  }

  return (
    <>
      <ResumeCard
        resumes={resumes}
        activeResumeId={activeResumeId}
        resumeData={activeResumeData ?? undefined}
        variant="subtle"
        onResumeSelect={selectResume}
        onUpload={() => fileInputRef.current?.click()}
        onDelete={deleteResume}
        onReparse={reparseResume}
        isParsing={isParsing}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        hidden
        onChange={handleFiles}
      />
    </>
  );
}
