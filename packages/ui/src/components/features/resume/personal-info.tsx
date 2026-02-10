"use client"

import * as React from "react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
} from "lucide-react"
import { CopyChip } from "@/components/blocks/copy-chip"
import { Input } from "@/components/ui/input"

export interface ResumePersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin?: string
  website?: string
}

export interface PersonalInfoProps {
  data: ResumePersonalInfo
  isEditing?: boolean
  onChange?: (field: keyof ResumePersonalInfo, value: string) => void
}

const PERSONAL_INFO_FIELDS: Array<{
  key: keyof ResumePersonalInfo
  label: string
  icon: React.ReactElement
  colSpan?: boolean
}> = [
  { key: "fullName", label: "Name", icon: <User /> },
  { key: "email", label: "Email", icon: <Mail /> },
  { key: "phone", label: "Phone", icon: <Phone /> },
  { key: "linkedin", label: "LinkedIn", icon: <Globe /> },
  { key: "website", label: "Website", icon: <ExternalLink /> },
  { key: "location", label: "Location", icon: <MapPin />, colSpan: true },
]

function PersonalInfo({ data, isEditing, onChange }: PersonalInfoProps) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {PERSONAL_INFO_FIELDS.map((f) => (
          <div key={f.key} className={f.colSpan ? "col-span-2" : ""}>
            <label className="text-micro text-muted-foreground mb-0.5 block">{f.label}</label>
            <Input
              value={data[f.key] ?? ""}
              onChange={(e) => onChange?.(f.key, e.target.value)}
              className="h-7 text-xs"
              placeholder={f.label}
            />
          </div>
        ))}
      </div>
    )
  }

  const items: Array<{
    icon: React.ReactElement
    value: string
    label: string
  }> = []

  if (data.fullName) items.push({ icon: <User />, value: data.fullName, label: data.fullName })
  if (data.email) items.push({ icon: <Mail />, value: data.email, label: data.email })
  if (data.phone) items.push({ icon: <Phone />, value: data.phone, label: data.phone })
  if (data.location) items.push({ icon: <MapPin />, value: data.location, label: data.location })
  if (data.linkedin) items.push({ icon: <Globe />, value: data.linkedin, label: data.linkedin })
  if (data.website) items.push({ icon: <ExternalLink />, value: data.website, label: data.website })

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <CopyChip
          key={item.label}
          value={item.value}
          icon={React.cloneElement(item.icon, {
            className: "text-primary",
          } as React.HTMLAttributes<SVGElement>)}
          label={item.label}
        />
      ))}
    </div>
  )
}

export { PersonalInfo }
