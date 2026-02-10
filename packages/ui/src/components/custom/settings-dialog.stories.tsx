import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { SettingsDialog } from "./settings-dialog"

const meta = {
    title: "Custom/SettingsDialog",
    component: SettingsDialog,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof SettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

// ─── Interactive Wrapper ─────────────────────────────────────────────

function InteractiveSettingsDialog({
    initialApiKey = "",
    initialModel = "gpt-4o-mini",
    defaultOpen = true,
}: {
    initialApiKey?: string
    initialModel?: string
    defaultOpen?: boolean
}) {
    const [open, setOpen] = React.useState(defaultOpen)
    const [apiKey, setApiKey] = React.useState(initialApiKey)
    const [model, setModel] = React.useState(initialModel)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
                Open Settings
            </button>
            <SettingsDialog
                open={open}
                onOpenChange={setOpen}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                model={model}
                onModelChange={setModel}
            />
        </>
    )
}

// ─── Stories ─────────────────────────────────────────────────────────

/** Default empty state — no API key configured yet. */
export const Default: Story = {
    render: () => <InteractiveSettingsDialog />,
}

/** With API key already configured (masked). */
export const WithAPIKey: Story = {
    render: () => (
        <InteractiveSettingsDialog
            initialApiKey="sk-proj-abc123def456xyz789"
        />
    ),
}

/** GPT-4o model selected instead of default mini. */
export const GPT4oSelected: Story = {
    render: () => (
        <InteractiveSettingsDialog
            initialApiKey="sk-proj-abc123def456xyz789"
            initialModel="gpt-4o"
        />
    ),
}

/** Dialog closed — click button to open. */
export const Closed: Story = {
    render: () => <InteractiveSettingsDialog defaultOpen={false} />,
}

/** Full configuration — API key and custom model. */
export const FullyConfigured: Story = {
    render: () => (
        <InteractiveSettingsDialog
            initialApiKey="sk-proj-my-production-key-here"
            initialModel="gpt-4o"
        />
    ),
}
