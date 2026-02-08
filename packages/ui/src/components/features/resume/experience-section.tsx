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

export interface ResumeExperienceEntry {
  title: string
  company: string
  startDate: string
  endDate: string
  description: string
  highlights: string[]
}

export interface ExperienceSectionProps {
  entries: ResumeExperienceEntry[]
}

function ExperienceSection({ entries }: ExperienceSectionProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0)
  const [showAll, setShowAll] = React.useState(false)
  const VISIBLE_LIMIT = 2
  const hasMore = entries.length > VISIBLE_LIMIT
  const visibleEntries = showAll ? entries : entries.slice(0, VISIBLE_LIMIT)

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
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-2 border border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50"
          aria-label={showAll ? "Show fewer positions" : `View all ${entries.length} positions`}
        >
          {showAll ? (
            "Show less"
          ) : (
            <>
              View all{" "}
              <span className="text-primary font-medium">
                {entries.length}
              </span>{" "}
              positions
            </>
          )}
        </button>
      )}
    </div>
  )
}

const DESCRIPTION_CHAR_LIMIT = 150
const HIGHLIGHTS_VISIBLE_LIMIT = 3

function ExperienceEntryCard({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: ResumeExperienceEntry
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [descExpanded, setDescExpanded] = React.useState(false)
  const [highlightsExpanded, setHighlightsExpanded] = React.useState(false)
  const copyText = [
    `${entry.title} at ${entry.company}`,
    `${entry.startDate} - ${entry.endDate}`,
    entry.description,
    ...entry.highlights.map((h) => `- ${h}`),
  ].join("\n")

  const isLong = entry.description.length > DESCRIPTION_CHAR_LIMIT
  const displayedDesc =
    isLong && !descExpanded
      ? entry.description.slice(0, DESCRIPTION_CHAR_LIMIT).trimEnd() + "…"
      : entry.description

  const hasMoreHighlights = entry.highlights.length > HIGHLIGHTS_VISIBLE_LIMIT
  const visibleHighlights = highlightsExpanded
    ? entry.highlights
    : entry.highlights.slice(0, HIGHLIGHTS_VISIBLE_LIMIT)

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
            {entry.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {displayedDesc}
                {isLong && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDescExpanded(!descExpanded)
                    }}
                    className="ml-1 text-primary hover:underline font-medium cursor-pointer"
                    aria-label={descExpanded ? "Show less description" : "Show full description"}
                  >
                    {descExpanded ? "show less" : "show more"}
                  </button>
                )}
              </p>
            )}
            {entry.highlights.length > 0 && (
              <>
                <ul className="space-y-0.5">
                  {visibleHighlights.map((highlight, i) => (
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
                {hasMoreHighlights && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setHighlightsExpanded(!highlightsExpanded)
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    aria-label={highlightsExpanded ? "Show fewer highlights" : `Show ${entry.highlights.length - HIGHLIGHTS_VISIBLE_LIMIT} more highlights`}
                  >
                    {highlightsExpanded
                      ? "show less"
                      : `+${entry.highlights.length - HIGHLIGHTS_VISIBLE_LIMIT} more`}
                  </button>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export { ExperienceSection }
