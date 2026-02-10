import React from "react"
import {
  Building,
  MapPin,
  DollarSign,
  Briefcase,
  Pencil,
  X,
  AlertTriangle,
  Save,
  Loader2,
  ChevronDown,
  Brain,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SkillPill, SkillSectionLabel } from "@/components/blocks/skill-pill"
import type { JobData, MatchData } from "@/lib/mappers"

// ─── Props ──────────────────────────────────────────────────────────

export interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  job: JobData
  match?: MatchData
  isEditing?: boolean
  onEditToggle?: () => void
  onSave?: (job: JobData) => void
  onFieldChange?: (field: keyof JobData, value: string) => void
  isSaving?: boolean
  isScanning?: boolean
  onScan?: () => void
  isAnalyzing?: boolean
}

// ─── Match Indicator ────────────────────────────────────────────────

function MatchIndicator({ score, isLoading }: { score?: number; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 animate-tab-content min-w-[60px]">
        <div className="p-1 rounded-full bg-muted/20 shadow-lg">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted/10 shadow-inner">
            <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        <span className="text-micro font-medium text-muted-foreground uppercase tracking-tight leading-none text-center whitespace-nowrap animate-pulse">
          Analyzing
        </span>
      </div>
    )
  }

  const safeScore = score ?? 0
  let colorClass = "text-destructive"
  let ringClass = "bg-destructive/15"
  let bgClass = "bg-destructive/5"
  let fitLabel = "Weak fit"

  if (safeScore >= 80) {
    colorClass = "text-success"
    ringClass = "bg-success/15"
    bgClass = "bg-success/5"
    fitLabel = "Strong fit"
  } else if (safeScore >= 50) {
    colorClass = "text-warning"
    ringClass = "bg-warning/15"
    bgClass = "bg-warning/5"
    fitLabel = "Good fit"
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 animate-tab-content min-w-[60px]">
      <div className={cn("p-1 rounded-full shadow-lg", ringClass)}>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full font-bold text-lg shadow-inner",
            colorClass,
            bgClass,
          )}
        >
          {safeScore}%
        </div>
      </div>
      <span className="text-micro font-bold text-muted-foreground uppercase tracking-tight leading-none text-center whitespace-nowrap">
        {fitLabel}
      </span>
    </div>
  )
}

// ─── Missing Field Indicator ────────────────────────────────────────

function MissingFieldIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-warning">
      <AlertTriangle className="size-3" />
      <span className="text-micro">{label} missing</span>
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────

