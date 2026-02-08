"use client"

import * as React from "react"
import { CopyChip } from "@/components/blocks/copy-chip"

export interface SkillsSectionProps {
  skills: string[]
}

function SkillsSection({ skills }: SkillsSectionProps) {
  const [showAll, setShowAll] = React.useState(false)
  const VISIBLE_LIMIT = 6
  const hasMore = skills.length > VISIBLE_LIMIT
  const visibleSkills = showAll ? skills : skills.slice(0, VISIBLE_LIMIT)
  const hiddenCount = skills.length - VISIBLE_LIMIT

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
