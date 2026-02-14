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

const CHIP_LABEL_MAX = 80
const TOOLTIP_MAX = 120

function truncateText(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

function CopyChip({ value, icon, iconPosition = "left", label, className }: CopyChipProps) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)
  const displayLabel = truncateText(label || value, CHIP_LABEL_MAX)
  const tooltipLabel = truncateText(label || value, TOOLTIP_MAX)

  // Simplified logic:
  // - If icon exists: show it in iconPosition, check replaces it when copied
  // - If no icon: show Copy icon on right, check replaces it when copied
  const hasIcon = !!icon
  const showIconOnLeft = hasIcon && iconPosition === "left"
  const showIconOnRight = hasIcon && iconPosition === "right"

  // Left slot: only show if custom icon is on left
  const leftSlot = showIconOnLeft ? (
    copied ? (
      <Check className="size-3 shrink-0 text-success" />
    ) : (
      <span className="shrink-0 text-muted-foreground [&>svg]:size-3">
        {icon}
      </span>
    )
  ) : null

  // Right slot: show custom icon if on right, OR default Copy icon if no custom icon
  const rightSlot = showIconOnRight ? (
    copied ? (
      <Check className="size-3 shrink-0 text-success" />
    ) : (
      <span className="shrink-0 text-muted-foreground [&>svg]:size-3">
        {icon}
      </span>
    )
  ) : !hasIcon ? (
    copied ? (
      <Check className="size-3 shrink-0 text-success" />
    ) : (
      <Copy className="size-2.5 shrink-0 text-muted-foreground/60" />
    )
  ) : null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => copy(value)}
          aria-label={`Copy ${truncateText(label || value, 40)}`}
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
          <span className="truncate max-w-[180px]">{displayLabel}</span>
          {rightSlot}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Copied!" : `Copy ${tooltipLabel}`}
      </TooltipContent>
    </Tooltip>
  )
}

export { CopyButton, CopyChip }
