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

// ─── Context & Types for Variants ──────────────────────────────────

export type ResumeCardVariant = "default" | "subtle" | "bold"

interface ResumeCardContextValue {
  variant: ResumeCardVariant
}

const ResumeCardContext = React.createContext<ResumeCardContextValue>({
  variant: "default",
})

function useResumeCardContext() {
  return React.useContext(ResumeCardContext)
}

function getVariantStyles(variant: ResumeCardVariant) {
  switch (variant) {
    case "subtle":
      return {
        headerHover: "hover:bg-muted/50 dark:hover:bg-muted/30",
        headerBg: "bg-muted/30 dark:bg-muted/20",
        icon: "text-primary/70",
        border: "border-border",
        badge: "secondary" as const,
        badgeClass: "",
      }
    case "bold":
      return {
        headerHover: "text-primary hover:bg-primary/10 dark:hover:bg-primary/20",
        headerBg: "bg-primary/5 dark:bg-primary/10",
        icon: "text-primary",
        border: "border-primary/20 dark:border-primary/40",
        badge: "outline" as const,
        badgeClass: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30",
      }
    default:
      return {
        headerHover: "hover:bg-muted/50 active:bg-muted/70 transition-colors",
        headerBg: "bg-gradient-to-r from-muted/30 to-transparent",
        icon: "text-primary",
        border: "border-2 border-card-accent-border shadow-sm transition-all",
        badge: "secondary" as const,
        badgeClass: "bg-muted text-muted-foreground hover:bg-muted/80",
        containerBg: "bg-gradient-to-br from-card-accent-bg to-muted/30",
        cardShadow: "shadow-lg",
      }
  }
}

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
  /** Visual style variant */
  variant?: ResumeCardVariant
  /** Called when user selects a different resume */
  onResumeSelect?: (id: string) => void
  /** Called when user clicks upload */
  onUpload?: () => void
  /** Called when user confirms delete */
  onDelete?: (id: string) => void
  /** Max height for the scrollable content area */
  maxHeight?: string
  /** Compact mode - collapses sections when job is detected */
  isCompact?: boolean
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
            "inline-flex items-center gap-1.5 rounded-md border border-input", // Outline style (border-input)
            "bg-transparent px-2 py-0.5 text-xs font-medium text-foreground", // Transparent bg, tighter padding
            "transition-all hover:bg-accent hover:text-accent-foreground", // Standard shadcn hover with all transitions
            "active:scale-[0.97] cursor-pointer select-none",
            copied && "border-primary/50 bg-primary/10 text-primary scale-105 animate-pulse", // Enhanced feedback
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
  open,
  onOpenChange,
  isParent = false,
  children,
  className,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  copyAllValue?: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isParent?: boolean
  children: React.ReactNode
  className?: string
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const { variant } = useResumeCardContext()
  const styles = getVariantStyles(variant)

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
            "flex w-full items-center gap-2 rounded-md px-2 py-1",
            "text-sm font-medium text-foreground",
            "transition-colors cursor-pointer select-none",
            isParent
              ? "bg-transparent hover:bg-muted/50"
              : (isOpen && styles.headerBg ? styles.headerBg : styles.headerHover),
          )}
        >
          <span className={cn("[&>svg]:size-4 shrink-0 transition-colors", styles.icon)}>
            {icon}
          </span>
          <span className="flex-1 text-left font-semibold">{title}</span>
          {count !== undefined && (
            isParent ? (
              <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-primary/20">
                {count}
              </Badge>
            ) : (
              <Badge
                variant={styles.badge}
                className={cn("h-4 px-1.5 text-micro font-normal", styles.badgeClass)}
              >
                {count}
              </Badge>
            )
          )}
          {copyAllValue && (
            <CopyButton
              value={copyAllValue}
              label={`Copy all ${title.toLowerCase()}`}
            />
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              styles.icon,
              isOpen && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        {/* Expanded content wrapper animation */}
        <div className="px-2 py-0.5 animate-in fade-in-0 slide-in-from-top-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Personal Info Content ──────────────────────────────────────────

function PersonalInfoContent({ data }: { data: ResumePersonalInfo }) {
  const { variant } = useResumeCardContext()
  const styles = getVariantStyles(variant)

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
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <CopyChip
          key={item.label}
          value={item.value}
          // Pass formatted icon with variant color
          icon={React.cloneElement(
            item.icon as React.ReactElement<{ className?: string }>,
            {
              className: styles.icon,
            }
          )}
          label={item.label}
        />
      ))}
    </div>
  )
}

