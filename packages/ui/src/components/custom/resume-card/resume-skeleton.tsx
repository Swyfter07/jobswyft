import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ResumeSkeletonProps {
  className?: string
}

function ResumeSkeleton({ className }: ResumeSkeletonProps) {
  return (
    <Card className={cn("flex flex-col ring-accent", className)}>
      <CardContent className="flex-1 space-y-0 p-4">
        <div className="flex items-center justify-between py-2.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Separator />
        <div className="flex items-center justify-between py-2.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Separator />
        <div className="flex items-center justify-between py-2.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Separator />
        <div className="flex items-center justify-between py-2.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Separator />
        <div className="flex items-center justify-between py-2.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}

export { ResumeSkeleton }
export type { ResumeSkeletonProps }