export function JobCard({
  job,
  match,
  isEditing = false,
  onEditToggle,
  onSave,
  onFieldChange,
  isSaving = false,
  isScanning = false,
  onScan,
  isAnalyzing = false,
  className,
  ...props
}: JobCardProps) {
  const [showDescription, setShowDescription] = React.useState(false)

  const requiredMissing = {
    title: !job.title?.trim(),
    company: !job.company?.trim(),
    description: !job.description?.trim(),
  }

  const hasMissing = requiredMissing.title || requiredMissing.company || requiredMissing.description

  return (
    <Card
      className={cn(
        "w-full overflow-hidden border-2 border-card-accent-border p-0 gap-0 relative",
        className,
      )}
      {...props}
    >
      {/* Scanning overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
        </div>
      )}

      <CardHeader className="-mt-4 pt-4 pb-3 space-y-3 bg-card-accent-bg flex-shrink-0">
        {/* Top Row: Header + Match */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 w-full">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={job.title}
                    onChange={(e) => onFieldChange?.("title", e.target.value)}
                    placeholder="Job Title"
                    className="text-sm font-bold h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={onEditToggle}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <Input
                  value={job.company}
                  onChange={(e) => onFieldChange?.("company", e.target.value)}
                  placeholder="Company Name"
                  className="h-7 text-xs"
                />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Company Logo */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                    {job.logo ? (
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="size-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building className="size-5" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {requiredMissing.title ? (
                        <MissingFieldIndicator label="Title" />
                      ) : (
                        <CardTitle className="text-base font-bold tracking-tight text-primary truncate">
                          {job.title}
                        </CardTitle>
                      )}
                      <div className="flex items-center shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground/50 hover:text-foreground"
                          onClick={onEditToggle}
                          title="Edit Job Details"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        {onScan && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground/50 hover:text-foreground ml-1"
                            onClick={onScan}
                            title="Re-scan Job"
                            disabled={isScanning}
                          >
                            <RefreshCw className={cn("size-3", isScanning && "animate-spin")} />
                          </Button>
                        )}
                      </div>
                    </div>
                    {requiredMissing.company ? (
                      <MissingFieldIndicator label="Company" />
                    ) : (
                      <p className="text-xs text-muted-foreground font-medium truncate">
                        {job.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Match Indicator */}
                {(match || isAnalyzing) && (
                  <MatchIndicator score={match?.score} isLoading={isAnalyzing} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Badges (view mode only) */}
        {!isEditing && (
          <div className="flex flex-wrap gap-1.5">
            {job.location && (
              <Badge variant="outline" className="gap-1 font-normal text-micro">
                <MapPin className="size-3" /> {job.location}
              </Badge>
            )}
            {job.salary && (
              <Badge variant="outline" className="gap-1 font-normal text-micro">
                <DollarSign className="size-3" /> {job.salary}
              </Badge>
            )}
            {job.employmentType && (
              <Badge variant="outline" className="gap-1 font-normal text-micro">
                <Briefcase className="size-3" /> {job.employmentType}
              </Badge>
            )}
          </div>
        )}

        {/* Edit mode: location & salary inputs */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={job.location ?? ""}
              onChange={(e) => onFieldChange?.("location", e.target.value)}
              placeholder="Location"
              className="h-7 text-xs"
            />
            <Input
              value={job.salary ?? ""}
              onChange={(e) => onFieldChange?.("salary", e.target.value)}
              placeholder="Salary"
              className="h-7 text-xs"
            />
          </div>
        )}

        {/* Description Toggle (view mode only, when has description) */}
        {!isEditing && job.description && (
          <button
            type="button"
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none w-fit group/toggle"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-300 group-hover/toggle:text-foreground",
                showDescription && "rotate-180",
              )}
            />
            <span className="group-hover/toggle:underline decoration-border/50 underline-offset-4">
              {showDescription ? "Hide Job Description" : "Show Full Description"}
            </span>
          </button>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-ai-accent" />
              <span>Paste Job Description</span>
            </div>
            <Textarea
              value={job.description ?? ""}
              onChange={(e) => onFieldChange?.("description", e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[200px] resize-none text-xs"
            />
            <Button
              onClick={() => onSave?.(job)}
              disabled={isSaving || hasMissing}
              className="w-full font-semibold shadow-md"
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {isSaving ? "Saving..." : "Save Job"}
            </Button>
          </div>
        ) : (
          <>
            {/* Collapsible Description */}
            <Collapsible open={showDescription}>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="space-y-3 pt-2">
                  {requiredMissing.description ? (
                    <MissingFieldIndicator label="Description" />
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Match Analysis (visible when description is collapsed) */}
            <Collapsible open={!showDescription}>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="space-y-4 pt-2">
                  {/* Analysis Loading Skeleton */}
                  {isAnalyzing && !match ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <div className="size-4 bg-muted rounded-full" />
                          <div className="h-4 w-24 bg-muted rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-muted/60 rounded" />
                          <div className="h-3 w-3/4 bg-muted/60 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-muted rounded" />
                        <div className="flex gap-2">
                          <div className="h-5 w-16 bg-muted/40 rounded-full" />
                          <div className="h-5 w-20 bg-muted/40 rounded-full" />
                          <div className="h-5 w-14 bg-muted/40 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ) : match ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Brain className="size-4 text-ai-accent" />
                        <span>Analysis</span>
                      </div>

                      {match.summary && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {match.summary}
                        </p>
                      )}

                      {/* Skills — Stacked Layout */}
                      <div className="space-y-4 pt-2">
                        {/* Matches */}
                        <div className="space-y-2">
                          <SkillSectionLabel label="Your Matches" variant="success" />
                          <div className="flex flex-wrap gap-2">
                            {match.matchedSkills.length > 0 ? (
                              match.matchedSkills.map((skill) => (
                                <SkillPill key={skill} name={skill} variant="matched" />
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                No direct matches found
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Gaps */}
                        <div className="space-y-2">
                          <SkillSectionLabel label="Missing Skills" variant="warning" />
                          <div className="flex flex-wrap gap-2">
                            {match.missingSkills.length > 0 ? (
                              match.missingSkills.map((skill) => (
                                <SkillPill key={skill} name={skill} variant="missing" />
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                No major gaps detected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* No match data and not analyzing — show description preview */
                    <>
                      {requiredMissing.description ? (
                        <MissingFieldIndicator label="Description" />
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                          {job.description}
                        </p>
                      )}
                    </>
                  )}

                  {/* Save button */}
                  <Button
                    onClick={() => onSave?.(job)}
                    disabled={isSaving || hasMissing}
                    className="w-full font-semibold shadow-md"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 size-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Job"}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  )
}
