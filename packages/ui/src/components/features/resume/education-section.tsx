"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"

import { autoResize, autoResizeRef } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/blocks/copy-chip"

export interface ResumeEducationEntry {
  degree: string
  school: string
  startDate: string
  endDate: string
  description?: string
  highlights?: string[]
}

export interface EducationSectionProps {
  entries: ResumeEducationEntry[]
  isEditing?: boolean
  onChange?: (entries: ResumeEducationEntry[]) => void
}

function EducationSection({ entries, isEditing, onChange }: EducationSectionProps) {
  const handleEntryChange = (idx: number, updated: ResumeEducationEntry) => {
    const next = [...entries]
    next[idx] = updated
    onChange?.(next)
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <EducationEntryCard
          key={`${entry.school}-${idx}`}
          entry={entry}
          isEditing={isEditing}
          onChange={(updated) => handleEntryChange(idx, updated)}
        />
      ))}
    </div>
  )
}

function EducationEntryCard({
  entry,
  isEditing,
  onChange,
}: {
  entry: ResumeEducationEntry
  isEditing?: boolean
  onChange?: (entry: ResumeEducationEntry) => void
}) {
  const copyText = [
    `${entry.degree} — ${entry.school}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.description,
    ...(entry.highlights?.map((h) => `- ${h}`) ?? []),
  ]
    .filter(Boolean)
    .join("\n")

  const handleFieldChange = (field: keyof ResumeEducationEntry, value: string) => {
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
      <div className="rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={entry.degree}
            onChange={(e) => handleFieldChange("degree", e.target.value)}
            placeholder="Degree"
            className="h-7 text-xs"
          />
          <Input
            value={entry.school}
            onChange={(e) => handleFieldChange("school", e.target.value)}
            placeholder="School"
            className="h-7 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={entry.startDate}
            onChange={(e) => handleFieldChange("startDate", e.target.value)}
            placeholder="Start date"
            className="h-7 text-xs"
          />
          <Input
            value={entry.endDate}
            onChange={(e) => handleFieldChange("endDate", e.target.value)}
            placeholder="End date"
            className="h-7 text-xs"
          />
        </div>
        <Textarea
          ref={autoResizeRef}
          value={entry.description ?? ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          onInput={autoResize}
          placeholder="Description (honors, focus area...)"
          className="min-h-[60px] text-xs resize-none overflow-hidden"
        />
        <div className="space-y-1.5">
          {(entry.highlights ?? []).map((h, idx) => (
            <div key={`hl-${idx}-${h.slice(0, 16)}`} className="flex gap-2 items-start">
              <div className="mt-3 h-1 w-1 rounded-full bg-primary shrink-0" />
              <Textarea
                ref={autoResizeRef}
                value={h}
                onChange={(e) => handleHighlightChange(idx, e.target.value)}
                onInput={autoResize}
                className="min-h-[40px] text-xs flex-1 resize-none overflow-hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeHighlight(idx)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={addHighlight}
          >
            <Plus className="size-3 mr-1" />
            Add Bullet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5">
      <div className="flex w-full items-start gap-2 pr-8">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground">
            {entry.degree}
          </div>
          <div className="text-micro text-muted-foreground mt-0.5">
            {entry.school} &middot; {entry.startDate} — {entry.endDate}
          </div>
          {entry.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {entry.description}
            </p>
          )}
          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="mt-1 space-y-0.5">
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
        </div>
      </div>
      <div className="absolute top-2.5 right-2.5 z-10">
        <CopyButton value={copyText} label="Copy entry" />
      </div>
    </div>
  )
}

export { EducationSection }
