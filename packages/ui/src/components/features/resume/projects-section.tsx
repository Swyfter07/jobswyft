"use client"

import * as React from "react"
import { ChevronDown, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
}

export interface ProjectsSectionProps {
  entries: ResumeProjectEntry[]
}

function ProjectsSection({ entries }: ProjectsSectionProps) {
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

export { ProjectsSection }
