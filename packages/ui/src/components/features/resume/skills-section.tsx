"use client"

import * as React from "react"
import { CopyChip } from "@/components/blocks/copy-chip"
import { Textarea } from "@/components/ui/textarea"

export interface SkillsSectionProps {
  skills: string[]
  isEditing?: boolean
  onChange?: (skills: string[]) => void
}

function SkillsSection({ skills, isEditing, onChange }: SkillsSectionProps) {
  const [showAll, setShowAll] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const VISIBLE_LIMIT = 6
  const hasMore = skills.length > VISIBLE_LIMIT
  const visibleSkills = showAll ? skills : skills.slice(0, VISIBLE_LIMIT)
  const hiddenCount = skills.length - VISIBLE_LIMIT

  // Sync draft when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setDraft(skills.join(", "))
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isEditing) {
    return (
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const parsed = draft.split(",").map((s) => s.trim()).filter(Boolean)
          onChange?.(parsed)
        }}
        className="text-xs resize-none h-20"
        placeholder="Comma-separated skills..."
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {visibleSkills.map((skill) => (
          <CopyChip key={skill} value={skill} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          aria-label={showAll ? "Show fewer skills" : `Show ${hiddenCount} more skills`}
        >
          {showAll ? (
            "Show less"
          ) : (
            <>
              <span className="text-primary">+{hiddenCount}</span> more skills
            </>
          )}
        </button>
      )}
    </div>
  )
}

export { SkillsSection }
