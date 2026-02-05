import { useState } from "react"
import { Upload, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import type { ResumeSummary } from "./types"
import { cn } from "@/lib/utils"

interface ResumeSelectorProps {
  resumes: ResumeSummary[]
  activeResumeId?: string
  maxResumes?: number
  onResumeSelect?: (id: string) => void
  onUpload?: () => void
  onDelete?: (id: string) => void
  className?: string
}

function ResumeSelector({
  resumes,
  activeResumeId,
  maxResumes = 5,
  onResumeSelect,
  onUpload,
  onDelete,
  className,
}: ResumeSelectorProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isAtLimit = resumes.length >= maxResumes
  const activeResume = resumes.find((r) => r.id === activeResumeId)

  return (
    <>
      <Card className={cn("border-border", className)}>
        <CardContent className="flex items-center gap-2 p-2">
          <Select
            value={activeResumeId}
            onValueChange={(value) => onResumeSelect?.(value)}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="Select resume">
                {activeResume?.fileName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id}>
                  {resume.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {resumes.length}/{maxResumes}
          </Badge>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onUpload}
                  disabled={isAtLimit}
                >
                  <Upload />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isAtLimit ? "Resume limit reached" : "Upload resume"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {activeResumeId && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Delete resume
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          if (activeResumeId) onDelete?.(activeResumeId)
        }}
        fileName={activeResume?.fileName}
      />
    </>
  )
}

export { ResumeSelector }
export type { ResumeSelectorProps }
