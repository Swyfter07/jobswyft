import { FileText, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ResumeEmptyStateProps {
  onUpload?: () => void
}

function ResumeEmptyState({ onUpload }: ResumeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <FileText className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">No resume uploaded</p>
        <p className="text-xs text-muted-foreground">
          Upload a resume to see your extracted data here
        </p>
      </div>
      <Button variant="accent" onClick={onUpload}>
        <Upload data-icon="inline-start" />
        Upload Resume
      </Button>
    </div>
  )
}

interface ResumeUploadingProps {
  uploadProgress?: number
  uploadFileName?: string
}

function ResumeUploading({ uploadProgress = 0, uploadFileName }: ResumeUploadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <Upload className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Uploading resume...</p>
        {uploadFileName && (
          <p className="text-xs text-muted-foreground">{uploadFileName}</p>
        )}
      </div>
      <div className="flex w-full max-w-xs items-center gap-3">
        <Progress value={uploadProgress} className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(uploadProgress)}%
        </span>
      </div>
    </div>
  )
}

function ResumeParsing() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <FileText className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Parsing resume...</p>
        <p className="text-xs text-muted-foreground">
          Extracting skills, experience, and education data
        </p>
      </div>
      <Progress
        className="w-full max-w-xs [&>[data-slot=progress-indicator]]:animate-pulse"
      />
    </div>
  )
}

type ResumeUploadCardState = "empty" | "uploading" | "parsing"

interface ResumeUploadCardProps {
  state: ResumeUploadCardState
  onUpload?: () => void
  uploadProgress?: number
  uploadFileName?: string
  className?: string
}

function ResumeUploadCard({
  state,
  onUpload,
  uploadProgress,
  uploadFileName,
  className,
}: ResumeUploadCardProps) {
  return (
    <Card className={cn("flex flex-col ring-accent", className)}>
      <CardContent className="flex flex-1 items-center justify-center p-4">
        {state === "empty" && <ResumeEmptyState onUpload={onUpload} />}
        {state === "uploading" && (
          <ResumeUploading
            uploadProgress={uploadProgress}
            uploadFileName={uploadFileName}
          />
        )}
        {state === "parsing" && <ResumeParsing />}
      </CardContent>
    </Card>
  )
}

export { ResumeUploadCard, ResumeEmptyState, ResumeUploading, ResumeParsing }
export type { ResumeUploadCardProps }
