import React from "react"
import { cn } from "@/lib/utils"

export interface ExtensionSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    header: React.ReactNode
    children?: React.ReactNode // Content (Resume, Credit, tools)
}

export function ExtensionSidebar({
    header,
    children,
    className,
    ...props
}: ExtensionSidebarProps) {
    return (
        <aside
            className={cn(
                "fixed right-0 top-0 h-screen w-[400px] bg-background flex flex-col z-50",
                className
            )}
            {...props}
        >
            {/* Header Section */}
            <div className="p-2 border-b">
                {header}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {children}
            </div>
        </aside>
    )
}
