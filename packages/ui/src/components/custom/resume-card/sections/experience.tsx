import { Briefcase } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ResumeExperienceEntry } from "../types"

interface ExperienceProps {
  entries: ResumeExperienceEntry[]
  entryContentMaxHeight?: string
}

function formatExperienceEntry(entry: ResumeExperienceEntry): string {
  const lines = [
    `${entry.title} at ${entry.company}`,
    `${entry.startDate} — ${entry.endDate}`,
    entry.description,
    ...entry.highlights.map((h) => `- ${h}`),
  ]
  return lines.join("\n")
}

function Experience({
  entries,
  entryContentMaxHeight = "clamp(100px, 20vh, 200px)",
}: ExperienceProps) {
  return (
    <AccordionItem value="experience">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 items-center gap-2">
          <Briefcase className="size-4 shrink-0 text-muted-foreground" />
          <span>Experience</span>
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {entries.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Accordion type="single" collapsible>
          {entries.map((entry, i) => (
            <AccordionItem key={i} value={`exp-${i}`} className="border-b-0">
              <div className="flex items-start gap-1">
                <AccordionTrigger className="flex-1 hover:no-underline py-2">
                  <div className="flex flex-1 flex-col items-start gap-0.5 text-left">
                    <span className="text-sm font-medium">{entry.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.company} &middot; {entry.startDate} — {entry.endDate}
                    </span>
                  </div>
                </AccordionTrigger>
                <CopyButton
                  value={formatExperienceEntry(entry)}
                  label="Copy entry"
                  className="mt-2.5"
                />
              </div>
              <AccordionContent>
                <Separator className="mb-2 border-dashed" />
                <ScrollArea
                  style={{ maxHeight: entryContentMaxHeight }}
                  className="pr-3"
                >
                  {entry.description && (
                    <p className="mb-2 text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                  )}
                  {entry.highlights.length > 0 && (
                    <ul className="space-y-1">
                      {entry.highlights.map((highlight, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
}

export { Experience }
