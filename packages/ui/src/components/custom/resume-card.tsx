"use client"

import * as React from "react"
import {
  ChevronDown,
  Copy,
  Check,
  Upload,
  Trash2,
  User,
  Wrench,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  FileText,
  Layers,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useClipboard } from "@/hooks/use-clipboard"

// ─── Types ──────────────────────────────────────────────────────────

interface ResumePersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin?: string
  website?: string
}

interface ResumeExperienceEntry {
  title: string
  company: string
  startDate: string
  endDate: string
  description: string
  highlights: string[]
}

interface ResumeEducationEntry {
  degree: string
  school: string
  startDate: string
  endDate: string
  gpa?: string
  highlights?: string[]
}

interface ResumeCertificationEntry {
  name: string
  issuer: string
  date: string
}

interface ResumeProjectEntry {
  name: string
  description: string
  techStack: string[]
  url?: string
}

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
  /** List of available resumes for the dropdown */
  resumes: ResumeSummary[]
  /** Currently active resume ID */
  activeResumeId?: string
  /** Parsed data for the active resume */
  resumeData?: ResumeData | null
  /** Called when user selects a different resume */
  onResumeSelect?: (id: string) => void
  /** Called when user clicks upload */
  onUpload?: () => void
  /** Called when user confirms delete */
  onDelete?: (id: string) => void
  /** Max height for the scrollable content area */
  maxHeight?: string
  className?: string
}

// ─── CopyButton (inline icon button) ───────────────────────────────

function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            className
          )}
          onClick={(e) => {
            e.stopPropagation()
            copy(value)
          }}
        >
          {copied ? (
            <Check className="size-3 text-primary" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : label || "Copy"}</TooltipContent>
    </Tooltip>
  )
}

// ─── CopyChip (badge-style button that copies on click) ────────────

function CopyChip({
  value,
  icon,
  label,
  className,
}: {
  value: string
  icon?: React.ReactNode
  label?: string
  className?: string
}) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => copy(value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border",
            "bg-muted/50 px-2 py-1 text-xs font-medium text-foreground",
            "transition-all hover:bg-muted hover:border-primary/30",
            "active:scale-[0.97] cursor-pointer select-none",
            copied && "border-primary/50 bg-primary/10 text-primary",
            className
          )}
        >
          {copied ? (
            <Check className="size-3 shrink-0 text-primary" />
          ) : icon ? (
            <span className="shrink-0 text-muted-foreground [&>svg]:size-3">
              {icon}
            </span>
          ) : null}
          <span className="truncate max-w-[180px]">{label || value}</span>
          {!copied && !icon && (
            <Copy className="size-2.5 shrink-0 text-muted-foreground/60" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Copied!" : `Copy ${label || value}`}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── ResumeSection (expandable section wrapper) ─────────────────────

function ResumeSection({
  icon,
  title,
  count,
  copyAllValue,
  defaultOpen = false,
  children,
  className,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  copyAllValue?: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={className}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5",
            "text-sm font-medium text-foreground",
            "transition-colors hover:bg-muted/50",
            "cursor-pointer select-none"
          )}
        >
          <span className="text-muted-foreground [&>svg]:size-4 shrink-0">
            {icon}
          </span>
          <span className="flex-1 text-left">{title}</span>
          {count !== undefined && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] font-normal"
            >
              {count}
            </Badge>
          )}
          {copyAllValue && (
            <CopyButton
              value={copyAllValue}
              label={`Copy all ${title.toLowerCase()}`}
            />
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="px-2 pb-2 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Personal Info Content ──────────────────────────────────────────

function PersonalInfoContent({ data }: { data: ResumePersonalInfo }) {
  const items = [
    { icon: <User />, value: data.fullName, label: data.fullName },
    { icon: <Mail />, value: data.email, label: data.email },
    { icon: <Phone />, value: data.phone, label: data.phone },
    { icon: <MapPin />, value: data.location, label: data.location },
    ...(data.linkedin
      ? [{ icon: <Globe />, value: data.linkedin, label: data.linkedin }]
      : []),
    ...(data.website
      ? [
          {
            icon: <ExternalLink />,
            value: data.website,
            label: data.website,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <CopyChip
          key={item.label}
          value={item.value}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </div>
  )
}

// ─── Skills Content ─────────────────────────────────────────────────

function SkillsContent({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <CopyChip key={skill} value={skill} />
      ))}
    </div>
  )
}

// ─── Experience Content ─────────────────────────────────────────────

function ExperienceContent({
  entries,
}: {
  entries: ResumeExperienceEntry[]
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <ExperienceEntryCard
          key={`${entry.company}-${idx}`}
          entry={entry}
        />
      ))}
    </div>
  )
}

