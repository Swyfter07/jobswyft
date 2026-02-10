import React from "react"
import { Autofill } from "./autofill"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export interface AutofillTabProps {
    fields: any[] // Replace with proper type
    isFilling: boolean
    statusMessage?: { title: string; text?: string; type: 'success' | 'info' | 'error' }
    onFill: () => void
    onUndoDismiss: () => void
    onInjectResume: () => void
    applicationCount: number
    motivation: string
    onIncrementApplication: () => void
    onResetApplicationCounter: () => void
}

export function AutofillTab({
    fields,
    isFilling,
    statusMessage,
    onFill,
    onUndoDismiss,
    onInjectResume,
    applicationCount,
    motivation,
    onIncrementApplication,
    onResetApplicationCounter,
}: AutofillTabProps) {
    return (
        <div className="flex flex-col gap-3 p-1">
            {/* Autofill section */}
            <Autofill
                fields={fields}
                isFilling={isFilling}
                statusMessage={statusMessage}
                onFill={onFill}
                onUndoDismiss={onUndoDismiss}
            />

            {/* Resume inject button */}
            <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onInjectResume}
            >
                Upload Resume to Page
            </Button>

            {/* Application Counter */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-white">
                        <div>
                            <div className="text-[10px] uppercase tracking-wide opacity-80">
                                Applications Sent
                            </div>
                            <div className="text-2xl font-extrabold leading-tight">
                                {applicationCount}
                            </div>
                            <div className="mt-0.5 text-[10px] italic opacity-80">
                                {motivation}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                size="xs"
                                variant="secondary"
                                className="bg-white/25 text-white hover:bg-white/40 border-white/40"
                                onClick={onIncrementApplication}
                            >
                                +1 Applied
                            </Button>
                            <button
                                onClick={() => {
                                    if (confirm("Reset application counter?")) onResetApplicationCounter();
                                }}
                                className="text-[9px] text-white/60 hover:text-white/80"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
