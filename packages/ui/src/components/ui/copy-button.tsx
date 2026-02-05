import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useClipboard } from "@/hooks/use-clipboard"
import { cn } from "@/lib/utils"

interface CopyButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  value: string
  label?: string
}

function CopyButton({ value, label = "Copy", className, ...props }: CopyButtonProps) {
  const { copy, isCopied } = useClipboard()
  const copied = isCopied(value)

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn("shrink-0", className)}
            onClick={(e) => {
              e.stopPropagation()
              copy(value)
            }}
            {...props}
          >
            {copied ? (
              <Check className="size-3 text-green-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? "Copied!" : label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { CopyButton }
export type { CopyButtonProps }
