import React from "react"
import { Coach, Message } from "./coach"

export interface CoachTabProps {
    isLocked: boolean
    hasKey: boolean
    messages: Message[]
    onSendMessage: (content: string) => void
}

export function CoachTab({ isLocked, hasKey, messages, onSendMessage }: CoachTabProps) {
    return (
        <div className="flex flex-col h-full p-1">
            <Coach
                isLocked={isLocked || !hasKey}
                messages={messages}
                onSendMessage={onSendMessage}
                className="h-full"
            />
        </div>
    );
}
