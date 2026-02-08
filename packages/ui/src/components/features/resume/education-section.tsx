"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  const copyText = `${entry.degree} — ${entry.school}\n${entry.startDate} - ${entry.endDate}`

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
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <div className="absolute top-2.5 right-2.5 z-10">
          <CopyButton value={copyText} label="Copy entry" />
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up" />
      </div>
    </Collapsible>
  )
}

export { EducationSection }
