"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useClipboard } from "@/hooks/use-clipboard"

// ─── CopyButton (inline icon button) ────────────────────────────────

export interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

function CopyButton({ value, label, className }: CopyButtonProps) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            className
          )}
          onClick={(e) => {
            e.stopPropagation()
            copy(value)
          }}
          aria-label={label || "Copy"}
        >
          {copied ? (
            <Check className="size-3 text-success" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : label || "Copy"}</TooltipContent>
    </Tooltip>
  )
}

// ─── CopyChip (badge-style button that copies on click) ─────────────

export interface CopyChipProps {
  value: string
  icon?: React.ReactNode
  /** Where to place the icon: "left" or "right". Default: "left" */
  iconPosition?: "left" | "right"
  label?: string
  className?: string
}

function CopyChip({ value, icon, iconPosition = "left", label, className }: CopyChipProps) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)

  // Determine if there's a left-side icon slot vs right-side icon slot
  const hasIcon = !!icon
  const showLeft = iconPosition === "left"

  // The icon/check element for the left slot
  const leftSlot = showLeft ? (
    copied ? (
      <Check className="size-3 shrink-0 text-success" />
    ) : hasIcon ? (
      <span className="shrink-0 text-muted-foreground [&>svg]:size-3">
        {icon}
      </span>
    ) : null
  ) : null

  // The icon/check element for the right slot
  const rightSlot = !showLeft ? (
    copied ? (
      <Check className="size-3 shrink-0 text-success" />
    ) : hasIcon ? (
      <span className="shrink-0 text-muted-foreground [&>svg]:size-3">
        {icon}
      </span>
    ) : (
      <Copy className="size-2.5 shrink-0 text-muted-foreground/60" />
    )
  ) : null

  // Default right-side copy icon when icon is on the left and no custom icon provided
  const defaultRightCopy =
    showLeft && !hasIcon && !copied ? (
      <Copy className="size-2.5 shrink-0 text-muted-foreground/60" />
    ) : null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => copy(value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-input",
            "bg-transparent px-2 py-0.5 text-xs font-medium text-foreground",
            "transition-all hover:bg-accent hover:text-accent-foreground",
            "active:scale-[0.97] cursor-pointer select-none",
            copied &&
              "border-success/50 bg-success/10 text-success",
            className
          )}
        >
          {leftSlot}
          <span className="truncate max-w-[180px]">{label || value}</span>
          {rightSlot}
          {defaultRightCopy}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Copied!" : `Copy ${label || value}`}
      </TooltipContent>
    </Tooltip>
  )
}

export { CopyButton, CopyChip }
