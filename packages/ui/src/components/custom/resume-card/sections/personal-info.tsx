import { User, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CopyChip } from "@/components/ui/copy-chip"
import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"
import type { ResumePersonalInfo as PersonalInfoData } from "../types"

interface PersonalInfoProps {
  data: PersonalInfoData
}

function PersonalInfo({ data }: PersonalInfoProps) {
  const fields = [
    { key: "fullName", label: data.fullName, icon: <User />, value: data.fullName },
    { key: "email", label: data.email, icon: <Mail />, value: data.email },
    { key: "phone", label: data.phone, icon: <Phone />, value: data.phone },
    { key: "location", label: data.location, icon: <MapPin />, value: data.location },
    ...(data.linkedin
      ? [{ key: "linkedin", label: data.linkedin, icon: <Linkedin />, value: data.linkedin }]
      : []),
    ...(data.website
      ? [{ key: "website", label: data.website, icon: <Globe />, value: data.website }]
      : []),
  ]

  const copyAll = fields.map((f) => f.value).join("\n")

  return (
    <AccordionItem value="personal-info">
      <div className="flex items-center gap-1">
        <AccordionTrigger className="flex-1 hover:no-underline">
          <div className="flex flex-1 items-center gap-2">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span>Personal Info</span>
            <Badge variant="secondary" className="ml-auto tabular-nums">
              {fields.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <CopyButton value={copyAll} label="Copy all" />
      </div>
      <AccordionContent>
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => (
            <CopyChip
              key={field.key}
              value={field.value}
              label={field.label}
              icon={field.icon}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export { PersonalInfo }
