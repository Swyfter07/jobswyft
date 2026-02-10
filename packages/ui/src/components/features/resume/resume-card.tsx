"use client"

import * as React from "react"
import {
  Upload,
  Trash2,
  FileText,
  Loader2,
  RotateCw,
  Maximize2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { ResumePersonalInfo } from "./personal-info"
import type { ResumeExperienceEntry } from "./experience-section"
import type { ResumeEducationEntry } from "./education-section"
import type { ResumeCertificationEntry } from "./certifications-section"
import type { ResumeProjectEntry } from "./projects-section"

import { ResumeEmptyState } from "./resume-empty-state"

// ─── Types ──────────────────────────────────────────────────────────

interface ResumeData {
  id: string
  fileName: string
  personalInfo: ResumePersonalInfo
  skills: string[]
  experience: ResumeExperienceEntry[]
  education: ResumeEducationEntry[]
  certifications?: ResumeCertificationEntry[]
  projects?: ResumeProjectEntry[]
}

interface ResumeSummary {
  id: string
  fileName: string
}

interface ResumeCardProps {
  resumes: ResumeSummary[]
  activeResumeId: string | null
  resumeData: ResumeData | null
  isLoading?: boolean
  isUploading?: boolean
  error?: string | null
  onResumeSelect?: (id: string) => void
  onUpload?: () => void
  onDelete?: (id: string) => void
  onRetry?: () => void
  onDrillDown?: () => void
  onClearError?: () => void
  className?: string
}

// ─── Loading Skeleton ───────────────────────────────────────────────

function ResumeLoadingSkeleton() {
  return (
    <div className="px-3 py-3 space-y-3" aria-busy="true">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  )
}

// ─── ResumeCard ─────────────────────────────────────────────────────

function ResumeCard({
  resumes,
  activeResumeId,
  resumeData,
  isLoading = false,
  isUploading = false,
  error,
  onResumeSelect,
  onUpload,
  onDelete,
  onDrillDown,
  onRetry,
  onClearError,
  className,
}: ResumeCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const hasResumes = resumes.length > 0
  const isBusy = isLoading || isUploading

  // ── Empty state: no resumes + not loading → show only the dotted card ──
  if (!hasResumes && !isBusy && !error) {
    return <ResumeEmptyState onUpload={onUpload} className={className} />
  }

  return (
    <Card
      className={cn(
        "w-full shadow-sm bg-card py-0 gap-0 border-2 border-card-accent-border",
        className
      )}
    >
      {/* Header: Resume selector + actions */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Select
          value={activeResumeId ?? ""}
          onValueChange={(val) => onResumeSelect?.(val)}
          disabled={!hasResumes}
        >
          <SelectTrigger className="flex-1 min-w-0 h-8" size="sm">
            <SelectValue placeholder="Select a resume" />
          </SelectTrigger>
          <SelectContent>
            {resumes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5" />
                  <span className="truncate">{r.fileName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 shrink-0">
          {hasResumes && (
            <span className="text-xs text-muted-foreground tabular-nums px-1.5 min-w-[32px] text-center">
              {activeResumeId
                ? `${resumes.findIndex((r) => r.id === activeResumeId) + 1}/${resumes.length}`
                : `${resumes.length}`}
            </span>
          )}

          {onDrillDown && resumeData && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={onDrillDown}
                  aria-label="Open resume detail"
                >
                  <Maximize2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open Resume</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={onUpload}
                disabled={isBusy}
                aria-label="Upload resume"
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span className="sr-only">Upload resume</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isUploading ? "Uploading..." : "Upload Resume"}
            </TooltipContent>
          </Tooltip>

          {activeResumeId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  aria-label="Delete resume"
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete resume</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Resume</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Error / Loading states (inline below header) */}
      {error ? (
        <div
          role="alert"
          className="mx-2 mb-2 flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-3 py-2 text-xs"
        >
          <span className="flex-1">{error}</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRetry}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <RotateCw className="size-3" />
            </Button>
          )}
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-destructive/60 hover:text-destructive text-xs font-medium"
            >
              ×
            </button>
          )}
        </div>
      ) : isBusy ? (
        <>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-primary rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
          </div>
          <ResumeLoadingSkeleton />
        </>
      ) : null}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;
              {resumes.find((r) => r.id === activeResumeId)?.fileName}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (activeResumeId) onDelete?.(activeResumeId)
                setDeleteDialogOpen(false)
              }}
            >
              Delete Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export { ResumeCard }

export type {
  ResumePersonalInfo,
  ResumeExperienceEntry,
  ResumeEducationEntry,
  ResumeCertificationEntry,
  ResumeProjectEntry,
  ResumeData,
  ResumeSummary,
  ResumeCardProps,
}
