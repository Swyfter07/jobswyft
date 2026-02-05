import * as React from "react"
import { Check, Copy } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useClipboard } from "@/hooks/use-clipboard"
import { cn } from "@/lib/utils"

interface CopyChipProps {
  value: string
  label: string
  icon?: React.ReactNode
  className?: string
}

function CopyChip({ value, label, icon, className }: CopyChipProps) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Copy ${label}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted",
              copied && "border-green-500/50 bg-green-500/10",
              className
            )}
            onClick={(e) => {
              e.stopPropagation()
              copy(value)
            }}
          >
            {icon && <span className="shrink-0 text-muted-foreground [&_svg]:size-3">{icon}</span>}
            <span className="truncate">{label}</span>
            {copied ? (
              <Check className="size-3 shrink-0 text-green-500" />
            ) : (
              <Copy className="size-3 shrink-0 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? "Copied!" : `Copy ${label}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { CopyChip }
export type { CopyChipProps }
