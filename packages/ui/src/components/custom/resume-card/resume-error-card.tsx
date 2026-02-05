import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResumeErrorCardProps {
  errorMessage?: string
  guidanceText?: string
  onRetry?: () => void
  className?: string
}

function ResumeErrorCard({ errorMessage, guidanceText, onRetry, className }: ResumeErrorCardProps) {
  return (
    <Card className={cn("flex flex-col ring-destructive", className)}>
      <CardContent className="flex flex-1 items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertTriangle className="size-10 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {errorMessage || "Something went wrong"}
            </p>
            <p className="text-xs text-muted-foreground">
              {guidanceText || "Please check your connection and try again."}
            </p>
          </div>
          <Button variant="accent" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { ResumeErrorCard }
export type { ResumeErrorCardProps }
