"use client"

import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ResumeEmptyStateProps {
  onUpload?: () => void
  className?: string
}

function ResumeEmptyState({ onUpload, className }: ResumeEmptyStateProps) {
  return (
    <div
      role="status"
      aria-label="No resumes uploaded"
      className={cn(
        "flex flex-col items-center justify-center py-6 border-2 border-dashed border-card-accent-border rounded-xl",
        className
      )}
    >
      <div className="mb-3">
        <FileText className="size-8 text-muted-foreground/40 animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Upload your first resume
      </p>
      {onUpload && (
        <Button variant="default" size="sm" onClick={onUpload}>
          Upload Resume
        </Button>
      )}
    </div>
  )
}

export { ResumeEmptyState }
