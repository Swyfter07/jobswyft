import { Wrench } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CopyChip } from "@/components/ui/copy-chip"
import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"

interface SkillsProps {
  skills: string[]
}

function Skills({ skills }: SkillsProps) {
  const copyAll = skills.join(", ")

  return (
    <AccordionItem value="skills">
      <div className="flex items-center gap-1">
        <AccordionTrigger className="flex-1 hover:no-underline">
          <div className="flex flex-1 items-center gap-2">
            <Wrench className="size-4 shrink-0 text-muted-foreground" />
            <span>Skills</span>
            <Badge variant="secondary" className="ml-auto tabular-nums">
              {skills.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <CopyButton value={copyAll} label="Copy all skills" />
      </div>
      <AccordionContent>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <CopyChip key={`${skill}-${i}`} value={skill} label={skill} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export { Skills }
