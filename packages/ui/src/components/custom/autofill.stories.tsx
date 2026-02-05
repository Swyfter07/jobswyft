import type { Meta, StoryObj } from "@storybook/react"
import { Autofill, AutofillField } from "./autofill"

const meta = {
    title: "Custom/Autofill",
    component: Autofill,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof Autofill>

export default meta
type Story = StoryObj<typeof meta>

const MOCK_FIELDS: AutofillField[] = [
    { id: "1", label: "Full Name", value: "Alex Chen", status: "ready", category: "personal" },
    { id: "2", label: "Email", value: "alex@example.com", status: "ready", category: "personal" },
    { id: "3", label: "Phone", value: "+1 (555) 123-4567", status: "ready", category: "personal" },
    { id: "4", label: "Resume", value: "Senior_Product_Designer.pdf", status: "ready", category: "resume" },
    { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
    { id: "6", label: "LinkedIn URL", value: "linkedin.com/in/alex", status: "filled", category: "questions" },
    { id: "7", label: "Portfolio", value: "alex.design", status: "ready", category: "questions" },
    { id: "8", label: "Why do you want to work here?", value: "I admire the company's...", status: "ready", category: "questions" },
]

export const Default: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
    },
}

export const Filling: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
        isFilling: true,
    },
}

export const Incomplete: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: [
            ...MOCK_FIELDS.slice(0, 3), // Personal info ok
            { id: "4", label: "Resume", status: "missing", category: "resume" }, // Missing resume
            { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
        ]
    },
}

export const FillComplete: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS.map(f => ({ ...f, status: "filled" as const })),
        showUndoPrompt: true,
    },
}

