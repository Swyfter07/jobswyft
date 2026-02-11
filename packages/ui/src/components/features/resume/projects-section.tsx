"use client"

import * as React from "react"
import { ChevronDown, ExternalLink, Plus, X } from "lucide-react"

import { cn, autoResize, autoResizeRef } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CopyButton, CopyChip } from "@/components/blocks/copy-chip"

export interface ResumeProjectEntry {
  name: string
  description: string
  techStack: string[]
  url?: string
  highlights?: string[]
}

export interface ProjectsSectionProps {
  entries: ResumeProjectEntry[]
  isEditing?: boolean
  onChange?: (entries: ResumeProjectEntry[]) => void
}

function ProjectsSection({ entries, isEditing, onChange }: ProjectsSectionProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)

  const handleEntryChange = (idx: number, updated: ResumeProjectEntry) => {
    const next = [...entries]
    next[idx] = updated
    onChange?.(next)
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <ProjectEntryCard
          key={`${entry.name}-${idx}`}
          entry={entry}
          isOpen={isEditing || expandedIndex === idx}
          onOpenChange={(isOpen) => !isEditing && setExpandedIndex(isOpen ? idx : null)}
          isEditing={isEditing}
          onChange={(updated) => handleEntryChange(idx, updated)}
        />
      ))}
    </div>
  )
}

function ProjectEntryCard({
  entry,
  isOpen,
  onOpenChange,
  isEditing,
  onChange,
}: {
  entry: ResumeProjectEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing?: boolean
  onChange?: (entry: ResumeProjectEntry) => void
}) {
  const copyText = [
    entry.name,
    entry.description,
    `Tech: ${entry.techStack.join(", ")}`,
    entry.url ?? "",
    ...(entry.highlights?.map((h) => `- ${h}`) ?? []),
  ]
    .filter(Boolean)
    .join("\n")

  const handleFieldChange = (field: keyof ResumeProjectEntry, value: string) => {
    onChange?.({ ...entry, [field]: value })
  }

  const handleHighlightChange = (idx: number, value: string) => {
    const next = [...(entry.highlights ?? [])]
    next[idx] = value
    onChange?.({ ...entry, highlights: next })
  }

  const addHighlight = () => {
    onChange?.({ ...entry, highlights: [...(entry.highlights ?? []), ""] })
  }

  const removeHighlight = (idx: number) => {
    onChange?.({
      ...entry,
      highlights: (entry.highlights ?? []).filter((_, i) => i !== idx),
    })
  }

  if (isEditing) {
    return (
      <ProjectEditCard
        entry={entry}
        onChange={onChange}
        onHighlightChange={handleHighlightChange}
        onAddHighlight={addHighlight}
        onRemoveHighlight={removeHighlight}
      />
    )
  }

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
              {!isOpen && (
                <div className="text-micro text-muted-foreground mt-0.5 line-clamp-1">
                  {entry.description}
                </div>
              )}
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
            {entry.highlights && entry.highlights.length > 0 && (
              <ul className="space-y-0.5">
                {entry.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-foreground"
                  >
                    <span className="text-primary mt-0.5 shrink-0 text-micro">
                      &bull;
                    </span>
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            )}
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

function ProjectEditCard({
  entry,
  onChange,
  onHighlightChange,
  onAddHighlight,
  onRemoveHighlight,
}: {
  entry: ResumeProjectEntry
  onChange?: (entry: ResumeProjectEntry) => void
  onHighlightChange: (idx: number, value: string) => void
  onAddHighlight: () => void
  onRemoveHighlight: (idx: number) => void
}) {
  const [techText, setTechText] = React.useState(entry.techStack.join(", "))

  const handleFieldChange = (field: keyof ResumeProjectEntry, value: string) => {
    onChange?.({ ...entry, [field]: value })
  }

  const handleTechBlur = () => {
    const techs = techText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onChange?.({ ...entry, techStack: techs })
  }

  return (
    <div className="rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={entry.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Project name"
          className="h-7 text-xs"
        />
        <Input
          value={entry.url ?? ""}
          onChange={(e) => handleFieldChange("url", e.target.value)}
          placeholder="URL (optional)"
          className="h-7 text-xs"
        />
      </div>
      <Textarea
        ref={autoResizeRef}
        value={entry.description}
        onChange={(e) => handleFieldChange("description", e.target.value)}
        onInput={autoResize}
        placeholder="Project description..."
        className="min-h-[60px] text-xs resize-none overflow-hidden"
      />
      <div className="space-y-1.5">
        {(entry.highlights ?? []).map((h, idx) => (
          <div key={`hl-${idx}-${h.slice(0, 16)}`} className="flex gap-2 items-start">
            <div className="mt-3 h-1 w-1 rounded-full bg-primary shrink-0" />
            <Textarea
              ref={autoResizeRef}
              value={h}
              onChange={(e) => onHighlightChange(idx, e.target.value)}
              onInput={autoResize}
              className="min-h-[40px] text-xs flex-1 resize-none overflow-hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveHighlight(idx)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={onAddHighlight}
        >
          <Plus className="size-3 mr-1" />
          Add Bullet
        </Button>
      </div>
      <Input
        value={techText}
        onChange={(e) => setTechText(e.target.value)}
        onBlur={handleTechBlur}
        placeholder="Tech stack (comma-separated)"
        className="h-7 text-xs"
      />
    </div>
  )
}

export { ProjectsSection }
