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
}

function PersonalInfo({ data }: PersonalInfoProps) {
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
