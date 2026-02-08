"use client"

import { Award } from "lucide-react"
import { CopyButton } from "@/components/blocks/copy-chip"

export interface ResumeCertificationEntry {
  name: string
  issuer: string
  date: string
}

export interface CertificationsSectionProps {
  entries: ResumeCertificationEntry[]
}

function CertificationsSection({ entries }: CertificationsSectionProps) {
  return (
    <div className="space-y-1.5">
      {entries.map((entry, idx) => (
        <div
          key={`${entry.name}-${idx}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-gradient-to-r from-muted/30 to-transparent p-2.5"
        >
          <Award className="size-3.5 shrink-0 text-primary/70" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">
              {entry.name}
            </div>
            <div className="text-micro text-muted-foreground">
              {entry.issuer} &middot; {entry.date}
            </div>
          </div>
          <CopyButton
            value={`${entry.name} — ${entry.issuer} (${entry.date})`}
            label="Copy certification"
          />
        </div>
      ))}
    </div>
  )
}

export { CertificationsSection }
