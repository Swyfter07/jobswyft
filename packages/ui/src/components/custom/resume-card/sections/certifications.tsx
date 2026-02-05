import { Award } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"
import type { ResumeCertificationEntry } from "../types"

interface CertificationsProps {
  entries: ResumeCertificationEntry[]
}

function formatCertEntry(entry: ResumeCertificationEntry): string {
  return `${entry.name} — ${entry.issuer} (${entry.date})`
}

function Certifications({ entries }: CertificationsProps) {
  return (
    <AccordionItem value="certifications">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 items-center gap-2">
          <Award className="size-4 shrink-0 text-muted-foreground" />
          <span>Certifications</span>
          <Badge variant="secondary" className="ml-auto mr-2 tabular-nums">
            {entries.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 rounded-md border border-border p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{entry.name}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.issuer} &middot; {entry.date}
                </p>
              </div>
              <CopyButton
                value={formatCertEntry(entry)}
                label="Copy certification"
              />
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export { Certifications }
