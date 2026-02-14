import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ChipOption {
    value: string
    label: string
}

export interface SelectionChipsProps {
    label: string
    options: ChipOption[]
    value: string
    onChange: (value: string) => void
    className?: string
}

/**
 * A group of toggle chips for selecting a single option.
 * Used for tone/length/style selection in AI generation forms.
 */
export function SelectionChips({
    label,
    options,
    value,
    onChange,
    className,
}: SelectionChipsProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
                {options.map((option) => (
                    <Button
                        key={option.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(option.value)}
                        aria-pressed={value === option.value}
                        aria-label={`${option.label}${value === option.value ? " (selected)" : ""}`}
                        className={cn(
                            "h-7 px-2.5 text-xs rounded-full transition-all",
                            value === option.value
                                ? "border-primary bg-accent/10 text-accent-foreground hover:bg-accent/15"
                                : "text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
