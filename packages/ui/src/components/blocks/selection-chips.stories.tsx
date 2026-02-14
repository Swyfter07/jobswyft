import type { Meta, StoryObj } from "@storybook/react-vite"
import { SelectionChips } from "./selection-chips"
import React from "react"

const meta = {
    title: "Blocks/SelectionChips",
    component: SelectionChips,
    parameters: {
        layout: "centered",
        viewport: { defaultViewport: "extensionDefault" },
    },
    tags: ["autodocs"],
} satisfies Meta<typeof SelectionChips>

export default meta
type Story = StoryObj<typeof meta>

const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "confident", label: "Confident" },
    { value: "friendly", label: "Friendly" },
]

const LENGTH_OPTIONS = [
    { value: "short", label: "Short" },
    { value: "medium", label: "Medium" },
    { value: "long", label: "Long" },
]

export const Default: Story = {
    args: {
        label: "Tone",
        options: TONE_OPTIONS,
        value: "professional",
        onChange: () => {},
    },
}

export const Tone: Story = {
    args: {
        label: "Tone",
        options: TONE_OPTIONS,
        value: "professional",
        onChange: () => {},
    },
}

export const Length: Story = {
    args: {
        label: "Length",
        options: LENGTH_OPTIONS,
        value: "medium",
        onChange: () => {},
    },
}

function InteractiveDemo() {
    const [value, setValue] = React.useState("professional")
    return (
        <SelectionChips
            label="Tone"
            options={TONE_OPTIONS}
            value={value}
            onChange={setValue}
        />
    )
}

export const Interactive: Story = {
    render: () => <InteractiveDemo />,
}

export const AllVariants: Story = {
    render: () => {
        const [tone, setTone] = React.useState("professional")
        const [length, setLength] = React.useState("medium")
        return (
            <div className="space-y-6 w-[320px]">
                <SelectionChips label="Tone" options={TONE_OPTIONS} value={tone} onChange={setTone} />
                <SelectionChips label="Length" options={LENGTH_OPTIONS} value={length} onChange={setLength} />
            </div>
        )
    },
}

export const DarkMode: Story = {
    parameters: {
        backgrounds: { default: "dark" },
    },
    decorators: [
        (Story) => (
            <div className="dark p-4 rounded-lg bg-background">
                <Story />
            </div>
        ),
    ],
    args: {
        label: "Tone",
        options: TONE_OPTIONS,
        value: "casual",
        onChange: () => {},
    },
}

export const ExtensionViewport: Story = {
    parameters: {
        viewport: { defaultViewport: "extensionDefault" },
        layout: "centered",
    },
    args: {
        label: "Tone",
        options: TONE_OPTIONS,
        value: "professional",
        onChange: () => {},
    },
}
