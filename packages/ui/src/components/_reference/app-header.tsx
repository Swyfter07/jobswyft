import React from "react"
import { Briefcase, Sun, Moon, Settings, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
    appName?: string
    logo?: React.ReactNode
    onProfileClick?: () => void
    onSignOut?: () => void
    onThemeToggle?: () => void
    isDarkMode?: boolean
}

export function AppHeader({
    appName = "JobSwyft",
    logo,
    onProfileClick,
    onSignOut,
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
            <div className="flex h-12 items-center justify-between px-4">
                {/* Left: Branding */}
                <div className="flex items-center gap-2">
                    {logo || <Briefcase className="size-5 text-primary" />}
                    <span className="font-bold text-base tracking-tight">{appName}</span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onThemeToggle}
                        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        className="size-8 text-muted-foreground hover:text-foreground"
                    >
                        {isDarkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Settings"
                                className="size-8 text-muted-foreground hover:text-foreground"
                            >
                                <Settings className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={onProfileClick}>
                                <User className="mr-2 size-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onSignOut}>
                                <LogOut className="mr-2 size-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
