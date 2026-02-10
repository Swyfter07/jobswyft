"use client"

import * as React from "react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Code2,
  AlertCircle,
  Check,
  Ban,
  UploadCloud,
  Loader2,
  FileIcon,
  XIcon,
  Copy,
  Trash2,
  Wrench,
  FolderOpen,
  Layers,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
// UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Separator } from "@/components/ui/separator"
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
        headerHover: "text-primary hover:bg-muted/50 dark:hover:bg-muted/30",
        headerBg: "bg-muted/40 dark:bg-muted/30",
        icon: "text-primary",
        border: "border-border shadow-md",
        badge: "outline" as const,
        badgeClass: "bg-muted text-foreground border-border hover:bg-muted/80",
      }
    default:
      return {
        headerHover: "hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors",
        headerBg: "bg-muted/30 dark:bg-muted/20",
        icon: "text-primary",
        border: "border-border shadow-sm transition-all",
        badge: "secondary" as const,
        badgeClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        containerBg: "bg-card",
        cardShadow: "shadow",
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
  description?: string
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
  /** Called when user clicks reparse */
  onReparse?: (id: string) => void
  /** Whether parsing is in progress */
  isParsing?: boolean
  /** Parsing progress 0-100, shows indeterminate if undefined */
  parseProgress?: number
  /** Error message from parsing failure */
  parseError?: string
  /** Max height for the scrollable content area */
  maxHeight?: string
  /** Compact mode - collapses sections when job is detected */
  isCompact?: boolean
  /** Whether the entire card can be collapsed */
  isCollapsible?: boolean
  /** Controlled open state (requires onOpenChange) */
  isOpen?: boolean
  /** Callback for when open state changes (manual or controlled) */
  onOpenChange?: (open: boolean) => void
  /** If true, hides the default "Resume Blocks" accordion section */
  hideBlocks?: boolean
  /** Custom content to render (e.g., buttons) below the header or instead of blocks */
  customContent?: React.ReactNode
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
            <Check className="size-3 text-green-600 dark:text-green-500" />
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
            copied && "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 scale-105 shadow-sm ring-1 ring-green-500/20", // Enhanced high-contrast feedback
            className
          )}
        >
          {copied ? (
            <Check className="size-3 shrink-0 text-green-600 dark:text-green-500" />
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
            "flex w-full items-center gap-2 rounded-md px-2 py-0.5",
            "text-sm font-medium text-foreground",
            "transition-colors cursor-pointer select-none",
            title === "Resume Blocks"
              ? "bg-transparent hover:bg-muted/50" // No gradient, standard hover
              : (isOpen && styles.headerBg ? styles.headerBg : styles.headerHover),
          )}
        >
          <span className={cn("[&>svg]:size-4 shrink-0 transition-colors", styles.icon)}>
            {icon}
          </span>
          <span className="flex-1 text-left font-semibold">{title}</span> {/* font-medium -> font-semibold */}
          {count !== undefined && (
            title === "Resume Blocks" ? (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {count}
              </Badge>
            ) : (
              <Badge
                variant={styles.badge}
                className={cn("h-4 px-1.5 text-[10px] font-normal", styles.badgeClass)}
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
            )}
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} // Inline style as requested
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        {/* Expanded content wrapper animation */}
        <div className="px-2 py-0.5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Personal Info Content ──────────────────────────────────────────

