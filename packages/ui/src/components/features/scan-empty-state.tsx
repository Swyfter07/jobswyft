import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ScanEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  onManualScan?: () => void
  onManualEntry?: () => void
  canManualScan?: boolean
}

export function ScanEmptyState({
  onManualScan,
  onManualEntry,
  canManualScan = false,
  className,
  ...props
}: ScanEmptyStateProps) {
  return (
    <div
      className={cn(
        "border-2 border-card-accent-border rounded-lg p-6 flex flex-col items-center gap-4",
        className,
      )}
      {...props}
    >
      <Search className="size-8 text-muted-foreground/40 animate-pulse" />
      <p className="text-sm text-muted-foreground text-center">
        Navigate to a job posting to get started
      </p>
      {canManualScan && (
        <Button size="sm" onClick={onManualScan}>
          Scan This Page
        </Button>
      )}
      <button
        type="button"
        className="text-xs text-primary hover:underline"
        onClick={onManualEntry}
      >
        Or paste a job description
      </button>
    </div>
  )
}
