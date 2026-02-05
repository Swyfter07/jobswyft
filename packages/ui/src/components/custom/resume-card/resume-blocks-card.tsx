import { Card, CardContent } from "@/components/ui/card"
import { Accordion } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PersonalInfo } from "./sections/personal-info"
import { Skills } from "./sections/skills"
import { Experience } from "./sections/experience"
import { Education } from "./sections/education"
import { Certifications } from "./sections/certifications"
import { Projects } from "./sections/projects"
import type { ResumeData } from "./types"
import { cn } from "@/lib/utils"

interface ResumeBlocksCardProps {
  resumeData: ResumeData
  maxHeight?: string
  entryContentMaxHeight?: string
  className?: string
}

function ResumeBlocksCard({
  resumeData,
  maxHeight,
  entryContentMaxHeight,
  className,
}: ResumeBlocksCardProps) {
  const hasCertifications =
    resumeData.certifications && resumeData.certifications.length > 0
  const hasProjects = resumeData.projects && resumeData.projects.length > 0

  return (
    <Card className={cn("flex flex-col ring-accent", className)}>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4">
          <Accordion
            type="single"
            collapsible
            defaultValue="personal-info"
            className="w-full"
          >
            <PersonalInfo data={resumeData.personalInfo} />
            {resumeData.skills.length > 0 && (
              <Skills skills={resumeData.skills} />
            )}
            {resumeData.experience.length > 0 && (
              <Experience
                entries={resumeData.experience}
                entryContentMaxHeight={entryContentMaxHeight}
              />
            )}
            {resumeData.education.length > 0 && (
              <Education
                entries={resumeData.education}
                entryContentMaxHeight={entryContentMaxHeight}
              />
            )}
            {hasCertifications && (
              <Certifications entries={resumeData.certifications!} />
            )}
            {hasProjects && <Projects entries={resumeData.projects!} />}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export { ResumeBlocksCard }
export type { ResumeBlocksCardProps }
