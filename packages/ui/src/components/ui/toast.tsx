import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5",
    {
        variants: {
            variant: {
                default: "border bg-background text-foreground",
                success: "border-success/30 bg-success/10 text-success",
                error: "border-destructive/30 bg-destructive/10 text-destructive",
                loading: "border bg-background text-foreground",
                info: "border-info/30 bg-info/10 text-info",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const iconMap = {
    default: null,
    success: CheckCircle2,
    error: AlertCircle,
    loading: Loader2,
    info: Info,
}

export interface ToastProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
    title?: string
    description?: string
    onDismiss?: () => void
    action?: React.ReactNode
}

function Toast({
    className,
    variant = "default",
    title,
    description,
    onDismiss,
    action,
    children,
    ...props
}: ToastProps) {
    const Icon = iconMap[variant || "default"]

    return (
        <div className={cn(toastVariants({ variant }), className)} {...props}>
            <div className="flex items-start gap-3 flex-1">
                {Icon && (
                    <Icon
                        className={cn(
                            "size-5 shrink-0",
                            variant === "loading" && "animate-spin"
                        )}
                    />
                )}
                <div className="flex-1 space-y-1">
                    {title && <p className="text-sm font-semibold leading-none">{title}</p>}
                    {description && (
                        <p className="text-sm opacity-90 leading-snug">{description}</p>
                    )}
                    {children}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {action}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="inline-flex size-6 items-center justify-center rounded-md hover:bg-foreground/10 transition-colors"
                    >
                        <X className="size-4" />
                        <span className="sr-only">Dismiss</span>
                    </button>
                )}
            </div>
        </div>
    )
}

export interface ToastContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
}

const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
}

function ToastContainer({
    className,
    position = "bottom-right",
    children,
    ...props
}: ToastContainerProps) {
    return (
        <div
            className={cn(
                "fixed z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none",
                positionClasses[position],
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export { Toast, ToastContainer, toastVariants }
