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
            <div className="flex flex-wrap gap-1.5">
                {options.map((option) => (
                    <Button
                        key={option.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "h-7 px-2.5 text-xs rounded-full transition-all",
                            value === option.value
                                ? "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                                : "text-muted-foreground hover:text-foreground hover:border-primary/40"
                        )}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
