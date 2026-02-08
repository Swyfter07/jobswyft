"use client"

import * as React from "react"
import {
  ChevronUp,
  Upload,
  Trash2,
  FileText,
  User,
  Wrench,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  Layers,
  Loader2,
  RotateCw,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
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
import { CollapsibleSection } from "@/components/blocks/collapsible-section"

import type { ResumePersonalInfo } from "./personal-info"
import type { ResumeExperienceEntry } from "./experience-section"
import type { ResumeEducationEntry } from "./education-section"
import type { ResumeCertificationEntry } from "./certifications-section"
import type { ResumeProjectEntry } from "./projects-section"

import { PersonalInfo } from "./personal-info"
import { SkillsSection } from "./skills-section"
import { ExperienceSection } from "./experience-section"
import { EducationSection } from "./education-section"
import { CertificationsSection } from "./certifications-section"
import { ProjectsSection } from "./projects-section"
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
  onClearError?: () => void
  isCollapsible?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
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
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-10 rounded-md" />
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
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
  onRetry,
  onClearError,
  isCollapsible = false,
  isOpen: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  className,
}: ResumeCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null)

  const hasResumes = resumes.length > 0
  const isBusy = isLoading || isUploading

  // Auto-expand when loading/uploading so user sees the skeleton
  React.useEffect(() => {
    if (isBusy && isCollapsible && !controlledOpen) {
      controlledOnOpenChange?.(true)
    }
  }, [isBusy, isCollapsible, controlledOpen, controlledOnOpenChange])

  // ── Empty state: no resumes + not loading → show only the dotted card ──
  if (!hasResumes && !isBusy && !error) {
    return <ResumeEmptyState onUpload={onUpload} className={className} />
  }

  const handleAccordionChange = (sectionId: string) => (open: boolean) => {
    if (open) {
      setExpandedSection(sectionId)
    } else if (expandedSection === sectionId) {
      setExpandedSection(null)
    }
  }

  const personalInfoCopyAll = resumeData
    ? [
        resumeData.personalInfo.fullName,
        resumeData.personalInfo.email,
        resumeData.personalInfo.phone,
        resumeData.personalInfo.location,
        resumeData.personalInfo.linkedin,
        resumeData.personalInfo.website,
      ]
        .filter(Boolean)
        .join("\n")
    : ""

  const skillsCopyAll = resumeData?.skills.join(", ") ?? ""

  const totalSections = resumeData
    ? [
        true,
        resumeData.skills.length > 0,
        resumeData.experience.length > 0,
        resumeData.education.length > 0,
        (resumeData.certifications?.length ?? 0) > 0,
        (resumeData.projects?.length ?? 0) > 0,
      ].filter(Boolean).length
    : 0

  // ── Card content ──────────────────────────────────────────────────

  const cardInner = (
    <>
      {/* Header: Resume selector + actions */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Select
          value={activeResumeId ?? undefined}
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

      <Separator />

      {/* Content area */}
      <div className="p-0">
        {/* Error: show ONLY error, no resume blocks */}
        {error ? (
          <div
            role="alert"
            className="mx-2 my-2 flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-3 py-2 text-xs"
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
          <ResumeLoadingSkeleton />
        ) : resumeData ? (
          <div className="px-2 py-1.5">
            <CollapsibleSection
              icon={<Layers />}
              title="Resume Blocks"
              count={totalSections}
              defaultOpen
              isParent
            >
              <div className="space-y-1">
                {/* Personal Info */}
                <CollapsibleSection
                  icon={<User />}
                  title="Personal Info"
                  count={
                    Object.values(resumeData.personalInfo).filter(Boolean).length
                  }
                  copyAllValue={personalInfoCopyAll}
                  open={expandedSection === "personal-info"}
                  onOpenChange={handleAccordionChange("personal-info")}
                >
                  <PersonalInfo data={resumeData.personalInfo} />
                </CollapsibleSection>

                <Separator className="my-0.5" />

                {/* Skills */}
                <CollapsibleSection
                  icon={<Wrench />}
                  title="Skills"
                  count={resumeData.skills.length}
                  copyAllValue={skillsCopyAll}
                  open={expandedSection === "skills"}
                  onOpenChange={handleAccordionChange("skills")}
                >
                  <SkillsSection skills={resumeData.skills} />
                </CollapsibleSection>

                {resumeData.experience.length > 0 && (
                  <>
                    <Separator className="my-0.5" />
                    <CollapsibleSection
                      icon={<Briefcase />}
                      title="Experience"
                      count={resumeData.experience.length}
                      open={expandedSection === "experience"}
                      onOpenChange={handleAccordionChange("experience")}
                    >
                      <ExperienceSection entries={resumeData.experience} />
                    </CollapsibleSection>
                  </>
                )}

                {resumeData.education.length > 0 && (
                  <>
                    <Separator className="my-0.5" />
                    <CollapsibleSection
                      icon={<GraduationCap />}
                      title="Education"
                      count={resumeData.education.length}
                      open={expandedSection === "education"}
                      onOpenChange={handleAccordionChange("education")}
                    >
                      <EducationSection entries={resumeData.education} />
                    </CollapsibleSection>
                  </>
                )}

                {resumeData.certifications &&
                  resumeData.certifications.length > 0 && (
                    <>
                      <Separator className="my-0.5" />
                      <CollapsibleSection
                        icon={<Award />}
                        title="Certifications"
                        count={resumeData.certifications.length}
                        open={expandedSection === "certifications"}
                        onOpenChange={handleAccordionChange("certifications")}
                      >
                        <CertificationsSection
                          entries={resumeData.certifications}
                        />
                      </CollapsibleSection>
                    </>
                  )}

                {resumeData.projects && resumeData.projects.length > 0 && (
                  <>
                    <Separator className="my-0.5" />
                    <CollapsibleSection
                      icon={<FolderOpen />}
                      title="Projects"
                      count={resumeData.projects.length}
                      open={expandedSection === "projects"}
                      onOpenChange={handleAccordionChange("projects")}
                    >
                      <ProjectsSection entries={resumeData.projects} />
                    </CollapsibleSection>
                  </>
                )}
              </div>
            </CollapsibleSection>
          </div>
        ) : null}
      </div>

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
    </>
  )

  // ── Collapsible wrapper ───────────────────────────────────────────

  if (isCollapsible) {
    return (
      <Collapsible
        open={controlledOpen}
        onOpenChange={controlledOnOpenChange}
      >
        <Card
          className={cn(
            "w-full shadow-sm bg-card py-0 gap-0 overflow-hidden border-2 border-card-accent-border",
            className
          )}
        >
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">{cardInner}</CollapsibleContent>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer select-none",
                controlledOpen
                  ? "bg-muted/30 text-muted-foreground hover:bg-muted/50 border-t border-border"
                  : "bg-secondary/40 text-foreground hover:bg-secondary/60"
              )}
            >
              {!controlledOpen && (
                <span className="text-xs">Resume Context</span>
              )}
              <ChevronUp
                className={cn(
                  "size-4 transition-transform duration-200",
                  !controlledOpen && "rotate-180"
                )}
              />
              <span className="sr-only">Toggle Resume</span>
            </button>
          </CollapsibleTrigger>
        </Card>
      </Collapsible>
    )
  }

  // ── Non-collapsible wrapper ───────────────────────────────────────

  return (
    <Card
      className={cn(
        "w-full shadow-sm bg-card py-0 gap-0 border-2 border-card-accent-border",
        className
      )}
    >
      {cardInner}
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
