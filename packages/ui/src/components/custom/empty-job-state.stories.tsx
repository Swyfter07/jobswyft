import type { Meta, StoryObj } from "@storybook/react"
import { EmptyJobState } from "./empty-job-state"

const meta = {
    title: "Custom/EmptyJobState",
    component: EmptyJobState,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof EmptyJobState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoSupportedSites: Story = {
    args: {
        supportedSites: [],
    },
}

export const CustomMessage: Story = {
    args: {
        title: "No Job Found",
        description: "Please navigate to a valid job posting to begin scanning.",
    },
}
