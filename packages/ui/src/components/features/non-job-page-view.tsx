import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface NonJobPageViewProps {
    onPasteJobDescription?: () => void
}

/**
 * Empty state shown when user is authenticated but not on a job page.
 * Displays a prompt to navigate to a job posting or paste a job description.
 */
export function NonJobPageView({ onPasteJobDescription }: NonJobPageViewProps) {
    return (
        <div className="flex flex-col items-center gap-4 py-12 px-4">
            {/* Dashed border container */}
            <div className="w-full rounded-lg border-2 border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Search className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                    Navigate to a job posting
                </p>
                <p className="text-micro text-muted-foreground">
                    Open a job listing on any job board to get started
                </p>
            </div>

            {/* Paste link — placeholder action for EXT.5 */}
            <Button
                variant="link"
                size="sm"
                onClick={onPasteJobDescription}
                className="text-sm"
            >
                Or paste a job description
            </Button>

            {/* Resume tray slot — placeholder for EXT.4 */}
            <div className="w-full mt-4 rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-micro text-muted-foreground">
                    Resume tray (EXT.4)
                </p>
            </div>
        </div>
    )
}