function ExperienceEntryCard({
  entry,
}: {
  entry: ResumeExperienceEntry
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const copyText = [
    `${entry.title} at ${entry.company}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.description,
    ...entry.highlights.map((h) => `- ${h}`),
  ].join("\n")

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card/50 p-2.5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-2 cursor-pointer select-none text-left"
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5",
                isOpen && "rotate-180"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-foreground">
                  {entry.title}
                </span>
                <span className="text-[10px] text-muted-foreground">at</span>
                <span className="text-xs font-medium text-foreground">
                  {entry.company}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {entry.startDate} — {entry.endDate}
              </div>
            </div>
            <CopyButton value={copyText} label="Copy entry" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 ml-6 space-y-1.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {entry.description}
            </p>
            {entry.highlights.length > 0 && (
              <ul className="space-y-0.5">
                {entry.highlights.map((highlight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-foreground"
                  >
                    <span className="text-primary mt-0.5 shrink-0 text-[10px]">
                      &bull;
                    </span>
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── Education Content ──────────────────────────────────────────────

function EducationContent({
  entries,
}: {
  entries: ResumeEducationEntry[]
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <EducationEntryCard
          key={`${entry.school}-${idx}`}
          entry={entry}
        />
      ))}
    </div>
  )
}

function EducationEntryCard({ entry }: { entry: ResumeEducationEntry }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const copyText = [
    `${entry.degree} — ${entry.school}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.gpa ? `GPA: ${entry.gpa}` : "",
    ...(entry.highlights ?? []).map((h) => `- ${h}`),
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card/50 p-2.5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-2 cursor-pointer select-none text-left"
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5",
                isOpen && "rotate-180"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground">
                {entry.degree}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {entry.school} &middot; {entry.startDate} — {entry.endDate}
                {entry.gpa && ` · GPA: ${entry.gpa}`}
              </div>
            </div>
            <CopyButton value={copyText} label="Copy entry" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="mt-2 ml-6 space-y-0.5">
              {entry.highlights.map((highlight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-foreground"
                >
                  <span className="text-primary mt-0.5 shrink-0 text-[10px]">
                    &bull;
                  </span>
                  <span className="leading-relaxed">{highlight}</span>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── Certifications Content ─────────────────────────────────────────

function CertificationsContent({
  entries,
}: {
  entries: ResumeCertificationEntry[]
}) {
  return (
    <div className="space-y-1.5">
      {entries.map((entry, idx) => (
        <div
          key={`${entry.name}-${idx}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-2.5"
        >
          <Award className="size-3.5 shrink-0 text-primary/70" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">
              {entry.name}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {entry.issuer} &middot; {entry.date}
            </div>
          </div>
          <CopyButton
            value={`${entry.name} — ${entry.issuer} (${entry.date})`}
            label="Copy certification"
          />
        </div>
      ))}
    </div>
  )
}

// ─── Projects Content ───────────────────────────────────────────────

function ProjectsContent({
  entries,
}: {
  entries: ResumeProjectEntry[]
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <ProjectEntryCard
          key={`${entry.name}-${idx}`}
          entry={entry}
        />
      ))}
    </div>
  )
}

function ProjectEntryCard({ entry }: { entry: ResumeProjectEntry }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const copyText = [
    entry.name,
    entry.description,
    `Tech: ${entry.techStack.join(", ")}`,
    entry.url ?? "",
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card/50 p-2.5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-2 cursor-pointer select-none text-left"
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5",
                isOpen && "rotate-180"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  {entry.name}
                </span>
                {entry.url && (
                  <ExternalLink className="size-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.techStack.slice(0, 3).map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="h-4 px-1.5 text-[10px] font-normal"
                  >
                    {tech}
                  </Badge>
                ))}
                {entry.techStack.length > 3 && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[10px] font-normal"
                  >
                    +{entry.techStack.length - 3}
                  </Badge>
                )}
              </div>
            </div>
            <CopyButton value={copyText} label="Copy project" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 ml-6 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {entry.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {entry.techStack.map((tech) => (
                <CopyChip key={tech} value={tech} />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── Empty State ────────────────────────────────────────────────────

function ResumeEmptyState({ onUpload }: { onUpload?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <FileText className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        No resume selected
      </p>
      <p className="text-xs text-muted-foreground mb-4 max-w-[240px]">
        Upload a resume to see your extracted data here
      </p>
      {onUpload && (
        <Button variant="outline" size="sm" onClick={onUpload}>
          <Upload className="size-3.5" data-icon="inline-start" />
          Upload Resume
        </Button>
      )}
    </div>
  )
}

// ─── ResumeCard (Main Component) ────────────────────────────────────

function ResumeCard({
  resumes,
  activeResumeId,
  resumeData,
  onResumeSelect,
  onUpload,
  onDelete,
  maxHeight = "600px",
  className,
}: ResumeCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

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

  // Count of populated sections for the parent "Resume Blocks" badge
  const totalSections = resumeData
    ? [
        true, // Personal Info always present
        resumeData.skills.length > 0,
        resumeData.experience.length > 0,
        resumeData.education.length > 0,
        (resumeData.certifications?.length ?? 0) > 0,
        (resumeData.projects?.length ?? 0) > 0,
      ].filter(Boolean).length
    : 0

  return (
    <Card className={cn("w-full", className)}>
      {/* Header: Resume selector + actions */}
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Select
            value={activeResumeId}
            onValueChange={(val) => onResumeSelect?.(val)}
          >
            <SelectTrigger className="flex-1 min-w-0" size="sm">
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <FileText className="size-3.5" />
                  <span className="truncate">{r.fileName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <Button
            variant="outline"
            size="xs"
            onClick={onUpload}
            className="flex-1"
          >
            <Upload className="size-3" data-icon="inline-start" />
            Upload
          </Button>
          {activeResumeId && (
            <Button
              variant="destructive"
              size="xs"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-3" data-icon="inline-start" />
              Delete
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content: Resume data sections */}
      <CardContent className="p-0">
        {!resumeData ? (
          <ResumeEmptyState onUpload={onUpload} />
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="p-3">
              {/* Resume Blocks - Parent expandable section */}
              <ResumeSection
                icon={<Layers />}
                title="Resume Blocks"
                count={totalSections}
                defaultOpen
              >
                <div className="space-y-1">
                  {/* Personal Info */}
                  <ResumeSection
                    icon={<User />}
                    title="Personal Info"
                    count={
                      Object.values(resumeData.personalInfo).filter(Boolean)
                        .length
                    }
                    copyAllValue={personalInfoCopyAll}
                    defaultOpen
                  >
                    <PersonalInfoContent data={resumeData.personalInfo} />
                  </ResumeSection>

                  <Separator className="my-1" />

                  {/* Skills */}
                  <ResumeSection
                    icon={<Wrench />}
                    title="Skills"
                    count={resumeData.skills.length}
                    copyAllValue={skillsCopyAll}
                    defaultOpen
                  >
                    <SkillsContent skills={resumeData.skills} />
                  </ResumeSection>

                  <Separator className="my-1" />

                  {/* Experience */}
                  <ResumeSection
                    icon={<Briefcase />}
                    title="Experience"
                    count={resumeData.experience.length}
                  >
                    <ExperienceContent entries={resumeData.experience} />
                  </ResumeSection>

                  <Separator className="my-1" />

                  {/* Education */}
                  <ResumeSection
                    icon={<GraduationCap />}
                    title="Education"
                    count={resumeData.education.length}
                  >
                    <EducationContent entries={resumeData.education} />
                  </ResumeSection>

                  {/* Certifications (optional) */}
                  {resumeData.certifications &&
                    resumeData.certifications.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <ResumeSection
                          icon={<Award />}
                          title="Certifications"
                          count={resumeData.certifications.length}
                        >
                          <CertificationsContent
                            entries={resumeData.certifications}
                          />
                        </ResumeSection>
                      </>
                    )}

                  {/* Projects (optional) */}
                  {resumeData.projects && resumeData.projects.length > 0 && (
                    <>
                      <Separator className="my-1" />
                      <ResumeSection
                        icon={<FolderOpen />}
                        title="Projects"
                        count={resumeData.projects.length}
                      >
                        <ProjectsContent entries={resumeData.projects} />
                      </ResumeSection>
                    </>
                  )}
                </div>
              </ResumeSection>
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;
              {resumes.find((r) => r.id === activeResumeId)?.fileName}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (activeResumeId) onDelete?.(activeResumeId)
                setDeleteDialogOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export {
  ResumeCard,
  CopyChip,
  CopyButton,
  ResumeSection,
  ResumeEmptyState,
}

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
