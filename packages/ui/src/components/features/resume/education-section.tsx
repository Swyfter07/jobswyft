"use client"

import * as React from "react"

import { CopyButton } from "@/components/blocks/copy-chip"

export interface ResumeEducationEntry {
  degree: string
  school: string
  startDate: string
  endDate: string
}

export interface EducationSectionProps {
  entries: ResumeEducationEntry[]
}

function EducationSection({ entries }: EducationSectionProps) {
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

function EducationEntryCard({
  entry,
}: {
  entry: ResumeEducationEntry
}) {
  const copyText = `${entry.degree} — ${entry.school}\n${entry.startDate} - ${entry.endDate}`

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
        </div>
      </div>
      <div className="absolute top-2.5 right-2.5 z-10">
        <CopyButton value={copyText} label="Copy entry" />
      </div>
    </div>
  )
}

export { EducationSection }
