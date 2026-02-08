import type { Meta, StoryObj } from "@storybook/react-vite"
import { SelectionChips } from "./selection-chips"
import React from "react"

const meta = {
    title: "Custom/SelectionChips",
    component: SelectionChips,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
} satisfies Meta<typeof SelectionChips>

export default meta
type Story = StoryObj<typeof meta>

export const Tone: Story = {
    args: {
        label: "Tone",
        options: [
            { value: "professional", label: "Professional" },
            { value: "casual", label: "Casual" },
            { value: "confident", label: "Confident" },
            { value: "friendly", label: "Friendly" },
        ],
        value: "professional",
    },
}

export const Length: Story = {
    args: {
        label: "Length",
        options: [
            { value: "short", label: "Short" },
            { value: "medium", label: "Medium" },
            { value: "long", label: "Long" },
        ],
        value: "medium",
    },
}

function InteractiveDemo() {
    const [value, setValue] = React.useState("professional")
    return (
        <SelectionChips
            label="Tone"
            options={[
                { value: "professional", label: "Professional" },
                { value: "casual", label: "Casual" },
                { value: "confident", label: "Confident" },
                { value: "friendly", label: "Friendly" },
            ]}
            value={value}
            onChange={setValue}
        />
    )
}

export const Interactive: Story = {
    render: () => <InteractiveDemo />,
}