export function PersonalInfoContent({ data, isEditing, onChange }: {
  data: ResumePersonalInfo
  isEditing?: boolean
  onChange?: (data: ResumePersonalInfo) => void
}) {
  const { variant } = useResumeCardContext()
  const styles = getVariantStyles(variant)

  const handleChange = (field: keyof ResumePersonalInfo, value: string) => {
    onChange?.({ ...data, [field]: value })
  }

  if (isEditing) {
    return (
      <div className="grid grid-cols-1 gap-2 p-1">
        <Input
          value={data.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Full Name"
          className="h-8 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Email"
            className="h-8 text-xs"
          />
          <Input
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Phone"
            className="h-8 text-xs"
          />
        </div>
        <Input
          value={data.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Location"
          className="h-8 text-xs"
        />
        <Input
          value={data.linkedin}
          onChange={(e) => handleChange('linkedin', e.target.value)}
          placeholder="LinkedIn URL"
          className="h-8 text-xs"
        />
        <Input
          value={data.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="Website URL"
          className="h-8 text-xs"
        />
      </div>
    )
  }

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

export function SkillsContent({ skills, isEditing, onChange }: {
  skills: string[]
  isEditing?: boolean
  onChange?: (skills: string[]) => void
}) {
  if (isEditing) {
    return (
      <Textarea
        value={skills.join(", ")}
        onChange={(e) => onChange?.(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        placeholder="Enter skills separated by commas..."
        className="min-h-[100px] text-xs"
      />
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <CopyChip key={skill} value={skill} />
      ))}
    </div>
  )
}

// ─── Experience Content ─────────────────────────────────────────────

export function ExperienceContent({
  entries,
  isEditing,
  onChange
}: {
  entries: ResumeExperienceEntry[]
  isEditing?: boolean
  onChange?: (entries: ResumeExperienceEntry[]) => void
}) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)

  const handleEntryChange = (index: number, newEntry: ResumeExperienceEntry) => {
    const newEntries = [...entries]
    newEntries[index] = newEntry
    onChange?.(newEntries)
  }

  const handleAddObject = () => {
    onChange?.([
      ...entries,
      {
        company: "New Company",
        title: "Position",
        startDate: "",
        endDate: "",
        description: "",
        highlights: []
      }
    ])
  }

  const handleDelete = (index: number) => {
    const newEntries = [...entries]
    newEntries.splice(index, 1)
    onChange?.(newEntries)
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div key={`${entry.company}-${idx}`} className="relative group">
          <ExperienceEntryCard
            entry={entry}
            isOpen={isEditing ? true : expandedIndex === idx}
            onOpenChange={(isOpen) => setExpandedIndex(isOpen ? idx : null)}
            isEditing={isEditing}
            onChange={(updated) => handleEntryChange(idx, updated)}
          />
          {isEditing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={() => handleDelete(idx)}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      ))}
      {isEditing && (
        <Button onClick={handleAddObject} variant="outline" size="sm" className="w-full border-dashed text-xs h-8">
          + Add Position
        </Button>
      )}
    </div>
  )
}