// ─── Skills Content ─────────────────────────────────────────────────

function SkillsContent({ skills }: { skills: string[] }) {
  const [showAll, setShowAll] = React.useState(false)
  const VISIBLE_LIMIT = 6
  const hasMore = skills.length > VISIBLE_LIMIT
  const visibleSkills = showAll ? skills : skills.slice(0, VISIBLE_LIMIT)
  const hiddenCount = skills.length - VISIBLE_LIMIT

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {visibleSkills.map((skill) => (
          <CopyChip key={skill} value={skill} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          {showAll ? (
            <>Show less</>
          ) : (
            <>
              <span className="text-primary">+{hiddenCount}</span> more skills
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Experience Content ─────────────────────────────────────────────

function ExperienceContent({
  entries,
}: {
  entries: ResumeExperienceEntry[]
}) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)
  const [showAll, setShowAll] = React.useState(false)
  const VISIBLE_LIMIT = 2
  const hasMore = entries.length > VISIBLE_LIMIT
  const visibleEntries = showAll ? entries : entries.slice(0, VISIBLE_LIMIT)
  const hiddenCount = entries.length - VISIBLE_LIMIT

  return (
    <div className="space-y-2">
      {visibleEntries.map((entry, idx) => (
        <ExperienceEntryCard
          key={`${entry.company}-${idx}`}
          entry={entry}
          isOpen={expandedIndex === idx}
          onOpenChange={(isOpen) => setExpandedIndex(isOpen ? idx : null)}
        />
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-2 border border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50"
        >
          {showAll ? (
            <>Show less</>
          ) : (
            <>
              View all <span className="text-primary font-medium">{entries.length}</span> positions
            </>
          )}
        </button>
      )}
    </div>
  )
}

function ExperienceEntryCard({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: ResumeExperienceEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copyText = [
    `${entry.title} at ${entry.company}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.description,
    ...entry.highlights.map((h) => `- ${h}`),
  ].join("\n")

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="relative rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5">
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
                <span className="text-micro text-muted-foreground">at</span>
                <span className="text-xs font-medium text-foreground">
                  {entry.company}
                </span>
              </div>
              <div className="text-micro text-muted-foreground mt-0.5">
                {entry.startDate} — {entry.endDate}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <div className="absolute top-2.5 right-2.5 z-10">
          <CopyButton value={copyText} label="Copy entry" />
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
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
                    <span className="text-primary mt-0.5 shrink-0 text-micro">
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
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <EducationEntryCard
          key={`${entry.school}-${idx}`}
          entry={entry}
          isOpen={expandedIndex === idx}
          onOpenChange={(isOpen) => setExpandedIndex(isOpen ? idx : null)}
        />
      ))}
    </div>
  )
}

function EducationEntryCard({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: ResumeEducationEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copyText = [
    `${entry.degree} — ${entry.school}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.gpa ? `GPA: ${entry.gpa}` : "",
    ...(entry.highlights ?? []).map((h) => `- ${h}`),
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="relative rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5">
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
              <div className="text-micro text-muted-foreground mt-0.5">
                {entry.school} &middot; {entry.startDate} — {entry.endDate}
                {entry.gpa && ` · GPA: ${entry.gpa}`}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <div className="absolute top-2.5 right-2.5 z-10">
          <CopyButton value={copyText} label="Copy entry" />
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="mt-2 ml-6 space-y-0.5">
              {entry.highlights.map((highlight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-foreground"
                >
                  <span className="text-primary mt-0.5 shrink-0 text-micro">
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
          className="flex items-center gap-2 rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5"
        >
          <Award className="size-3.5 shrink-0 text-primary/70" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">
              {entry.name}
            </div>
            <div className="text-micro text-muted-foreground">
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
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <ProjectEntryCard
          key={`${entry.name}-${idx}`}
          entry={entry}
          isOpen={expandedIndex === idx}
          onOpenChange={(isOpen) => setExpandedIndex(isOpen ? idx : null)}
        />
      ))}
    </div>
  )
}

function ProjectEntryCard({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: ResumeProjectEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copyText = [
    entry.name,
    entry.description,
    `Tech: ${entry.techStack.join(", ")}`,
    entry.url ?? "",
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="relative rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5">
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
                    className="h-4 px-1.5 text-micro font-normal"
                  >
                    {tech}
                  </Badge>
                ))}
                {entry.techStack.length > 3 && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-micro font-normal"
                  >
                    +{entry.techStack.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <div className="absolute top-2.5 right-2.5 z-10">
          <CopyButton value={copyText} label="Copy project" />
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
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
  variant = "subtle",
  onResumeSelect,
  onUpload,
  onDelete,
  maxHeight = "600px",
  isCompact = false,
  className,
}: ResumeCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  // In compact mode, collapse all sections by default; otherwise expand personal-info
  const [expandedSection, setExpandedSection] = React.useState<string | null>(isCompact ? null : "personal-info")
  const styles = getVariantStyles(variant)

  const handleAccordionChange = (sectionId: string) => (isOpen: boolean) => {
    if (isOpen) {
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
    <ResumeCardContext.Provider value={{ variant }}>
      <Card className={cn(
        "w-full transition-all duration-300 border-2 border-card-accent-border py-0",
        styles.cardShadow || "shadow-sm",
        styles.containerBg || "bg-card", // Apply gradient here
        className
      )}>
        {/* Header: Resume selector + actions */}
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-2 py-1">
          <Select
            value={activeResumeId}
            onValueChange={(val) => onResumeSelect?.(val)}
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
            <span className="text-xs text-muted-foreground tabular-nums px-1.5 min-w-[32px] text-center">
              {activeResumeId
                ? `${resumes.findIndex((r) => r.id === activeResumeId) + 1}/${resumes.length}`
                : `${resumes.length} ${resumes.length === 1 ? "resume" : "resumes"}`}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={onUpload}
                >
                  <Upload className="size-4" />
                  <span className="sr-only">Upload</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload Resume</TooltipContent>
            </Tooltip>

            {activeResumeId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Resume</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        {/* Content: Resume data sections */}
        <CardContent className="p-0">
          {!resumeData ? (
            <ResumeEmptyState onUpload={onUpload} />
          ) : (
            <ScrollArea style={{ maxHeight }}>
              <div className="px-2 pb-2">
                <ResumeSection
                  icon={<Layers />}
                  title="Resume Blocks"
                  count={totalSections}
                  defaultOpen={!isCompact}
                  isParent
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
                      open={expandedSection === "personal-info"}
                      onOpenChange={handleAccordionChange("personal-info")}
                    >
                      <PersonalInfoContent data={resumeData.personalInfo} />
                    </ResumeSection>

                    <Separator className="my-0.5" />

                    {/* Skills */}
                    <ResumeSection
                      icon={<Wrench />}
                      title="Skills"
                      count={resumeData.skills.length}
                      copyAllValue={skillsCopyAll}
                      open={expandedSection === "skills"}
                      onOpenChange={handleAccordionChange("skills")}
                    >
                      <SkillsContent skills={resumeData.skills} />
                    </ResumeSection>

                    {resumeData.experience.length > 0 && (
                      <>
                        <Separator className="my-0.5" />
                        <ResumeSection
                          icon={<Briefcase />}
                          title="Experience"
                          count={resumeData.experience.length}
                          open={expandedSection === "experience"}
                          onOpenChange={handleAccordionChange("experience")}
                        >
                          <ExperienceContent entries={resumeData.experience} />
                        </ResumeSection>
                      </>
                    )}

                    {resumeData.education.length > 0 && (
                      <>
                        <Separator className="my-0.5" />
                        <ResumeSection
                          icon={<GraduationCap />}
                          title="Education"
                          count={resumeData.education.length}
                          open={expandedSection === "education"}
                          onOpenChange={handleAccordionChange("education")}
                        >
                          <EducationContent entries={resumeData.education} />
                        </ResumeSection>
                      </>
                    )}

                    {resumeData.certifications &&
                      resumeData.certifications.length > 0 && (
                        <>
                          <Separator className="my-0.5" />
                          <ResumeSection
                            icon={<Award />}
                            title="Certifications"
                            count={resumeData.certifications.length}
                            open={expandedSection === "certifications"}
                            onOpenChange={handleAccordionChange("certifications")}
                          >
                            <CertificationsContent
                              entries={resumeData.certifications}
                            />
                          </ResumeSection>
                        </>
                      )}

                    {resumeData.projects && resumeData.projects.length > 0 && (
                      <>
                        <Separator className="my-0.5" />
                        <ResumeSection
                          icon={<FolderOpen />}
                          title="Projects"
                          count={resumeData.projects.length}
                          open={expandedSection === "projects"}
                          onOpenChange={handleAccordionChange("projects")}
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
    </ResumeCardContext.Provider>
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
