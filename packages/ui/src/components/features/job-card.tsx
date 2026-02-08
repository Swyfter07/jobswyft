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
import type { JobData } from "@/lib/mappers"

// ─── Props ──────────────────────────────────────────────────────────

export interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  job: JobData
  isEditing?: boolean
  onEditToggle?: () => void
  onSave?: (job: JobData) => void
  onFieldChange?: (field: keyof JobData, value: string) => void
  isLoading?: boolean
  isSaving?: boolean
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
  isEditing = false,
  onEditToggle,
  onSave,
  onFieldChange,
  isLoading = false,
  isSaving = false,
  className,
  ...props
}: JobCardProps) {
  const requiredMissing = {
    title: !job.title?.trim(),
    company: !job.company?.trim(),
    description: !job.description?.trim(),
  }

  const hasMissing = requiredMissing.title || requiredMissing.company || requiredMissing.description

  return (
    <Card
      className={cn(
        "w-full overflow-hidden border-2 border-card-accent-border",
        className,
      )}
      {...props}
    >
      <CardHeader className="-mt-4 pt-4 pb-3 space-y-3 bg-card-accent-bg">
        {/* Top Row: Header + Edit Toggle */}
        <div className="flex items-start justify-between gap-3">
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
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={job.title}
                    onChange={(e) => onFieldChange?.("title", e.target.value)}
                    placeholder="Job Title"
                    className="text-sm font-bold h-8"
                  />
                  <Input
                    value={job.company}
                    onChange={(e) => onFieldChange?.("company", e.target.value)}
                    placeholder="Company Name"
                    className="h-7 text-xs"
                  />
                </div>
              ) : (
                <>
                  {requiredMissing.title ? (
                    <MissingFieldIndicator label="Title" />
                  ) : (
                    <CardTitle className="text-base font-bold tracking-tight text-primary truncate">
                      {job.title}
                    </CardTitle>
                  )}
                  {requiredMissing.company ? (
                    <MissingFieldIndicator label="Company" />
                  ) : (
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {job.company}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Edit Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onEditToggle}
          >
            {isEditing ? (
              <X className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
          </Button>
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
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={job.description ?? ""}
              onChange={(e) => onFieldChange?.("description", e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[160px] resize-none text-xs"
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
            {/* Description */}
            {requiredMissing.description ? (
              <MissingFieldIndicator label="Description" />
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                {job.description}
              </p>
            )}

            {/* Save button (view mode) */}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