function ExperienceEntryCard({
  entry,
  isOpen,
  onOpenChange,
  isEditing,
  onChange
}: {
  entry: ResumeExperienceEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing?: boolean
  onChange?: (entry: ResumeExperienceEntry) => void
}) {
  const copyText = [
    `${entry.title} at ${entry.company}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.description,
    ...entry.highlights.map((h) => `- ${h}`),
  ].join("\n")

  const handleChange = (field: keyof ResumeExperienceEntry, value: any) => {
    onChange?.({ ...entry, [field]: value })
  }

  const handleHighlightChange = (idx: number, val: string) => {
    const newHighlights = [...entry.highlights]
    newHighlights[idx] = val
    handleChange('highlights', newHighlights)
  }

  if (isEditing) {
    return (
      <div className="p-3 border rounded-lg bg-card space-y-3 relative">
        <Input
          value={entry.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="font-bold h-8 text-xs pr-8"
          placeholder="Job Title"
        />
        <Input
          value={entry.company}
          onChange={(e) => handleChange('company', e.target.value)}
          placeholder="Company"
          className="h-8 text-xs"
        />
        <div className="flex gap-2">
          <Input
            value={entry.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            placeholder="Start"
            className="h-8 text-xs"
          />
          <Input
            value={entry.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            placeholder="End"
            className="h-8 text-xs"
          />
        </div>
        <Textarea
          value={entry.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description"
          className="min-h-[60px] text-xs"
        />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Highlights</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-2"
              onClick={() => handleChange('highlights', [...entry.highlights, ""])}
            >
              Add Bullet
            </Button>
          </div>
          {entry.highlights.map((h, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
              <Textarea
                value={h}
                onChange={(e) => handleHighlightChange(i, e.target.value)}
                className="min-h-[40px] text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  const newH = [...entry.highlights];
                  newH.splice(i, 1);
                  handleChange('highlights', newH);
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="relative rounded-lg border border-border bg-gradient-to-r from-gray-50/60 to-transparent dark:from-muted/30 dark:to-transparent p-2.5">
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

export function EducationContent({
  entries,
  isEditing,
  onChange
}: {
  entries: ResumeEducationEntry[]
  isEditing?: boolean
  onChange?: (entries: ResumeEducationEntry[]) => void
}) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)

  const handleEntryChange = (index: number, newEntry: ResumeEducationEntry) => {
    const newEntries = [...entries]
    newEntries[index] = newEntry
    onChange?.(newEntries)
  }

  const handleAddObject = () => {
    onChange?.([
      ...entries,
      {
        school: "University",
        degree: "Degree",
        startDate: "",
        endDate: "",
        gpa: "",
        description: "",
        highlights: []
      }
    ])
  }


  const handleDelete = (index: number) => {
    const newEntries = [...entries]
    newEntries.splice(index, 1)
    onChange?.(newEntries)
  }


  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div key={`${entry.school}-${idx}`} className="relative group">
          <EducationEntryCard
            entry={entry}
            isOpen={expandedIndex === idx}
            onOpenChange={(isOpen) => setExpandedIndex(isOpen ? idx : null)}
            isEditing={isEditing}
            onChange={(updated) => handleEntryChange(idx, updated)}
          />
          {isEditing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={() => handleDelete(idx)}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      ))}
      {isEditing && (
        <Button onClick={handleAddObject} variant="outline" size="sm" className="w-full border-dashed text-xs h-8">
          + Add Education
        </Button>
      )}
    </div>
  )
}

export function EducationEntryCard({
  entry,
  isOpen,
  onOpenChange,
  isEditing,
  onChange
}: {
  entry: ResumeEducationEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing?: boolean
  onChange?: (entry: ResumeEducationEntry) => void
}) {
  const copyText = [
    `${entry.degree} — ${entry.school}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.gpa ? `GPA: ${entry.gpa}` : "",
    ...(entry.highlights ?? []).map((h) => `- ${h}`),
  ]
    .filter(Boolean)
    .join("\n")

  const handleChange = (field: keyof ResumeEducationEntry, value: any) => {
    onChange?.({ ...entry, [field]: value })
  }

  if (isEditing) {
    return (
      <Card className="p-3 bg-muted/30 relative">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">School</label>
              <Input
                value={entry.school}
                onChange={(e) => handleChange('school', e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Degree</label>
              <Input
                value={entry.degree}
                onChange={(e) => handleChange('degree', e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Start Date</label>
              <Input
                value={entry.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">End Date</label>
              <Input
                value={entry.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">GPA</label>
            <Input
              value={entry.gpa}
              onChange={(e) => handleChange('gpa', e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Description</label>
            <Textarea
              value={entry.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[60px] text-xs bg-background"
            />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="relative rounded-lg border border-border bg-gradient-to-r from-gray-50/60 to-transparent dark:from-muted/30 dark:to-transparent p-2.5">
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
          className="flex items-center gap-2 rounded-lg border border-border bg-gradient-to-r from-gray-50/60 to-transparent dark:from-muted/30 dark:to-transparent p-2.5"
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
      <div className="relative rounded-lg border border-border bg-gradient-to-r from-gray-50/60 to-transparent dark:from-muted/30 dark:to-transparent p-2.5">
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
                {entry.techStack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="h-4 px-1.5 text-[10px] font-normal"
                  >
                    {tech}
                  </Badge>
                ))}
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
  variant = "subtle", // Updated default to user preference
  onResumeSelect,
  onUpload,
  onDelete,
  onReparse,
  isParsing = false,
  parseProgress,
  parseError,
  maxHeight = "600px",
  isCompact = false,
  isCollapsible = false,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideBlocks = false,
  customContent,
  className,
}: ResumeCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [internalIsOpen, setInternalIsOpen] = React.useState(true)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open)
    }
    onOpenChange?.(open)
  }
  // In compact mode, collapse all sections by default; otherwise expand personal-info
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null)
  const [isBlocksOpen, setIsBlocksOpen] = React.useState(false)  // Resume Blocks controlled state
  const styles = getVariantStyles(variant)

  // Reset blocks state when the outer card collapses
  React.useEffect(() => {
    if (!isOpen) {
      setIsBlocksOpen(false)
      setExpandedSection(null)
    }
  }, [isOpen])

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

  const content = (
    <>
      <CardHeader className={cn("flex flex-row items-center gap-2 space-y-0 px-2 py-1", !hideBlocks && "border-b")}>
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
                className="h-8 w-8 text-muted-foreground"
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
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Resume</TooltipContent>
            </Tooltip>
          )}

          {activeResumeId && onReparse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 text-muted-foreground", isParsing && "animate-spin")}
                  onClick={() => onReparse(activeResumeId)}
                  disabled={isParsing}
                >
                  <Wrench className="size-4" />
                  <span className="sr-only">Reparse</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reparse with AI</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isParsing ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 text-primary animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Parsing Resume...</p>
                <p className="text-xs text-muted-foreground">Extracting skills, experience, and education</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                {parseProgress !== undefined ? (
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${parseProgress}%` }}
                  />
                ) : (
                  <div className="h-full w-1/3 bg-primary rounded-full animate-[slidingBar_1.5s_ease-in-out_infinite]" />
                )}
              </div>
              {parseProgress !== undefined && (
                <p className="text-xs text-muted-foreground text-right">{parseProgress}%</p>
              )}
            </div>
          </div>
        ) : parseError ? (
          <div className="p-6 space-y-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Parse Failed</p>
              <p className="text-sm text-muted-foreground">{parseError}</p>
            </div>
            {activeResumeId && onReparse && (
              <Button variant="outline" size="sm" onClick={() => onReparse(activeResumeId)}>
                <RotateCcw className="size-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        ) : !resumeData ? (
          <ResumeEmptyState onUpload={onUpload} />
        ) : (
          <>
            {!hideBlocks && (
              <ScrollArea style={{ maxHeight }}>
                <div className="px-2 pb-2">
                  <ResumeSection
                    icon={<Layers />}
                    title="Resume Blocks"
                    count={totalSections}
                    open={isBlocksOpen}
                    onOpenChange={setIsBlocksOpen}
                  >
                    <div className="space-y-1">
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
                          <Separator className="my-0.5 opacity-50" />
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
            {customContent && (
              <div className="px-2 pb-2">
                {customContent}
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  )

  return (
    <ResumeCardContext.Provider value={{ variant }}>
      <Card
        className={cn(
          "w-full transition-all duration-300 py-0",
          styles.cardShadow || "shadow-sm",
          styles.containerBg || "bg-card",
          className
        )}
      >
        <ResumeCardCollapsibleWrapper
          isCollapsible={isCollapsible}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          className={hideBlocks ? "border-t-0" : undefined}
        >
          {content}
        </ResumeCardCollapsibleWrapper>

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

// ─── Collapsible Wrapper Helper ────────────────────────────────────

function ResumeCardCollapsibleWrapper({
  isCollapsible,
  isOpen,
  onOpenChange,
  children,
  className,
}: {
  isCollapsible: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}) {
  if (!isCollapsible) return <>{children}</>

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="flex flex-col group/collapsible"
    >
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        {children}
      </CollapsibleContent>

      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex justify-center items-center py-1.5 cursor-pointer transition-all group/toggle border-t border-border/50",
            "hover:bg-primary/5 hover:text-primary active:bg-primary/10",
            "bg-muted/30 dark:bg-muted/50",
            // Unexpanded state overrides
            "group-data-[state=closed]/collapsible:bg-secondary/40",
            "group-data-[state=closed]/collapsible:hover:bg-secondary/60",
            "group-data-[state=closed]/collapsible:text-secondary-foreground",
            className
          )}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground/70 group-hover/toggle:text-primary transition-colors">
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-0 group-data-[state=closed]/collapsible:opacity-100 transition-opacity duration-300 w-0 group-data-[state=closed]/collapsible:w-auto overflow-hidden text-nowrap">
              Resume Context
            </span>
            <ChevronUp className="size-4 transition-transform duration-300 group-data-[state=closed]/collapsible:rotate-180" />
          </div>
          <span className="sr-only">Toggle Resume</span>
        </div>
      </CollapsibleTrigger>
    </Collapsible>
  )
}
