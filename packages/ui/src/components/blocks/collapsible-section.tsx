"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CopyButton } from "@/components/blocks/copy-chip"

export interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  count?: number
  copyAllValue?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  isParent?: boolean
  children: React.ReactNode
  className?: string
}

function CollapsibleSection({
  icon,
  title,
  count,
  copyAllValue,
  open,
  onOpenChange,
  defaultOpen = false,
  isParent = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={className}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1",
            "text-sm font-medium text-foreground",
            "transition-colors cursor-pointer select-none",
            isParent
              ? "bg-transparent hover:bg-muted/50"
              : isOpen
                ? "bg-gradient-to-r from-muted/30 to-transparent"
                : "hover:bg-muted/30"
          )}
        >
          <span className="[&>svg]:size-4 shrink-0 transition-colors text-primary">
            {icon}
          </span>
          <span className="flex-1 text-left font-semibold">{title}</span>
          {count !== undefined &&
            (isParent ? (
              <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-primary/20">
                {count}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-micro font-normal"
              >
                {count}
              </Badge>
            ))}
          {copyAllValue && (
            <CopyButton
              value={copyAllValue}
              label={`Copy all ${title.toLowerCase()}`}
            />
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200 text-primary",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-2 py-0.5 animate-in fade-in-0 slide-in-from-top-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { CollapsibleSection }
