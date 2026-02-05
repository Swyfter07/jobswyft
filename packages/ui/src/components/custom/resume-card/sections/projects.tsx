import { FolderOpen, ExternalLink } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CopyButton } from "@/components/ui/copy-button"
import { CopyChip } from "@/components/ui/copy-chip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ResumeProjectEntry } from "../types"

interface ProjectsProps {
  entries: ResumeProjectEntry[]
}

function formatProjectEntry(entry: ResumeProjectEntry): string {
  const lines = [
    entry.name,
    entry.description,
    `Tech: ${entry.techStack.join(", ")}`,
  ]
  if (entry.url) lines.push(entry.url)
  return lines.join("\n")
}

function Projects({ entries }: ProjectsProps) {
  return (
    <AccordionItem value="projects">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 items-center gap-2">
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          <span>Projects</span>
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {entries.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Accordion type="single" collapsible>
          {entries.map((entry, i) => (
            <AccordionItem key={i} value={`proj-${i}`} className="border-b-0">
              <div className="flex items-start gap-1">
                <AccordionTrigger className="flex-1 hover:no-underline py-2">
                  <div className="flex flex-1 flex-col items-start gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{entry.name}</span>
                      {entry.url && (
                        <ExternalLink className="size-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.techStack.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {entry.techStack.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.techStack.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <CopyButton
                  value={formatProjectEntry(entry)}
                  label="Copy project"
                  className="mt-2.5"
                />
              </div>
              <AccordionContent>
                <Separator className="mb-2 border-dashed" />
                <p className="mb-2 text-sm text-muted-foreground">
                  {entry.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.techStack.map((tech) => (
                    <CopyChip key={tech} value={tech} label={tech} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
}

export { Projects }
