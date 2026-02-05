import React from "react"
import { Briefcase, Sun, Moon, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
    appName?: string
    logo?: React.ReactNode
    onSettingsClick?: () => void
    onThemeToggle?: () => void
    isDarkMode?: boolean
}

export function AppHeader({
    appName = "JobSwyft",
    logo,
    onSettingsClick,
    onThemeToggle,
    isDarkMode = false,
    className,
    ...props
}: AppHeaderProps) {
    return (
        <header
            className={cn(
                "sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                className
            )}
            {...props}
        >
            <div className="container flex h-12 items-center justify-between px-4">
                {/* Left: Branding */}
                <div className="flex items-center gap-2">
                    {logo || <Briefcase className="size-6 text-primary" />}
                    <span className="font-bold text-lg tracking-tight">{appName}</span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onThemeToggle}
                        title="Toggle Theme"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {isDarkMode ? <Moon className="size-5" /> : <Sun className="size-5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSettingsClick}
                        title="Settings"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="size-5" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
