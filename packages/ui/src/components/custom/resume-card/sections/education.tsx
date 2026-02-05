import { GraduationCap } from "lucide-react"
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
import type { ResumeEducationEntry } from "../types"

interface EducationProps {
  entries: ResumeEducationEntry[]
  entryContentMaxHeight?: string
}

function formatEducationEntry(entry: ResumeEducationEntry): string {
  const lines = [
    `${entry.degree} — ${entry.school}`,
    `${entry.startDate} — ${entry.endDate}`,
    ...(entry.gpa ? [`GPA: ${entry.gpa}`] : []),
    ...(entry.highlights?.map((h) => `- ${h}`) ?? []),
  ]
  return lines.join("\n")
}

function Education({
  entries,
  entryContentMaxHeight = "clamp(100px, 20vh, 200px)",
}: EducationProps) {
  return (
    <AccordionItem value="education">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 items-center gap-2">
          <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
          <span>Education</span>
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {entries.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Accordion type="single" collapsible>
          {entries.map((entry, i) => (
            <AccordionItem key={i} value={`edu-${i}`} className="border-b-0">
              <div className="flex items-start gap-1">
                <AccordionTrigger className="flex-1 hover:no-underline py-2">
                  <div className="flex flex-1 flex-col items-start gap-0.5 text-left">
                    <span className="text-sm font-medium">{entry.degree}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.school} &middot; {entry.startDate} — {entry.endDate}
                      {entry.gpa && ` · GPA: ${entry.gpa}`}
                    </span>
                  </div>
                </AccordionTrigger>
                <CopyButton
                  value={formatEducationEntry(entry)}
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
                  {entry.highlights && entry.highlights.length > 0 && (
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

export { Education }
